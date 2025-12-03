import { NextResponse } from 'next/server'
import { getDailySeed, seededShuffle } from '@/lib/game/daily-seed'
import { fetchMultipleMovies } from '@/lib/api/omdb'
import { supabase } from '@/lib/db/supabase'
import { GameItem } from '@/lib/game/types'
import moviesList from '@/data/movies.json'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const dateSeed = getDailySeed()
    
    // Try to get pre-prepared daily game first
    const { data: dailyItems } = await supabase
      .from('daily_games')
      .select('*')
      .eq('category', 'movies')
      .eq('game_date', dateSeed)
      .order('position')
    
    if (dailyItems && dailyItems.length >= 6) {
      // Use pre-prepared game - HIDE VALUES except first one
      const items: GameItem[] = dailyItems.map((item, index) => ({
        id: item.external_id || '',
        name: item.name,
        value: index === 0 ? Number(item.value) : 0, // Only send first value
        imageUrl: item.image_url || '',
        subtitle: item.subtitle,
      }))
      
      console.log('Using pre-prepared Movies game')
      
      return NextResponse.json({
        category: 'movies',
        date: dateSeed,
        items,
        source: 'prepared',
      })
    }
    
    // Fallback: generate from JSON + OMDB - HIDE VALUES except first
    console.log('Falling back to OMDB fetch')
    const shuffled = seededShuffle(moviesList, dateSeed)
    const selectedMovies = shuffled.slice(0, 6)
    
    const movieIds = selectedMovies.map(m => m.id)
    const items = await fetchMultipleMovies(movieIds)
    
    if (items.length < 6) {
      const backupMovies = shuffled.slice(6, 12)
      const backupIds = backupMovies.map(m => m.id)
      const backupItems = await fetchMultipleMovies(backupIds)
      items.push(...backupItems)
    }
    
    // Hide values except first one
    const hiddenItems = items.slice(0, 6).map((item, index) => ({
      ...item,
      value: index === 0 ? item.value : 0,
    }))
    
    return NextResponse.json({
      category: 'movies',
      date: dateSeed,
      items: hiddenItems,
      source: 'fallback',
    })
  } catch (error) {
    console.error('Error generating daily movies:', error)
    return NextResponse.json(
      { error: 'Failed to generate daily game', details: String(error) },
      { status: 500 }
    )
  }
}

