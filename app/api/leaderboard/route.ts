import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'

export const dynamic = 'force-dynamic'

/**
 * Get leaderboard data
 * GET /api/leaderboard?category=spotify&date=2024-01-01&limit=100
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'spotify'
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const limit = parseInt(searchParams.get('limit') || '100')
    
    // Validate category
    if (!['movies', 'spotify'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be "movies" or "spotify"' },
        { status: 400 }
      )
    }
    
    // Get scores for the specified date and category, ordered by score descending
    const { data: scores, error } = await supabase
      .from('scores')
      .select('wallet_address, score, created_at')
      .eq('category', category)
      .eq('game_date', date)
      .order('score', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching leaderboard:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard', details: error.message },
        { status: 500 }
      )
    }
    
    // Calculate streaks for each wallet address
    // Get all scores for each wallet to calculate current streak
    const walletAddresses = [...new Set(scores?.map(s => s.wallet_address) || [])]
    
    const streakData: Record<string, number> = {}
    
    // For each wallet, calculate current streak
    for (const address of walletAddresses) {
      const { data: allScores } = await supabase
        .from('scores')
        .select('game_date, category')
        .eq('wallet_address', address)
        .eq('category', category)
        .order('game_date', { ascending: false })
      
      if (allScores && allScores.length > 0) {
        // Calculate streak: consecutive days played
        let streak = 0
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        for (let i = 0; i < allScores.length; i++) {
          const scoreDate = new Date(allScores[i].game_date)
          scoreDate.setHours(0, 0, 0, 0)
          
          const expectedDate = new Date(today)
          expectedDate.setDate(today.getDate() - i)
          
          if (scoreDate.getTime() === expectedDate.getTime()) {
            streak++
          } else {
            break
          }
        }
        
        streakData[address] = streak
      }
    }
    
    // Format leaderboard entries with ranks
    const leaderboard = (scores || []).map((entry, index) => ({
      rank: index + 1,
      walletAddress: entry.wallet_address,
      score: entry.score,
      streak: streakData[entry.wallet_address] || 0,
      date: entry.created_at
    }))
    
    return NextResponse.json({
      success: true,
      leaderboard,
      category,
      date,
      total: leaderboard.length
    })
    
  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

