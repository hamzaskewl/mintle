import * as cheerio from 'cheerio'
import { GameItem } from '@/lib/game/types'

export interface SpotifyArtist {
  rank: number
  name: string
  listeners: number
  dailyChange: number
  peak: number
  peakListeners: number
}

/**
 * Scrape Spotify monthly listeners from kworb.net
 * Note: This should be run server-side (API route or cron job)
 */
export async function scrapeSpotifyListeners(): Promise<SpotifyArtist[]> {
  try {
    const response = await fetch('https://kworb.net/spotify/listeners.html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MorL/1.0)',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const artists: SpotifyArtist[] = []
    
    $('table tbody tr').each((i, row) => {
      const cells = $(row).find('td')
      if (cells.length < 6) return
      
      const rank = parseInt($(cells[0]).text().trim())
      const name = $(cells[1]).text().trim()
      const listenersText = $(cells[2]).text().trim().replace(/,/g, '')
      const listeners = parseInt(listenersText)
      
      if (isNaN(rank) || isNaN(listeners) || !name) return
      
      const dailyChangeText = $(cells[3]).text().trim().replace(/,/g, '')
      const dailyChange = parseInt(dailyChangeText) || 0
      
      const peak = parseInt($(cells[4]).text().trim()) || 0
      const peakListenersText = $(cells[5]).text().trim().replace(/,/g, '')
      const peakListeners = parseInt(peakListenersText) || 0
      
      artists.push({
        rank,
        name,
        listeners,
        dailyChange,
        peak,
        peakListeners,
      })
    })
    
    return artists
  } catch (error) {
    console.error('Failed to scrape kworb.net:', error)
    return []
  }
}

/**
 * Convert scraped artists to GameItems
 */
export function artistsToGameItems(artists: SpotifyArtist[]): GameItem[] {
  return artists.map(artist => ({
    id: artist.name.toLowerCase().replace(/\s+/g, '-'),
    name: artist.name,
    value: artist.listeners,
    imageUrl: '', // We'll use a placeholder or fetch from elsewhere
    subtitle: `#${artist.rank} on Spotify`,
  }))
}

/**
 * Get a placeholder image URL for an artist
 * Returns empty string - real images should be fetched from Spotify API
 */
export function getArtistPlaceholder(name: string): string {
  // Return empty - will show emoji fallback in UI
  return ''
}

