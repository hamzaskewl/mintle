import { NextResponse } from 'next/server'
import { getDailySeed, seededShuffle } from '@/lib/game/daily-seed'
import { scrapeSpotifyListeners, artistsToGameItems, getArtistPlaceholder } from '@/lib/api/kworb-scraper'
import { searchSpotifyArtist, getBestSpotifyImage } from '@/lib/api/spotify-api'
import { supabase } from '@/lib/db/supabase'
import { GameItem } from '@/lib/game/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const dateSeed = getDailySeed()
    
    // ALWAYS scrape kworb.net LIVE for accurate data
    console.log('Scraping kworb.net for live Spotify data...')
    const scrapedArtists = await scrapeSpotifyListeners()
    
    if (scrapedArtists.length === 0) {
      throw new Error('Failed to scrape kworb.net - no artists found')
    }
    
    console.log(`✅ Scraped ${scrapedArtists.length} artists from kworb (live data)`)
    
    // Convert to GameItems
    const allArtists = artistsToGameItems(scrapedArtists)
    
    // Shuffle and pick 6 using today's seed
    const shuffled = seededShuffle(allArtists, dateSeed)
    const selected = shuffled.slice(0, 6)
    
    console.log(`Selected artists: ${selected.map(a => `${a.name} (${a.value.toLocaleString()})`).join(', ')}`)
    
    // Fetch Spotify images for selected artists
    const itemsWithImages = await Promise.all(
      selected.map(async (artist, index) => {
        try {
          const spotifyData = await searchSpotifyArtist(artist.name)
          const imageUrl = spotifyData ? getBestSpotifyImage(spotifyData.images) : ''
          
          return {
            ...artist,
            imageUrl: imageUrl || getArtistPlaceholder(artist.name),
            value: index === 0 ? artist.value : 0, // Hide all except first
          }
        } catch (error) {
          console.error(`Failed to fetch image for ${artist.name}:`, error)
          return {
            ...artist,
            value: index === 0 ? artist.value : 0,
          }
        }
      })
    )
    
    return NextResponse.json({
      category: 'spotify',
      date: dateSeed,
      items: itemsWithImages,
      source: 'live-kworb',
    })
  } catch (error) {
    console.error('❌ Error generating daily spotify:', error)
    return NextResponse.json(
      { error: 'Failed to generate daily game', details: String(error) },
      { status: 500 }
    )
  }
}
