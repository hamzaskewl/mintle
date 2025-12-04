import { NextResponse } from 'next/server'
import { getDailySeed, seededShuffle } from '@/lib/game/daily-seed'
import { supabase } from '@/lib/db/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface VerifyRequest {
  category: 'movies' | 'spotify'
  currentId: string
  nextId: string
  guess: 'higher' | 'lower'
}

/**
 * Verify a guess server-side to prevent cheating
 * Returns: { correct: boolean, currentValue: number, nextValue: number }
 */
export async function POST(request: Request) {
  try {
    const body: VerifyRequest = await request.json()
    const { category, currentId, nextId, guess } = body
    
    let currentValue: number
    let nextValue: number
    
    if (category === 'spotify') {
      // Get from daily_games or fetch live
      const date = getDailySeed()
      const { data: dailyItems } = await supabase
        .from('daily_games')
        .select('*')
        .eq('category', 'spotify')
        .eq('game_date', date)
        .in('external_id', [currentId, nextId])
      
      if (dailyItems && dailyItems.length === 2) {
        const current = dailyItems.find(item => item.external_id === currentId)
        const next = dailyItems.find(item => item.external_id === nextId)
        if (current && next) {
          currentValue = Number(current.value)
          nextValue = Number(next.value)
        } else {
          throw new Error('Items not found in daily games')
        }
      } else {
        // Fallback: fetch from kworb (for endless mode)
        const { scrapeSpotifyListeners, artistsToGameItems } = await import('@/lib/api/kworb-scraper')
        const scrapedArtists = await scrapeSpotifyListeners()
        const allArtists = artistsToGameItems(scrapedArtists)
        const current = allArtists.find(a => a.id === currentId)
        const next = allArtists.find(a => a.id === nextId)
        
        if (!current || !next) {
          return NextResponse.json({ error: 'Items not found' }, { status: 404 })
        }
        
        currentValue = current.value
        nextValue = next.value
      }
    } else {
      // Movies: Get from daily_games or fetch from OMDB
      const date = getDailySeed()
      const { data: dailyItems } = await supabase
        .from('daily_games')
        .select('*')
        .eq('category', 'movies')
        .eq('game_date', date)
        .in('external_id', [currentId, nextId])
      
      if (dailyItems && dailyItems.length === 2) {
        const current = dailyItems.find(item => item.external_id === currentId)
        const next = dailyItems.find(item => item.external_id === nextId)
        if (current && next) {
          currentValue = Number(current.value)
          nextValue = Number(next.value)
        } else {
          throw new Error('Items not found in daily games')
        }
      } else {
        // Fallback: fetch from OMDB (for endless mode or on-demand daily)
        const { fetchOMDBRating } = await import('@/lib/api/omdb')
        
        console.log(`Fetching OMDB ratings for: ${currentId}, ${nextId}`)
        
        const [currentData, nextData] = await Promise.all([
          fetchOMDBRating(currentId),
          fetchOMDBRating(nextId)
        ])
        
        console.log(`OMDB results:`, { 
          current: currentData?.imdbRating, 
          next: nextData?.imdbRating 
        })
        
        if (!currentData || !currentData.imdbRating || currentData.imdbRating === 'N/A') {
          return NextResponse.json({ 
            error: `Rating not found for ${currentId}`,
            details: currentData ? 'Rating is N/A' : 'Movie not found'
          }, { status: 404 })
        }
        
        if (!nextData || !nextData.imdbRating || nextData.imdbRating === 'N/A') {
          return NextResponse.json({ 
            error: `Rating not found for ${nextId}`,
            details: nextData ? 'Rating is N/A' : 'Movie not found'
          }, { status: 404 })
        }
        
        currentValue = parseFloat(currentData.imdbRating)
        nextValue = parseFloat(nextData.imdbRating)
        
        if (isNaN(currentValue) || isNaN(nextValue)) {
          return NextResponse.json({ 
            error: 'Invalid rating values',
            details: { currentValue, nextValue }
          }, { status: 500 })
        }
      }
    }
    
    // Check if guess is correct
    let correct = false
    if (guess === 'higher') {
      correct = nextValue > currentValue
    } else {
      correct = nextValue < currentValue
    }
    
    return NextResponse.json({
      correct,
      currentValue,
      nextValue,
    })
  } catch (error) {
    console.error('Error verifying guess:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json(
      { 
        error: 'Failed to verify guess', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}

