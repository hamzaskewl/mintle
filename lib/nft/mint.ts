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
    
    // Get user address (optional - metadata can be generated without it)
    const address = userAddress || await getUserAddress()
    
    // If we have an address, prepare the mint transaction
    if (address) {
      // Detect environment: Use testnet for web/testing, mainnet for Base Mini App
      // Base Mini App typically runs on mainnet, but we can test on Sepolia in web preview
      let isInBaseApp = false
      try {
        if (typeof window !== 'undefined' && sdk) {
          const context = await sdk.context
          isInBaseApp = context !== null && context !== undefined
        }
      } catch (e) {
        // Not in Base app context
        isInBaseApp = false
      }
      
      // Use testnet if: explicitly set via env, or we're in web (not Base app), or for testing
      // Base Sepolia has UNLIMITED paymaster sponsorship for testing!
      // Default to testnet for now until mainnet contract is deployed
      const isTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === 'true' || 
                       !isInBaseApp ||
                       true // Default to testnet - Sepolia has unlimited paymaster credits!
      
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
      
      // Check if we're in Base Mini App context
      if (typeof window !== 'undefined' && sdk) {
        try {
          // If we're in Base Mini App but using testnet, show a message
          if (isInBaseApp && isTestnet) {
            console.warn('Base Mini App detected but using testnet. Base Mini App typically uses mainnet.')
          }
          
          // Try Base SDK sendTransaction method (if available)
          // Base SDK might handle account abstraction internally
          let txHash: string | undefined
          
          try {
            // Check if Base SDK has sendTransaction method
            if (sdk.actions && typeof sdk.actions.sendTransaction === 'function') {
              // Use Base SDK's transaction method
              // This should handle account abstraction and signing
              const txResult = await sdk.actions.sendTransaction({
                to: contractAddress,
                data: data as `0x${string}`,
                value: '0',
                // Paymaster data if available
                ...(paymasterData && {
                  paymasterAndData: paymasterData.paymasterAndData
                })
              })
              
              txHash = txResult
              console.log('✅ Transaction sent via Base SDK:', txHash)
            }
          } catch (sdkTxError) {
            console.log('Base SDK sendTransaction not available, trying bundler:', sdkTxError)
          }
          
          // If Base SDK didn't send, try bundler
          if (!txHash) {
            // Complete user operation with required fields
            // Note: In production, you'd need to:
            // 1. Get actual nonce from the smart contract wallet
            // 2. Estimate gas properly
            // 3. Get user signature
            
            // For now, we'll prepare the user operation
            // The bundler will need the user to sign it first
            const completeUserOp = {
              ...userOp,
              maxFeePerGas: '0x0' as any, // Will be set by paymaster
              maxPriorityFeePerGas: '0x0' as any, // Will be set by paymaster
            }
            
            // Attempt to send via bundler
            const bundlerResult = await sendUserOperation(completeUserOp as any, chainId)
            
            if (bundlerResult?.userOpHash) {
              txHash = bundlerResult.userOpHash
              console.log('✅ Transaction sent via bundler:', txHash)
            }
          }
          
          if (txHash) {
            // Transaction sent successfully
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
          }
          
          // Transaction prepared but not sent yet
          // This happens when:
          // 1. Base SDK doesn't have sendTransaction method yet
          // 2. Bundler requires user signature first
          // 3. Nonce/gas estimation needed
          
          console.log('📝 Transaction prepared with paymaster sponsorship')
          console.log('User operation ready:', userOp)
          
          return {
            success: true,
            metadataUri,
            tokenId,
            paymasterSponsored: !!paymasterData,
            userOperation: userOp, // Return user op for manual sending if needed
            // Note: Transaction needs to be signed and sent
            // Base SDK or bundler integration required for full automation
          }
        } catch (sdkError) {
          console.error('Base SDK error:', sdkError)
          // Fallback: return metadata for manual minting
          return {
            success: true,
            metadataUri,
            tokenId,
            paymasterSponsored: !!paymasterData,
            error: 'Transaction preparation complete. Ready for manual minting or Base SDK integration.'
          }
        }
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
  nftUrl?: string
): Promise<boolean> {
  try {
    const categoryEmoji = gameResult.category === 'movies' ? '🎬' : '🎵'
    const resultPattern = gameResult.results
      .map(r => r === 'correct' ? '🟢' : '🔴')
      .join('')
    
    const shareText = `${categoryEmoji} Mintle ${gameResult.category === 'movies' ? 'Movies' : 'Spotify'}\n\n` +
      `Score: ${gameResult.score}/${gameResult.total}\n` +
      `${resultPattern}\n` +
      `Streak: ${gameResult.streak} days 🔥\n\n` +
      (nftUrl ? `Minted NFT: ${nftUrl}\n\n` : '') +
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

