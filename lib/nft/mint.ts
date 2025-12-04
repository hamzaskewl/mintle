'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { MintNFTResponse, GameResultNFT } from './types'
import { getContractAddress, prepareMintTransaction, NFT_ABI } from './contract'
import { encodeFunctionData, type Address } from 'viem'
import { sendCalls, getCapabilities } from '@wagmi/core'
import { config } from '@/lib/wagmi/config'
import { base, baseSepolia } from 'viem/chains'

/**
 * Mint an NFT using Base account abstraction
 * This uses the Base Mini App SDK to handle transactions
 */
export async function mintNFT(
  gameResult: GameResultNFT,
  userAddress?: string
): Promise<MintNFTResponse> {
  try {
    // First, get metadata from our API
    const metadataResponse = await fetch('/api/nft/mint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...gameResult,
        userAddress: userAddress || await getUserAddress()
      })
    })
    
    if (!metadataResponse.ok) {
      throw new Error('Failed to generate NFT metadata')
    }
    
    const { metadata, metadataUri, tokenId } = await metadataResponse.json()
    
    // Get user address - try multiple methods
    let address = userAddress
    
    if (!address) {
      try {
        // Try to get from Wagmi client
        const client = config.getClient()
        const account = client.account
        if (account?.address) {
          address = account.address
        }
      } catch (e) {
        console.log('Could not get address from Wagmi:', e)
      }
      
      // Fallback to Base SDK context
      if (!address) {
        address = await getUserAddress()
      }
    }
    
    // If we have an address, prepare the mint transaction
    if (address) {
      // Detect environment: Use testnet for web/testing, mainnet for Base Mini App
      // Base Mini App typically runs on mainnet, but we can test on Sepolia in web preview
      let isInBaseApp = false
      let currentNetwork: string | null = null
      
      try {
        if (typeof window !== 'undefined' && sdk) {
          const context = await sdk.context
          isInBaseApp = context !== null && context !== undefined
        }
        
        // Check current network from ethereum provider
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' })
          currentNetwork = chainId
        }
      } catch (e) {
        // Not in Base app context
        isInBaseApp = false
      }
      
      // Determine network: 
      // - If user is on Base Mainnet (0x2105), use mainnet contract (when deployed)
      // - Otherwise, default to Sepolia testnet
      // - Can override with env variable
      const isOnMainnet = currentNetwork === '0x2105' || currentNetwork === '8453'
      const isTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === 'true' || 
                       (!isOnMainnet && process.env.NEXT_PUBLIC_USE_TESTNET !== 'false') ||
                       true // Default to testnet until mainnet contract is deployed
      
      if (isOnMainnet && isTestnet) {
        console.warn('⚠️ User is on Base Mainnet but contract is on Sepolia. Deploy contract to mainnet or switch to Sepolia.')
      }
      
      console.log('Minting environment:', { isInBaseApp, isTestnet, address })
      
      const contractAddress = getContractAddress(isTestnet)
      const mintTx = prepareMintTransaction(address, metadataUri, isTestnet)
      
      // Encode the function call
      const data = encodeFunctionData({
        abi: NFT_ABI,
        functionName: 'safeMint',
        args: [address as `0x${string}`, metadataUri]
      })
      
      // Note: Paymaster will be handled by Wagmi's sendCalls with capabilities
      
      // Send transaction using Wagmi with Base Account
      // This uses sendCalls which works with Base Account and supports paymaster
      try {
        if (!address) {
          throw new Error('No wallet connected. Please connect your wallet to mint.')
        }
        
        const chainId = isTestnet ? baseSepolia.id : base.id
        const account = address as Address
        
        // Check if paymaster capability is supported
        let supportsPaymaster = false
        let paymasterUrl: string | undefined
        
        try {
          const capabilities = await getCapabilities(config as any, { account })
          const baseCapabilities = capabilities[chainId]
          supportsPaymaster = baseCapabilities?.paymasterService?.supported === true
          
          // Get paymaster URL from Coinbase Developer Platform
          // Format: https://api.developer.coinbase.com/rpc/v1/base/YOUR_API_KEY
          // Use the API KEY (not the secret) from CDP
          // Set in .env.local as: NEXT_PUBLIC_PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base/YOUR_API_KEY
          if (supportsPaymaster && process.env.NEXT_PUBLIC_PAYMASTER_URL) {
            paymasterUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL
          }
        } catch (capError) {
          console.log('Could not check paymaster capabilities:', capError)
        }
        
        // Prepare the mint call
        const calls = [
          {
            to: contractAddress as Address,
            data: data as `0x${string}`,
            value: BigInt(0),
          },
        ]
        
        // Send transaction with optional paymaster
        const result = await sendCalls(config as any, {
          account,
          calls,
          chainId,
          capabilities: supportsPaymaster && paymasterUrl
            ? {
                paymasterService: {
                  url: paymasterUrl,
                },
              }
            : undefined,
        })
        
        // sendCalls returns an object with an id property
        const txId = typeof result === 'string' ? result : (result as any).id || 'pending'
        
        console.log('✅ Transaction sent via Base Account! ID:', txId)
        console.log('✅ Paymaster sponsored:', supportsPaymaster && !!paymasterUrl)
        
        // Note: sendCalls returns a transaction ID
        // The transaction will be executed by the Base Account
        // The actual transaction hash will be available after confirmation
        
        const baseScanUrl = isTestnet
          ? `https://sepolia.basescan.org`
          : `https://basescan.org`
        
        console.log('🎉 NFT mint initiated! Transaction ID:', txId)
        console.log('View on BaseScan:', baseScanUrl)
        
        return {
          success: true,
          metadataUri,
          tokenId,
          txHash: txId, // Transaction ID - will be confirmed by Base Account
          paymasterSponsored: supportsPaymaster && !!paymasterUrl,
        }
      } catch (txError: any) {
        console.error('Transaction error:', txError)
        
        // If user rejected, don't show error
        if (txError.code === 4001 || txError.message?.includes('User rejected') || txError.message?.includes('rejected')) {
          return {
            success: false,
            error: 'Transaction cancelled by user',
            metadataUri,
            tokenId,
          }
        }
        
        // Otherwise, return metadata but note transaction failed
        return {
          success: true,
          metadataUri,
          tokenId,
          paymasterSponsored: false,
          error: `Transaction failed: ${txError.message}. Metadata generated successfully.`,
        }
      }
      
      // Fallback: If no ethereum provider, return metadata
      // User can manually mint later
      console.warn('⚠️ No ethereum provider found. Metadata generated but transaction not sent.')
      console.log('Transaction data:', { to: contractAddress, data, value: '0' })
      
      return {
        success: true,
        metadataUri,
        tokenId,
        paymasterSponsored: false,
        txData: {
          to: contractAddress,
          data: data as `0x${string}`,
          value: '0'
        },
        error: 'No wallet connected. Please connect a wallet to mint on-chain.'
      }
      
      // Fallback: return metadata with transaction data for manual minting
      return {
        success: true,
        metadataUri,
        tokenId,
        // Transaction data for manual minting
        txData: {
          to: contractAddress,
          data,
          value: '0'
        }
      }
    }
    
    // No address available - still return success with metadata for sharing
    // User can share their result even without minting
    return {
      success: true,
      metadataUri,
      tokenId,
      error: 'User address not available. Metadata generated - you can share your result!'
    }
    
  } catch (error) {
    console.error('Mint NFT error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mint NFT'
    }
  }
}

/**
 * Get user address from Base Mini App SDK
 * Attempts to extract address from SDK context
 */
async function getUserAddress(): Promise<string | undefined> {
  try {
    if (typeof window !== 'undefined' && sdk) {
      const context = await sdk.context
      
      // Try different possible property paths based on Base SDK structure
      // The actual structure may vary - check Base SDK documentation
      if (context) {
        // Try common property paths
        const possiblePaths = [
          (context as any).user?.address,
          (context as any).address,
          (context as any).wallet?.address,
          (context as any).account?.address,
        ]
        
        for (const address of possiblePaths) {
          if (address && typeof address === 'string' && address.startsWith('0x')) {
            return address
          }
        }
      }
    }
  } catch (error) {
    console.error('Error getting user address:', error)
  }
  return undefined
}

/**
 * Share result to Base social feed
 */
export async function shareToBase(
  gameResult: GameResultNFT,
  nftUrl?: string,
  txHash?: string
): Promise<boolean> {
  try {
    const categoryEmoji = gameResult.category === 'movies' ? '🎬' : '🎵'
    const resultPattern = gameResult.results
      .map(r => r === 'correct' ? '🟢' : '🔴')
      .join('')
    
    const nftText = txHash 
      ? `🎉 NFT Minted on-chain!\nView: ${nftUrl}\n\n`
      : nftUrl 
        ? `NFT Metadata: ${nftUrl}\n\n`
        : ''
    
    const shareText = `${categoryEmoji} Mintle ${gameResult.category === 'movies' ? 'Movies' : 'Spotify'}\n\n` +
      `Score: ${gameResult.score}/${gameResult.total}\n` +
      `${resultPattern}\n` +
      `Streak: ${gameResult.streak} days 🔥\n\n` +
      nftText +
      `Play: https://morless.vercel.app`
    
    if (typeof window !== 'undefined' && sdk) {
      // Use Base SDK to share
      // Note: Check Base SDK docs for exact sharing method
      try {
        await sdk.actions.openUrl(
          `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`
        )
        return true
      } catch (sdkError) {
        console.error('Base SDK share error:', sdkError)
        // Fall through to Web Share API
      }
    }
    
    // Fallback to Web Share API
    if (typeof window !== 'undefined' && navigator.share) {
      await navigator.share({
        title: 'Mintle Game Result',
        text: shareText,
        url: nftUrl || 'https://morless.vercel.app'
      })
      return true
    }
    
    // Final fallback: copy to clipboard
    if (typeof window !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareText)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Share error:', error)
    return false
  }
}

