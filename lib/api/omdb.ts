/**
 * OMDB API - Fetch IMDB ratings
 */

export interface OMDBMovie {
  Title: string
  Year: string
  imdbRating: string
  Poster: string
  imdbID: string
}

/**
 * Fetch movie data from OMDB by IMDB ID
 */
export async function fetchOMDBRating(imdbId: string): Promise<OMDBMovie | null> {
  const apiKey = process.env.OMDB_API_KEY
  
  if (!apiKey) {
    console.error('OMDB_API_KEY not configured')
    return null
  }
  
  try {
    const url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbId}`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.Response === 'False') {
      console.error(`OMDB error for ${imdbId}:`, data.Error)
      return null
    }
    
    if (!data.imdbRating || data.imdbRating === 'N/A') {
      return null
    }
    
    return data as OMDBMovie
  } catch (error) {
    console.error(`Failed to fetch OMDB for ${imdbId}:`, error)
    return null
  }
}

