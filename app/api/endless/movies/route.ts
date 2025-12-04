import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'
import { GameItem } from '@/lib/game/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Endless mode - fetch random movies from pool
 */
export async function GET() {
  try {
    // Check if movies_pool exists and has data
    const { data: poolMovies, error: poolError } = await supabase
      .from('movies_pool')
      .select('*')
      .limit(100)
    
    if (poolError || !poolMovies || poolMovies.length === 0) {
      return NextResponse.json(
        { 
          error: 'No movies in pool. Please run: npm run populate-movies',
          details: String(poolError)
        },
        { status: 500 }
      )
    }
    
    // Shuffle and pick 20 random movies (enough for a session)
    const shuffled = poolMovies.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, 20)
    
    // Fetch IMDB ratings for these movies
    const { fetchOMDBRating } = await import('@/lib/api/omdb')
    
    const items: GameItem[] = []
    
    for (const movie of selected) {
      const omdbData = await fetchOMDBRating(movie.imdb_id)
      
      if (omdbData && omdbData.imdbRating && omdbData.imdbRating !== 'N/A') {
        items.push({
          id: movie.imdb_id,
          name: movie.title,
          value: parseFloat(omdbData.imdbRating),
          imageUrl: omdbData.Poster !== 'N/A' ? omdbData.Poster : movie.poster_url,
          subtitle: movie.year,
        })
      }
      
      if (items.length >= 15) break // Stop once we have enough
    }
    
    if (items.length < 10) {
      return NextResponse.json(
        { error: 'Not enough movies with ratings' },
        { status: 500 }
      )
    }
    
    console.log(`✅ Endless mode: Generated ${items.length} movies`)
    
    return NextResponse.json({
      category: 'movies',
      items,
      mode: 'endless',
    })
  } catch (error) {
    console.error('❌ Error generating endless movies:', error)
    return NextResponse.json(
      { error: 'Failed to generate endless mode', details: String(error) },
      { status: 500 }
    )
  }
}

