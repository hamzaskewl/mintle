import { GameItem } from '@/lib/game/types'

export interface TMDBMovie {
  id: number
  title: string
  vote_average: number
  poster_path: string | null
  release_date: string
  popularity: number
}

interface TMDBResponse {
  results: TMDBMovie[]
  total_pages: number
}

/**
 * Fetch top movies from TMDB API
 * Gets most popular/watched movies (not filtered by rating)
 */
export async function fetchTopMovies(limit: number = 2000): Promise<TMDBMovie[]> {
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    console.error('❌ TMDB_API_KEY not found in environment variables')
    return []
  }

  try {
    const movies: TMDBMovie[] = []
    const pagesToFetch = Math.ceil(limit / 20) // TMDB returns 20 per page

    console.log(`📡 Fetching top ${limit} popular movies from TMDB...`)

    // Fetch from 'popular' endpoint - sorted by what people watch
    // This gives us well-known movies regardless of rating
    for (let page = 1; page <= pagesToFetch && movies.length < limit; page++) {
      try {
        const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&page=${page}&language=en-US`
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        })

        if (!response.ok) {
          console.error(`Failed to fetch page ${page}: ${response.status}`)
          continue
        }

        const data: TMDBResponse = await response.json()
        
        // Only filter: must have poster and title (keep all ratings)
        const filtered = data.results.filter(m => 
          m.poster_path !== null &&
          m.title.length > 0 &&
          m.vote_average > 0 // Must have at least some rating data
        )
        
        movies.push(...filtered)
        
        // Rate limiting - be nice to TMDB
        await new Promise(resolve => setTimeout(resolve, 250))
        
        if (page % 10 === 0) {
          console.log(`  Fetched ${movies.length}/${limit} movies...`)
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error)
      }
    }

    // Remove duplicates by ID
    const uniqueMovies = Array.from(
      new Map(movies.map(m => [m.id, m])).values()
    )

    console.log(`✅ Fetched ${uniqueMovies.length} popular movies from TMDB`)
    
    // Sort by popularity (most watched/known first)
    return uniqueMovies
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit)

  } catch (error) {
    console.error('Failed to fetch TMDB movies:', error)
    return []
  }
}

/**
 * Convert TMDB movies to GameItems
 * Ratings are 0-10 scale (TMDB uses same scale as IMDB)
 */
export function tmdbMoviesToGameItems(movies: TMDBMovie[]): GameItem[] {
  return movies.map(movie => ({
    id: movie.id.toString(),
    name: movie.title,
    value: Number(movie.vote_average.toFixed(1)), // Round to 1 decimal like IMDB
    imageUrl: movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : '',
    subtitle: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : '',
  }))
}

/**
 * Get placeholder image if no poster available
 */
export function getMoviePlaceholder(title: string): string {
  return ''
}

