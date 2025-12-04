'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { MintNFTResponse, GameResultNFT } from './types'
import { getContractAddress, prepareMintTransaction, NFT_ABI } from './contract'
import { encodeFunctionData } from 'viem'
import { getPaymasterSponsorship, prepareUserOperation, sendUserOperation } from './account-abstraction'
import { createWalletClient, http, type Address } from 'viem'
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
      // Try to get from ethereum provider first (most reliable)
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
          address = accounts[0]
        } catch (e) {
          console.log('Could not get address from ethereum provider:', e)
        }
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
      
      // Prepare user operation for account abstraction
      const chainId = isTestnet ? '84532' : '8453' // Base Sepolia or Base Mainnet
      
      // Get nonce (simplified - in production, fetch from contract)
      // For now, use 0 - in production you'd fetch the actual nonce
      const userOp = prepareUserOperation(
        address as Address,
        contractAddress as Address,
        metadataUri,
        BigInt(0)
      )
      
      // Get paymaster sponsorship for gasless transaction
      const paymasterData = await getPaymasterSponsorship(userOp, chainId)
      
      if (paymasterData) {
        // Apply paymaster data to user operation
        userOp.paymasterAndData = paymasterData.paymasterAndData || ('0x' as any)
        userOp.verificationGasLimit = paymasterData.verificationGasLimit || ('0x0' as any)
        userOp.callGasLimit = paymasterData.callGasLimit || ('0x0' as any)
        userOp.preVerificationGas = paymasterData.preVerificationGas || ('0x0' as any)
        console.log('✅ Paymaster sponsorship obtained - transaction will be gasless!')
      } else {
        console.warn('⚠️ Paymaster sponsorship not available - user will pay gas')
      }
      
      // Try to send transaction directly using ethereum provider
      // This will work in Base Mini App or any wallet context
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const ethereum = (window as any).ethereum
          
          // Request account access (if not already connected)
          let userAddress = address
          if (!userAddress) {
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
            userAddress = accounts[0]
          }
          
          if (!userAddress) {
            throw new Error('No wallet connected. Please connect your wallet to mint.')
          }
          
          // Get the correct network
          const networkId = await ethereum.request({ method: 'eth_chainId' })
          const expectedChainId = isTestnet ? '0x14a34' : '0x2105' // Base Sepolia or Base Mainnet
          
          if (networkId !== expectedChainId) {
            // Try to switch network
            try {
              await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: expectedChainId }],
              })
            } catch (switchError: any) {
              // If network doesn't exist, add it
              if (switchError.code === 4902) {
                const chainConfig = isTestnet ? {
                  chainId: '0x14a34',
                  chainName: 'Base Sepolia',
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://sepolia.base.org'],
                  blockExplorerUrls: ['https://sepolia-explorer.base.org']
                } : {
                  chainId: '0x2105',
                  chainName: 'Base',
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org']
                }
                
                await ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [chainConfig],
                })
              } else {
                throw switchError
              }
            }
          }
          
          // Estimate gas
          const gasEstimate = await ethereum.request({
            method: 'eth_estimateGas',
            params: [{
              from: userAddress,
              to: contractAddress,
              data: data,
            }]
          })
          
          // Send transaction
          const txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: userAddress,
              to: contractAddress,
              data: data,
              value: '0x0',
              gas: gasEstimate,
            }]
          })
          
          console.log('✅ Transaction sent! Hash:', txHash)
          
          const baseScanUrl = isTestnet
            ? `https://sepolia.basescan.org/tx/${txHash}`
            : `https://basescan.org/tx/${txHash}`
          
          console.log('🎉 NFT minted! View on BaseScan:', baseScanUrl)
          
          return {
            success: true,
            metadataUri,
            tokenId,
            txHash,
            paymasterSponsored: !!paymasterData,
          }
        } catch (txError: any) {
          console.error('Transaction error:', txError)
          
          // If user rejected, don't show error
          if (txError.code === 4001 || txError.message?.includes('User rejected')) {
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
            paymasterSponsored: !!paymasterData,
            error: `Transaction failed: ${txError.message}. Metadata generated successfully.`,
          }
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
        paymasterSponsored: !!paymasterData,
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

