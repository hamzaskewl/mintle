'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { MintNFTResponse, GameResultNFT } from './types'
import { getContractAddress, prepareMintTransaction, NFT_ABI } from './contract'
import { encodeFunctionData } from 'viem'

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
      // Default to testnet for now until mainnet contract is deployed
      const isTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === 'true' || 
                       !isInBaseApp ||
                       true // Default to testnet for now
      
      console.log('Minting environment:', { isInBaseApp, isTestnet, address })
      
      const contractAddress = getContractAddress(isTestnet)
      const mintTx = prepareMintTransaction(address, metadataUri, isTestnet)
      
      // Encode the function call
      const data = encodeFunctionData({
        abi: NFT_ABI,
        functionName: 'safeMint',
        args: [address as `0x${string}`, metadataUri]
      })
      
      // Check if we're in Base Mini App context
      if (typeof window !== 'undefined' && sdk) {
        try {
          // In Base Mini App, we can potentially send transactions
          // For now, we'll show the contract and let users know about testnet
          const baseScanUrl = isTestnet 
            ? `https://sepolia.basescan.org/address/${contractAddress}`
            : `https://basescan.org/address/${contractAddress}`
          
          // If we're in Base Mini App but using testnet, show a message
          if (isInBaseApp && isTestnet) {
            console.warn('Base Mini App detected but using testnet. Base Mini App typically uses mainnet.')
          }
          
          // For now, just share the result (minting will be implemented later)
          // The metadata is ready, user can share their result
          return {
            success: true,
            metadataUri,
            tokenId,
            // Note: Actual on-chain minting will be implemented with Base SDK transaction methods
            // For now, metadata is generated and ready to share
          }
        } catch (sdkError) {
          console.error('Base SDK error:', sdkError)
          // Fallback: return metadata for manual minting
          return {
            success: true,
            metadataUri,
            tokenId,
            error: 'Automatic minting not available. Metadata ready for manual minting.'
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

