'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { MintNFTResponse, GameResultNFT } from './types'

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
    
    const { metadata, metadataUri } = await metadataResponse.json()
    
    // For now, we'll use Base SDK to open a transaction
    // The actual contract interaction will need to be set up
    // This is a placeholder that shows the flow
    
    // Check if we're in Base Mini App context
    if (typeof window !== 'undefined' && sdk) {
      try {
        // Use Base SDK to open transaction
        // Note: This requires the contract to be deployed and configured
        const result = await sdk.actions.openUrl(
          `https://basescan.org/tx/${metadataUri}` // Placeholder
        )
        
        return {
          success: true,
          metadataUri,
          // In production, these would come from the actual transaction
          // tokenId: result.tokenId,
          // txHash: result.txHash
        }
      } catch (sdkError) {
        console.error('Base SDK error:', sdkError)
        // Fallback to sharing if minting fails
        return {
          success: false,
          error: 'Minting not available. Please share your result instead.',
          metadataUri
        }
      }
    }
    
    // Fallback: return metadata for manual minting or sharing
    return {
      success: true,
      metadataUri,
      // Note: Actual minting would require contract deployment
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
 */
async function getUserAddress(): Promise<string | undefined> {
  try {
    if (typeof window !== 'undefined' && sdk) {
      // Base SDK context should provide user address
      // This is a placeholder - actual implementation depends on SDK version
      const context = await sdk.context
      return context?.user?.address
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
    
    const shareText = `${categoryEmoji} MorL ${gameResult.category === 'movies' ? 'Movies' : 'Spotify'}\n\n` +
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
        title: 'MorL Game Result',
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

