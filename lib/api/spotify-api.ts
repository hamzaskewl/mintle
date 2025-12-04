/**
 * Spotify Web API integration for fetching artist images
 * Uses Client Credentials flow (no user auth needed)
 */

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || ''
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || ''

interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface SpotifyImage {
  url: string
  height: number
  width: number
}

interface SpotifyArtistResponse {
  id: string
  name: string
  images: SpotifyImage[]
  followers: {
    total: number
  }
  popularity: number
  genres: string[]
}

/**
 * Get Spotify access token using Client Credentials flow
 */
export async function getSpotifyAccessToken(): Promise<string> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials not configured. Check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local')
  }
  
  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials',
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get Spotify token: ${response.status} ${errorText}`)
  }
  
  const data: SpotifyTokenResponse = await response.json()
  return data.access_token
}

/**
 * Search for an artist and get their data including images
 */
export async function searchSpotifyArtist(artistName: string): Promise<SpotifyArtistResponse | null> {
  try {
    const token = await getSpotifyAccessToken()
    
    const searchUrl = new URL('https://api.spotify.com/v1/search')
    searchUrl.searchParams.set('q', artistName)
    searchUrl.searchParams.set('type', 'artist')
    searchUrl.searchParams.set('limit', '1')
    
    const response = await fetch(searchUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to search Spotify artist')
    }
    
    const data = await response.json()
    const artist = data.artists?.items?.[0]
    
    return artist || null
  } catch (error) {
    console.error(`Failed to fetch Spotify artist ${artistName}:`, error)
    return null
  }
}

/**
 * Get artist by Spotify ID
 */
export async function getSpotifyArtist(artistId: string): Promise<SpotifyArtistResponse | null> {
  try {
    const token = await getSpotifyAccessToken()
    
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to get Spotify artist')
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch Spotify artist ${artistId}:`, error)
    return null
  }
}

/**
 * Get best quality image from Spotify images array
 */
export function getBestSpotifyImage(images: SpotifyImage[]): string {
  if (!images || images.length === 0) return ''
  
  // Sort by size (width * height) and get the largest
  const sorted = [...images].sort((a, b) => {
    const aSize = (a.width || 0) * (a.height || 0)
    const bSize = (b.width || 0) * (b.height || 0)
    return bSize - aSize
  })
  
  return sorted[0]?.url || ''
}

/**
 * Search for multiple artists in parallel
 */
export async function searchMultipleArtists(artistNames: string[]): Promise<Map<string, string>> {
  const results = await Promise.all(
    artistNames.map(async (name) => {
      const artist = await searchSpotifyArtist(name)
      const imageUrl = artist ? getBestSpotifyImage(artist.images) : ''
      return [name, imageUrl] as const
    })
  )
  
  return new Map(results)
}

