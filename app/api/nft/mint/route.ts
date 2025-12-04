import { NextResponse } from 'next/server'
import { generateNFTMetadata, generateNFTImageUrl } from '@/lib/nft/metadata'
import { GameResultNFT, MintNFTResponse } from '@/lib/nft/types'
import { supabase } from '@/lib/db/supabase'
import { signMintMessage, getSignerAddress } from '@/lib/nft/signature'
import { getContractAddress } from '@/lib/nft/contract'
import { baseSepolia, base } from 'viem/chains'

export const dynamic = 'force-dynamic'

/**
 * API endpoint to mint an NFT for a completed game
 * This endpoint:
 * 1. Verifies the user actually played and got this score (from database)
 * 2. Checks if they've already minted for this day/category
 * 3. Generates metadata and signs it with server private key
 * 4. Returns signed metadata for on-chain minting
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
        { error: 'Missing required fields: category, score, results, userAddress' },
        { status: 400 }
      )
    }
    
    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }
    
    // Validate category
    if (!['movies', 'spotify'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be "movies" or "spotify"' },
        { status: 400 }
      )
    }
    
    const gameDate = new Date().toISOString().split('T')[0]
    const normalizedAddress = userAddress.toLowerCase()
    
    // STEP 1: Verify the user actually played and got this score
    const { data: scoreData, error: scoreError } = await supabase
      .from('scores')
      .select('score, wallet_address, category, game_date')
      .eq('wallet_address', normalizedAddress)
      .eq('category', category)
      .eq('game_date', gameDate)
      .single()
    
    if (scoreError || !scoreData) {
      return NextResponse.json(
        { error: 'No game result found. Please complete a game first.' },
        { status: 404 }
      )
    }
    
    // Verify the score matches
    if (scoreData.score !== score) {
      return NextResponse.json(
        { error: 'Score mismatch. Your actual score does not match the requested score.' },
        { status: 403 }
      )
    }
    
    // STEP 2: Check if user has already minted for this day/category
    const { data: existingMint } = await supabase
      .from('nft_metadata')
      .select('token_id, minted_by, date, category')
      .eq('minted_by', normalizedAddress)
      .eq('category', category)
      .eq('date', gameDate)
      .limit(1)
    
    if (existingMint && existingMint.length > 0) {
      return NextResponse.json(
        { error: 'You have already minted an NFT for this game. One mint per day per category.' },
        { status: 409 }
      )
    }
    
    // STEP 3: Generate metadata
    const gameResult: GameResultNFT = {
      category,
      score,
      total,
      results,
      date: gameDate,
      streak: streak || 0,
      perfect: score === total
    }
    
    const imageUrl = generateNFTImageUrl(gameResult)
    const metadata = generateNFTMetadata(gameResult, imageUrl)
    
    // Generate a unique token ID
    const tokenId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const metadataUri = `https://mintle.vercel.app/api/nft/metadata/${tokenId}`
    
    // STEP 4: Sign the mint message
    const privateKey = process.env.NFT_SIGNER_PRIVATE_KEY
    if (!privateKey) {
      console.error('NFT_SIGNER_PRIVATE_KEY not set in environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    // Determine chain ID (default to Sepolia for now)
    const isTestnet = process.env.NEXT_PUBLIC_USE_TESTNET !== 'false'
    const chainId = isTestnet ? baseSepolia.id : base.id
    const contractAddress = getContractAddress(isTestnet)
    
    // Create signature
    const signature = await signMintMessage(
      normalizedAddress,
      metadataUri,
      score,
      category,
      gameDate,
      chainId,
      contractAddress,
      privateKey as `0x${string}`
    )
    
    // STEP 5: Store metadata in database (before minting, so we can track it)
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
          date: gameDate,
          metadata: metadata,
          image_url: imageUrl,
          minted_by: normalizedAddress
        })
      
      if (dbError) {
        console.error('Database error (non-fatal):', dbError)
        // Continue - metadata endpoint can generate on-the-fly
      }
    } catch (dbErr) {
      console.error('Database insert error (non-fatal):', dbErr)
      // Continue - metadata endpoint can generate on-the-fly
    }
    
    // Return metadata, URI, and signature for minting
    return NextResponse.json({
      success: true,
      metadata,
      metadataUri,
      tokenId,
      imageUrl,
      gameResult,
      signature, // Include signature for contract verification
      signerAddress: getSignerAddress(privateKey as `0x${string}`) // For debugging/verification
    } as MintNFTResponse & { signature: string; signerAddress: string })
    
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

