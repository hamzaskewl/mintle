import { GameItem } from '@/lib/game/types'

const OMDB_API_KEY = process.env.OMDB_API_KEY || ''

interface OMDBResponse {
  Title: string
  Year: string
  imdbRating: string
  Poster: string
  imdbID: string
  Error?: string
}

export async function fetchMovieData(imdbId: string): Promise<GameItem | null> {
  try {
    const response = await fetch(
      `https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}`
    )
    
    const data: OMDBResponse = await response.json()
    
    if (data.Error) {
      console.error(`OMDB Error for ${imdbId}:`, data.Error)
      return null
    }
    
    const rating = parseFloat(data.imdbRating)
    if (isNaN(rating)) {
      return null
    }
    
    return {
      id: data.imdbID,
      name: data.Title,
      value: rating,
      imageUrl: data.Poster !== 'N/A' ? data.Poster : '',
      subtitle: data.Year,
    }
  } catch (error) {
    console.error(`Failed to fetch movie ${imdbId}:`, error)
    return null
  }
}

export async function fetchMultipleMovies(imdbIds: string[]): Promise<GameItem[]> {
  const results = await Promise.all(imdbIds.map(fetchMovieData))
  return results.filter((item): item is GameItem => item !== null)
}

