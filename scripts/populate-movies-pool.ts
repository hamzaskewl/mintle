/**
 * ONE-TIME SCRIPT: Populate movies pool with top 1000 popular movies from TMDB
 * Run: npm run populate-movies
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

interface TMDBMovie {
  id: number
  title: string
  release_date: string
  poster_path: string
  popularity: number
  vote_average: number
  vote_count: number
}

async function fetchTMDBMovies(
  endpoint: string,
  pages: number,
  label: string
): Promise<TMDBMovie[]> {
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    throw new Error('TMDB_API_KEY not found!')
  }
  
  const movies: TMDBMovie[] = []
  
  console.log(`📡 Fetching ${label} (${pages} pages)...`)
  
  for (let page = 1; page <= pages; page++) {
    try {
      const url = `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${apiKey}&page=${page}&language=en-US`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.results) {
        movies.push(...data.results)
        console.log(`  ✅ ${label} - Page ${page}/${pages} (Total: ${movies.length})`)
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 250))
    } catch (error) {
      console.error(`  ❌ Error fetching ${label} page ${page}:`, error)
    }
  }
  
  return movies
}

async function fetchTMDBPopularMovies(): Promise<TMDBMovie[]> {
  console.log('🎬 Fetching 1000 popular movies from TMDB (wide variety in time & rating)\n')
  
  // Fetch 50 pages of popular movies = 1000 movies
  // Popular = movies that made good money (box office success)
  // This gives us variety across decades and ratings naturally
  const allMovies = await fetchTMDBMovies('popular', 50, 'Popular Movies')
  
  console.log(`\n✅ Total fetched: ${allMovies.length} popular movies`)
  console.log(`   🎯 NO rating filter - all ratings included (any range!)`)
  console.log(`   📅 Variety across decades (1970s-2020s)`)
  console.log(`   💰 All are popular (made good money at box office)`)
  
  // Filter out movies without release dates or posters
  const validMovies = allMovies.filter(m => 
    m.release_date && 
    m.poster_path && 
    m.release_date.length >= 4 // Has year
  )
  
  console.log(`   🔥 Valid movies (with posters & dates): ${validMovies.length}\n`)
  
  return validMovies
}

async function getIMDbIDFromTMDB(tmdbId: number): Promise<string | null> {
  const apiKey = process.env.TMDB_API_KEY
  
  try {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()
    
    return data.imdb_id || null
  } catch (error) {
    console.error(`Failed to get IMDB ID for TMDB ${tmdbId}:`, error)
    return null
  }
}

async function populateMoviesPool() {
  console.log('🎬 Populating movies pool from TMDB...\n')
  
  // Check env
  if (!process.env.TMDB_API_KEY) {
    console.error('❌ TMDB_API_KEY not found!')
    process.exit(1)
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Supabase credentials not found!')
    process.exit(1)
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
  
  // Fetch movies from multiple TMDB sources
  const movies = await fetchTMDBPopularMovies()
  
  console.log(`\n✅ Fetched ${movies.length} movies from TMDB`)
  console.log('🔍 Now fetching IMDB IDs...\n')
  
  // Get IMDB IDs and prepare records
  const records = []
  let successCount = 0
  let failCount = 0
  
  for (const movie of movies) {
    const imdbId = await getIMDbIDFromTMDB(movie.id)
    
    if (imdbId) {
      records.push({
        tmdb_id: movie.id,
        imdb_id: imdbId,
        title: movie.title,
        year: movie.release_date?.substring(0, 4) || '',
        poster_url: movie.poster_path 
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : '',
        popularity: movie.popularity,
      })
      successCount++
      console.log(`  ✅ ${successCount}/${movies.length}: ${movie.title} → ${imdbId}`)
    } else {
      failCount++
      console.log(`  ❌ ${movie.title} - No IMDB ID`)
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  
  console.log(`\n💾 Storing ${records.length} movies in database...\n`)
  
  // Store in batches
  const batchSize = 100
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    
    const { error } = await supabase
      .from('movies_pool')
      .upsert(batch, { 
        onConflict: 'imdb_id',
        ignoreDuplicates: false 
      })
    
    if (error) {
      console.error(`❌ Error storing batch:`, error)
    } else {
      console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`)
    }
  }
  
  console.log('\n✨ Done!')
  console.log(`✅ Success: ${successCount} movies`)
  console.log(`❌ Failed: ${failCount} movies`)
  console.log(`\n💡 Movies pool is ready! Run daily cron to pick 6 and fetch IMDB ratings.`)
}

populateMoviesPool().catch(console.error)


