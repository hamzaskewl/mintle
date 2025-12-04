import { NextResponse } from 'next/server'
import { getDailySeed } from '@/lib/game/daily-seed'
import { supabase } from '@/lib/db/supabase'
import { GameItem } from '@/lib/game/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const dateSeed = getDailySeed()
    
    // 1. Fetch random movies from the pool
    // We can't do "random()" easily in Supabase without a function or fetching all ID's.
    // Efficient way: fetch ~20 items and shuffle locally, or use a Postgres function `random_sample`.
    // For now, let's fetch 50 items and shuffle JS side (since pool is small ~200 items, fetching all IDs is cheap).
    
    const { data: allMovies, error } = await supabase
      .from('movies_pool')
      .select('*')
    
    if (error || !allMovies || allMovies.length === 0) {
      console.error('DB Error or Empty:', error)
      throw new Error('No movies found in database. Run npm run populate-db')
    }

    // 2. Shuffle using date seed (deterministic for everyone on same day)
    const { seededShuffle } = await import('@/lib/game/daily-seed')
    const shuffled = seededShuffle(allMovies, dateSeed)
    
    // 3. Pick 6 items
    const selected = shuffled.slice(0, 6)
    
    // 4. Convert to GameItems and Hide values
    const gameItems: GameItem[] = selected.map((item, index) => ({
      id: item.imdb_id,
      name: item.title,
      value: index === 0 ? Number(item.rating) : 0, // Only show first value
      imageUrl: item.poster_url,
      subtitle: item.year || '',
    }))
    
    return NextResponse.json({
      category: 'movies',
      date: dateSeed,
      items: gameItems,
      source: 'database-pool',
    })
  } catch (error) {
    console.error('❌ Error loading movies game:', error)
    return NextResponse.json(
      { error: 'Failed to load game', details: String(error) },
      { status: 500 }
    )
  }
}
