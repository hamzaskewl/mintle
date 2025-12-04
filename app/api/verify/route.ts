import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { category, currentId, nextId, guess } = body
    
    if (!category || !currentId || !nextId || !guess) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let currentValue = 0
    let nextValue = 0

    if (category === 'movies') {
      const { data: items, error } = await supabase
        .from('movies_pool')
        .select('imdb_id, rating')
        .in('imdb_id', [currentId, nextId])

      if (error || !items || items.length !== 2) {
        return NextResponse.json({ error: 'Movies not found in DB' }, { status: 404 })
      }
      
      const current = items.find(i => i.imdb_id === currentId)
      const next = items.find(i => i.imdb_id === nextId)
      
      if (!current || !next) return NextResponse.json({ error: 'Item mismatch' }, { status: 404 })
        
      currentValue = Number(current.rating)
      nextValue = Number(next.rating)

    } else if (category === 'spotify') {
      const { data: items, error } = await supabase
        .from('artists_pool')
        .select('spotify_id, listeners')
        .in('spotify_id', [currentId, nextId])

      if (error || !items || items.length !== 2) {
        return NextResponse.json({ error: 'Artists not found in DB' }, { status: 404 })
      }

      const current = items.find(i => i.spotify_id === currentId)
      const next = items.find(i => i.spotify_id === nextId)

      if (!current || !next) return NextResponse.json({ error: 'Item mismatch' }, { status: 404 })

      currentValue = Number(current.listeners)
      nextValue = Number(next.listeners)

    } else {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Verify
    let isCorrect = false
    if (guess === 'higher') {
      isCorrect = nextValue >= currentValue
    } else {
      isCorrect = nextValue <= currentValue
    }

    return NextResponse.json({
      correct: isCorrect,
      currentValue,
      nextValue,
    })
    
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
