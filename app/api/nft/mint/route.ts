import { NextResponse } from 'next/server'
import { generateNFTMetadata, generateNFTImageUrl } from '@/lib/nft/metadata'
import { GameResultNFT, MintNFTResponse } from '@/lib/nft/types'
import { supabase } from '@/lib/db/supabase'

export const dynamic = 'force-dynamic'

/**
 * API endpoint to mint an NFT for a completed game
 * This endpoint generates metadata and returns minting instructions
 * The actual minting happens client-side using account abstraction
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      category, 
      score, 
      total, 
      results, 
      streak,
      userAddress 
    } = body
    
    if (!category || score === undefined || !results || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const gameResult: GameResultNFT = {
      category,
      score,
      total,
      results,
      date: new Date().toISOString().split('T')[0],
      streak: streak || 0,
      perfect: score === total
    }
    
    // Generate metadata
    const imageUrl = generateNFTImageUrl(gameResult)
    const metadata = generateNFTMetadata(gameResult, imageUrl)
    
    // Generate a unique token ID (in production, this comes from the contract)
    // For now, use timestamp + random to ensure uniqueness
    const tokenId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const metadataUri = `https://morless.vercel.app/api/nft/metadata/${tokenId}`
    
    // Store metadata in database for the metadata endpoint to serve
    // This allows OpenSea, BaseScan, etc. to fetch metadata
    try {
      const { error: dbError } = await supabase
        .from('nft_metadata')
        .insert({
          token_id: tokenId,
          category: category,
          score: score,
          total: total,
          results: results,
          streak: streak || 0,
          perfect: score === total,
          date: new Date().toISOString().split('T')[0],
          metadata: metadata,
          image_url: imageUrl,
          minted_by: userAddress
        })
      
      if (dbError) {
        console.error('Database error (non-fatal):', dbError)
        // Continue even if DB insert fails - metadata can be generated on-the-fly
      }
    } catch (dbErr) {
      console.error('Database insert error (non-fatal):', dbErr)
      // Continue - metadata endpoint can generate on-the-fly
    }
    
    // Return metadata and URI for minting
    return NextResponse.json({
      success: true,
      metadata,
      metadataUri,
      tokenId, // Return token ID so client knows what to use
      imageUrl,
      gameResult
    } as MintNFTResponse)
    
  } catch (error) {
    console.error('NFT mint error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate NFT metadata',
        details: String(error)
      } as MintNFTResponse,
      { status: 500 }
    )
  }
}

