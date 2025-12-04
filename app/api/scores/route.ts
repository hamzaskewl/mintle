import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'

export const dynamic = 'force-dynamic'

/**
 * Save a game score to the leaderboard
 * POST /api/scores
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, category, score, gameDate } = body
    
    if (!walletAddress || !category || score === undefined || !gameDate) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, category, score, gameDate' },
        { status: 400 }
      )
    }
    
    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
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
    
    // Upsert score (update if exists for same date, otherwise insert)
    const { data, error } = await supabase
      .from('scores')
      .upsert({
        wallet_address: walletAddress.toLowerCase(), // Normalize to lowercase
        category,
        game_date: gameDate,
        score: parseInt(score.toString()),
      }, {
        onConflict: 'wallet_address,category,game_date'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error saving score:', error)
      return NextResponse.json(
        { error: 'Failed to save score', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      score: data
    })
    
  } catch (error) {
    console.error('Score save error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

