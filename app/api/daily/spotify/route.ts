import { NextResponse } from 'next/server'
import { getDailySeed } from '@/lib/game/daily-seed'
import { supabase } from '@/lib/db/supabase'
import { GameItem } from '@/lib/game/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const dateSeed = getDailySeed()
    
    // 1. Fetch random artists from the pool
    const { data: allArtists, error } = await supabase
      .from('artists_pool')
      .select('*')
    
    if (error || !allArtists || allArtists.length === 0) {
      console.error('DB Error or Empty:', error)
      throw new Error('No artists found in database. Run npm run populate-db')
    }

    // 2. Shuffle using date seed
    const { seededShuffle } = await import('@/lib/game/daily-seed')
    const shuffled = seededShuffle(allArtists, dateSeed)
    
    // 3. Pick 6 items
    const selected = shuffled.slice(0, 6)
    
    // 4. Convert to GameItems and Hide values
    const gameItems: GameItem[] = selected.map((item, index) => ({
      id: item.spotify_id,
      name: item.name,
      value: index === 0 ? Number(item.listeners) : 0, // Only show first value
      imageUrl: item.image_url,
      subtitle: item.subtitle || '',
    }))
    
    return NextResponse.json({
      category: 'spotify',
      date: dateSeed,
      items: gameItems,
      source: 'database-pool',
    })
  } catch (error) {
    console.error('❌ Error loading spotify game:', error)
    return NextResponse.json(
      { error: 'Failed to load game', details: String(error) },
      { status: 500 }
    )
  }
}
