/**
 * Daily game preparation - runs at midnight EST
 * Fetches 6 random movies + 6 random artists and stores in DB
 */

import { supabase } from './supabase'
import { scrapeSpotifyListeners } from '@/lib/api/kworb-scraper'
import { searchSpotifyArtist, getBestSpotifyImage } from '@/lib/api/spotify-api'
import { seededShuffle } from '@/lib/game/daily-seed'

const ITEMS_PER_GAME = 6

/**
 * Get tomorrow's date (in EST)
 * Cron runs at midnight to prepare next day's games
 */
function getTomorrowEST(): string {
  const now = new Date()
  const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  est.setDate(est.getDate() + 1)
  
  const year = est.getFullYear()
  const month = String(est.getMonth() + 1).padStart(2, '0')
  const day = String(est.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}


/**
 * Prepare Spotify artists for tomorrow
 */
export async function prepareSpotifyGame(date: string): Promise<void> {
  console.log(`🎵 Preparing Spotify game for ${date}`)
  
  // 1. Scrape kworb for top artists
  const allArtists = await scrapeSpotifyListeners()
  console.log(`  Scraped ${allArtists.length} artists from kworb`)
  
  // 2. Use date as seed for deterministic shuffle (same for everyone)
  const artistItems = allArtists.map(a => ({
    id: a.name,
    name: a.name,
    value: a.listeners,
    imageUrl: '',
    subtitle: `#${a.rank}`,
  }))
  
  const shuffled = seededShuffle(artistItems, date)
  const selected = shuffled.slice(0, ITEMS_PER_GAME)
  
  console.log(`  Selected ${selected.length} artists (seeded by date)`)
  
  // 3. Fetch Spotify images for selected artists
  const prepared = []
  for (const artist of selected) {
    console.log(`    Fetching image: ${artist.name}`)
    const spotifyData = await searchSpotifyArtist(artist.name)
    const imageUrl = spotifyData ? getBestSpotifyImage(spotifyData.images) : ''
    
    prepared.push({
      name: artist.name,
      listeners: artist.value,
      imageUrl,
      spotifyId: spotifyData?.id || artist.id,
    })
    
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // 4. Clear old daily game
  await supabase
    .from('daily_games')
    .delete()
    .eq('category', 'spotify')
    .eq('game_date', date)
  
  // 5. Store in database
  const records = prepared.map((artist, index) => ({
    category: 'spotify',
    game_date: date,
    position: index + 1,
    name: artist.name,
    value: artist.listeners,
    image_url: artist.imageUrl,
    external_id: artist.spotifyId,
  }))
  
  const { error } = await supabase
    .from('daily_games')
    .insert(records)
  
  if (error) throw error
  
  console.log(`  ✅ Stored ${prepared.length} artists for ${date}`)
}

/**
 * Prepare movies for tomorrow
 */
export async function prepareMoviesGame(date: string): Promise<void> {
  console.log(`🎬 Preparing Movies game for ${date}`)
  
  // 1. Get yesterday's movies to avoid repeats
  const yesterday = new Date(date)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  
  const { data: yesterdayMovies } = await supabase
    .from('daily_games')
    .select('external_id')
    .eq('category', 'movies')
    .eq('game_date', yesterdayStr)
  
  const excludeIds = new Set(yesterdayMovies?.map(m => m.external_id) || [])
  console.log(`  Excluding ${excludeIds.size} movies from yesterday`)
  
  // 2. Get all movies from pool
  const { data: allMovies, error: fetchError } = await supabase
    .from('movies_pool')
    .select('*')
    .order('popularity', { ascending: false })
  
  if (fetchError || !allMovies || allMovies.length === 0) {
    throw new Error('No movies in pool! Run: npm run populate-movies')
  }
  
  console.log(`  Loaded ${allMovies.length} movies from pool`)
  
  // 3. Filter out yesterday's movies
  const availableMovies = allMovies.filter(m => !excludeIds.has(m.imdb_id))
  
  // 4. Use date seed to pick 6 random (deterministic)
  const movieItems = availableMovies.map(m => ({ id: m.imdb_id, data: m }))
  const shuffled = seededShuffle(movieItems, date)
  const selected = shuffled.slice(0, ITEMS_PER_GAME)
  
  console.log(`  Selected ${selected.length} movies (seeded by date)`)
  
  // 5. Fetch IMDB ratings from OMDB for the 6 selected movies
  const { fetchOMDBRating } = await import('@/lib/api/omdb')
  const prepared = []
  
  for (const item of selected) {
    const movie = item.data
    console.log(`    Fetching IMDB rating: ${movie.title}`)
    
    const omdbData = await fetchOMDBRating(movie.imdb_id)
    
    if (omdbData && omdbData.imdbRating && omdbData.imdbRating !== 'N/A') {
      prepared.push({
        imdbId: movie.imdb_id,
        title: movie.title,
        year: movie.year,
        rating: parseFloat(omdbData.imdbRating),
        poster: omdbData.Poster !== 'N/A' ? omdbData.Poster : movie.poster_url,
      })
    } else {
      console.log(`      ⚠️ No IMDB rating, skipping...`)
    }
    
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  if (prepared.length < ITEMS_PER_GAME) {
    throw new Error(`Only got ${prepared.length} movies with IMDB ratings, need ${ITEMS_PER_GAME}`)
  }
  
  console.log(`  Got IMDB ratings: ${prepared.map(m => `${m.title} (${m.rating})`).join(', ')}`)
  
  // 6. Clear old daily game
  await supabase
    .from('daily_games')
    .delete()
    .eq('category', 'movies')
    .eq('game_date', date)
  
  // 7. Store in database
  const records = prepared.map((movie, index) => ({
    category: 'movies',
    game_date: date,
    position: index + 1,
    name: movie.title,
    value: movie.rating,
    image_url: movie.poster,
    external_id: movie.imdbId,
    subtitle: movie.year,
  }))
  
  const { error } = await supabase
    .from('daily_games')
    .insert(records)
  
  if (error) throw error
  
  console.log(`  ✅ Stored ${prepared.length} movies for ${date}`)
}

/**
 * Main function - prepare both games for tomorrow
 */
export async function prepareTomorrowGames(): Promise<void> {
  const tomorrow = getTomorrowEST()
  console.log(`\n🎮 Preparing games for ${tomorrow}\n`)
  
  try {
    await prepareSpotifyGame(tomorrow)
    await prepareMoviesGame(tomorrow)
    console.log(`\n✨ All games prepared for ${tomorrow}!`)
  } catch (error) {
    console.error('Error preparing games:', error)
    throw error
  }
}

