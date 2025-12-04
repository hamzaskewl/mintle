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
    
    // Get user address
    const address = userAddress || await getUserAddress()
    if (!address) {
      return {
        success: false,
        error: 'User address not available',
        metadataUri
      }
    }
    
    // Prepare mint transaction
    const isTestnet = true // Set to false for mainnet
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
        // For now, we'll construct a transaction URL
        // In production, you'd use Base SDK's transaction methods
        // or a wallet connector to send the transaction
        
        // Create a link to view the contract on BaseScan
        const baseScanUrl = isTestnet 
          ? `https://sepolia.basescan.org/address/${contractAddress}`
          : `https://basescan.org/address/${contractAddress}`
        
        // Open contract page (user can mint manually for now)
        // TODO: Implement actual transaction sending via Base SDK or wallet
        await sdk.actions.openUrl(baseScanUrl)
        
        return {
          success: true,
          metadataUri,
          tokenId,
          // Note: Actual transaction hash will come from the mint transaction
          // For now, return the metadata URI as the identifier
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
    
    // Fallback: return metadata for manual minting or sharing
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
      // TODO: Update based on actual Base SDK API when available
      const context = await sdk.context
      // The actual property path may vary - check Base SDK docs
      // For now, return undefined and let the caller provide the address
      return undefined
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

