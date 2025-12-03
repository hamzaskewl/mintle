/**
 * Daily game preparation - runs 1 hour before reset (11 PM EST)
 */

import { supabase } from './supabase'
import { scrapeSpotifyListeners } from '@/lib/api/kworb-scraper'
import { searchSpotifyArtist, getBestSpotifyImage } from '@/lib/api/spotify-api'
import { fetchMovieData } from '@/lib/api/omdb'
import moviesList from '@/data/movies.json'

const ITEMS_PER_GAME = 6

/**
 * Get tomorrow's date (in EST)
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
 * Get list of recently used items to avoid repeats
 */
async function getRecentlyUsed(category: string, daysBack: number = 30): Promise<Set<string>> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysBack)
  
  const { data } = await supabase
    .from('used_items')
    .select('external_id')
    .eq('category', category)
    .gte('last_used', cutoffDate.toISOString().split('T')[0])
  
  return new Set(data?.map(item => item.external_id) || [])
}

/**
 * Mark items as used
 */
async function markAsUsed(category: string, externalIds: string[], date: string) {
  const records = externalIds.map(id => ({
    category,
    external_id: id,
    last_used: date,
  }))
  
  await supabase
    .from('used_items')
    .upsert(records, { onConflict: 'category,external_id' })
}

/**
 * Prepare Spotify artists for tomorrow
 */
export async function prepareSpotifyGame(date: string): Promise<void> {
  console.log(`🎵 Preparing Spotify game for ${date}`)
  
  // Scrape current top artists from kworb
  const allArtists = await scrapeSpotifyListeners()
  console.log(`  Scraped ${allArtists.length} artists from kworb`)
  
  // Get recently used to avoid repeats
  const recentlyUsed = await getRecentlyUsed('spotify', 30)
  console.log(`  Excluding ${recentlyUsed.size} recently used artists`)
  
  // Filter out recently used
  const availableArtists = allArtists.filter(a => 
    !recentlyUsed.has(a.name) && a.listeners > 1_000_000 // At least 1M listeners
  )
  
  // Randomly pick 6
  const shuffled = availableArtists.sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, ITEMS_PER_GAME)
  
  console.log(`  Selected ${selected.length} random artists`)
  
  // Fetch Spotify images for each
  const prepared = []
  for (const artist of selected) {
    console.log(`    Fetching: ${artist.name}`)
    const spotifyData = await searchSpotifyArtist(artist.name)
    const imageUrl = spotifyData ? getBestSpotifyImage(spotifyData.images) : ''
    
    prepared.push({
      name: artist.name,
      listeners: artist.listeners,
      imageUrl,
      spotifyId: spotifyData?.id || '',
    })
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Clear old daily game for this category
  await supabase
    .from('daily_games')
    .delete()
    .eq('category', 'spotify')
    .eq('game_date', date)
  
  // Store in daily_games table
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
  
  // Mark as used
  await markAsUsed('spotify', prepared.map(a => a.name), date)
  
  console.log(`  ✅ Stored ${prepared.length} artists for ${date}`)
}

/**
 * Prepare movies for tomorrow
 */
export async function prepareMoviesGame(date: string): Promise<void> {
  console.log(`🎬 Preparing Movies game for ${date}`)
  
  // Get recently used
  const recentlyUsed = await getRecentlyUsed('movies', 30)
  console.log(`  Excluding ${recentlyUsed.size} recently used movies`)
  
  // Filter available movies
  const availableMovies = moviesList.filter(m => !recentlyUsed.has(m.id))
  
  // Randomly pick 6
  const shuffled = availableMovies.sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, ITEMS_PER_GAME)
  
  console.log(`  Selected ${selected.length} random movies`)
  
  // Fetch OMDB data for each
  const prepared = []
  for (const movie of selected) {
    console.log(`    Fetching: ${movie.title}`)
    const movieData = await fetchMovieData(movie.id)
    if (movieData) {
      prepared.push(movieData)
    }
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  if (prepared.length < ITEMS_PER_GAME) {
    throw new Error(`Only got ${prepared.length} movies, need ${ITEMS_PER_GAME}`)
  }
  
  // Clear old daily game
  await supabase
    .from('daily_games')
    .delete()
    .eq('category', 'movies')
    .eq('game_date', date)
  
  // Store in daily_games
  const records = prepared.map((movie, index) => ({
    category: 'movies',
    game_date: date,
    position: index + 1,
    name: movie.name,
    value: movie.value,
    image_url: movie.imageUrl,
    external_id: movie.id,
    subtitle: movie.subtitle,
  }))
  
  const { error } = await supabase
    .from('daily_games')
    .insert(records)
  
  if (error) throw error
  
  // Mark as used
  await markAsUsed('movies', prepared.map(m => m.id), date)
  
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

