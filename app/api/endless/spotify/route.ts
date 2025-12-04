import { NextResponse } from 'next/server'
import { scrapeSpotifyListeners, artistsToGameItems, getArtistPlaceholder } from '@/lib/api/kworb-scraper'
import { searchSpotifyArtist, getBestSpotifyImage } from '@/lib/api/spotify-api'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Endless mode - fetch random artists from kworb
 */
export async function GET() {
  try {
    console.log('🎵 Endless mode: Scraping kworb for artists...')
    
    const scrapedArtists = await scrapeSpotifyListeners()
    
    if (scrapedArtists.length === 0) {
      throw new Error('Failed to scrape kworb')
    }
    
    console.log(`✅ Scraped ${scrapedArtists.length} artists`)
    
    // Convert to game items
    const allArtists = artistsToGameItems(scrapedArtists)
    
    // Shuffle and pick 20 random
    const shuffled = allArtists.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, 20)
    
    // Fetch images
    const itemsWithImages = await Promise.all(
      selected.map(async (artist) => {
        try {
          const spotifyData = await searchSpotifyArtist(artist.name)
          const imageUrl = spotifyData ? getBestSpotifyImage(spotifyData.images) : ''
          
          return {
            ...artist,
            imageUrl: imageUrl || getArtistPlaceholder(artist.name),
          }
        } catch (error) {
          console.error(`Failed to fetch image for ${artist.name}:`, error)
          return artist
        }
      })
    )
    
    console.log(`✅ Endless mode: Generated ${itemsWithImages.length} artists`)
    
    return NextResponse.json({
      category: 'spotify',
      items: itemsWithImages,
      mode: 'endless',
    })
  } catch (error) {
    console.error('❌ Error generating endless spotify:', error)
    return NextResponse.json(
      { error: 'Failed to generate endless mode', details: String(error) },
      { status: 500 }
    )
  }
}

