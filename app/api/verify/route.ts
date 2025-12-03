import { NextResponse } from 'next/server'
import { getDailySeed, seededShuffle } from '@/lib/game/daily-seed'
import { supabase } from '@/lib/db/supabase'
import { getTopArtists } from '@/lib/db/queries'
import { fetchMultipleMovies } from '@/lib/api/omdb'
import moviesList from '@/data/movies.json'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface VerifyRequest {
  category: 'movies' | 'spotify'
  date: string
  round: number // 0-4 (which comparison)
  guess: 'higher' | 'lower'
}

/**
 * Verify a guess server-side to prevent cheating
 * Returns: { correct: boolean, currentValue: number, nextValue: number }
 */
export async function POST(request: Request) {
  try {
    const body: VerifyRequest = await request.json()
    const { category, date, round, guess } = body
    
    // Verify it's for today
    const today = getDailySeed()
    if (date !== today) {
      return NextResponse.json(
        { error: 'Invalid date - game is for today only' },
        { status: 400 }
      )
    }
    
    // Try to get prepared game first
    const { data: dailyItems } = await supabase
      .from('daily_games')
      .select('*')
      .eq('category', category)
      .eq('game_date', date)
      .order('position')
    
    let currentValue: number
    let nextValue: number
    
    if (dailyItems && dailyItems.length >= round + 2) {
      // Use prepared game data
      currentValue = Number(dailyItems[round].value)
      nextValue = Number(dailyItems[round + 1].value)
    } else {
      // Fallback: generate same game as API endpoint
      if (category === 'spotify') {
        // Scrape live from kworb
        const { scrapeSpotifyListeners, artistsToGameItems } = await import('@/lib/api/kworb-scraper')
        const scrapedArtists = await scrapeSpotifyListeners()
        const allArtists = artistsToGameItems(scrapedArtists)
        const shuffled = seededShuffle(allArtists, date)
        const items = shuffled.slice(0, 6)
        
        if (items.length < round + 2) {
          return NextResponse.json({ error: 'Not enough data' }, { status: 500 })
        }
        
        currentValue = items[round].value
        nextValue = items[round + 1].value
      } else {
        // Movies fallback
        const shuffled = seededShuffle(moviesList, date)
        const selectedMovies = shuffled.slice(0, 6)
        const movieIds = selectedMovies.map(m => m.id)
        const items = await fetchMultipleMovies(movieIds)
        
        if (items.length < round + 2) {
          return NextResponse.json({ error: 'Not enough data' }, { status: 500 })
        }
        
        currentValue = items[round].value
        nextValue = items[round + 1].value
      }
    }
    
    // Check if guess is correct
    let correct = false
    if (guess === 'higher') {
      correct = nextValue >= currentValue
    } else {
      correct = nextValue <= currentValue
    }
    
    return NextResponse.json({
      correct,
      currentValue,
      nextValue,
    })
  } catch (error) {
    console.error('Error verifying guess:', error)
    return NextResponse.json(
      { error: 'Failed to verify guess', details: String(error) },
      { status: 500 }
    )
  }
}

