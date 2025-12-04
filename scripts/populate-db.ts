import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { scrapeSpotifyListeners } from '../lib/api/kworb-scraper'
import { searchSpotifyArtist, getBestSpotifyImage, getSpotifyAccessToken } from '../lib/api/spotify-api'

// Supabase Setup
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// --- Types ---
interface TMDBMovie {
  id: number
  title: string
  release_date: string
  poster_path: string
  popularity: number
  vote_count: number
  original_language: string
}

// --- Configuration ---
const NON_ENGLISH_GENRES = [
  'bollywood', 'filmi', 'indian', 'desi', 'tollywood', 'kollywood', 
  'punjabi', 'tamil', 'telugu', 'malayalam', 'k-pop', 'korean', 
  'j-pop', 'japanese', 'mandopop', 'cantopop', 'thai', 'vietnamese',
  'latin', 'reggaeton', 'trap latino', 'urbano latino' // User said "just english", maybe exclude Latin too? 
  // User reaction to "Udit Narayan" implies "Indian" specifically, but "just english" implies stricter.
  // I will exclude strong non-english signals.
]

function isEnglishArtist(genres: string[]): boolean {
  if (!genres || genres.length === 0) return true // Give benefit of doubt if no genres
  const lowerGenres = genres.map(g => g.toLowerCase())
  return !lowerGenres.some(g => NON_ENGLISH_GENRES.some(neg => g.includes(neg)))
}

// --- Logic ---

async function populateArtists() {
  console.log('\n🎵 Populating ARTISTS pool...')
  
  // 1. Scrape Kworb
  console.log('   Scraping Kworb.net...')
  const scraped = await scrapeSpotifyListeners()
  const top300 = scraped.slice(0, 300) // Get more candidates to allow for filtering
  console.log(`   ✅ Got ${top300.length} candidates`)

  // 2. Fetch Details & Filter
  console.log('   Fetching Spotify details & filtering (this may take a moment)...')
  
  try {
    await getSpotifyAccessToken()
  } catch (e) {
    console.error('   ❌ Failed to get Spotify token. Cannot filter genres effectively.')
    // We proceed but filtering will be weak (only name based)
  }

  const artistsToInsert = []
  let processed = 0
  let skipped = 0

  for (const artist of top300) {
    if (artistsToInsert.length >= 200) break

    try {
      const spotifyData = await searchSpotifyArtist(artist.name)
      
      if (spotifyData) {
        // Genre Filter
        if (!isEnglishArtist(spotifyData.genres)) {
          // console.log(`   🚫 Skipped (Non-English): ${artist.name} [${spotifyData.genres.join(', ')}]`)
          skipped++
          continue
        }

        const imageUrl = getBestSpotifyImage(spotifyData.images)
        if (imageUrl) {
          artistsToInsert.push({
            spotify_id: spotifyData.id,
            name: artist.name,
            listeners: artist.listeners,
            image_url: imageUrl,
            subtitle: `#${artist.rank} Monthly Listeners`
          })
          process.stdout.write('.')
        }
      } else {
        // Fallback if not found on Spotify (rare for top artists)
        // Skip to be safe regarding "English" requirement
        skipped++
      }
      
      // Rate limit
      await new Promise(r => setTimeout(r, 100))
    } catch (e) {
      // ignore
    }
    processed++
  }

  console.log(`\n   ✅ Qualified: ${artistsToInsert.length} (Skipped ${skipped} non-English/other)`)

  // 3. Insert into Supabase
  console.log('   💾 Inserting into database...')
  
  // Clear old pool first? Or Upsert? 
  // User wants "clean" data. Let's clear to remove old "Udit Narayan" if he was there.
  await supabase.from('artists_pool').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  const { error } = await supabase.from('artists_pool').insert(artistsToInsert)

  if (error) {
    console.error('   ❌ DB Insert Error:', error)
  } else {
    console.log('   ✨ Artists pool updated!')
  }
}

// --- Movies Logic ---

async function fetchTMDBMovies(page: number): Promise<TMDBMovie[]> {
  const apiKey = process.env.TMDB_API_KEY
  const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&page=${page}&language=en-US`
  const res = await fetch(url)
  const data = await res.json()
  return data.results || []
}

async function getIMDBId(tmdbId: number): Promise<string | null> {
  try {
    const apiKey = process.env.TMDB_API_KEY
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${apiKey}`
    const res = await fetch(url)
    const data = await res.json()
    return data.imdb_id || null
  } catch (e) {
    return null
  }
}

async function getOMDBRating(imdbId: string): Promise<{ rating: number, poster: string } | null> {
  try {
    const apiKey = process.env.OMDB_API_KEY
    const url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbId}`
    const res = await fetch(url)
    const data = await res.json()
    
    if (data.Response === 'False' || !data.imdbRating || data.imdbRating === 'N/A') return null
    
    return {
      rating: parseFloat(data.imdbRating),
      poster: data.Poster !== 'N/A' ? data.Poster : ''
    }
  } catch (e) {
    return null
  }
}

async function populateMovies() {
  console.log('\n🎬 Populating MOVIES pool...')
  
  if (!process.env.TMDB_API_KEY || !process.env.OMDB_API_KEY) {
    console.error('   ❌ Missing TMDB_API_KEY or OMDB_API_KEY')
    return
  }

  // 1. Fetch Popular Movies
  console.log('   Fetching popular movies from TMDB...')
  const candidates: TMDBMovie[] = []
  
  // Fetch 30 pages = 600 movies
  for (let i = 1; i <= 30; i++) {
    const results = await fetchTMDBMovies(i)
    candidates.push(...results)
    process.stdout.write('.')
    await new Promise(r => setTimeout(r, 100))
  }
  console.log(`\n   ✅ Fetched ${candidates.length} raw candidates`)

  // 2. Filter High Quality
  const filtered = candidates.filter(m => 
    m.original_language === 'en' &&
    m.vote_count >= 3000 && 
    m.poster_path
  )
  
  // Remove duplicates
  const unique = Array.from(new Map(filtered.map(m => [m.id, m])).values())
  console.log(`   ✅ Filtered to ${unique.length} high-quality mainstream movies`)

  // 3. Enrich with OMDB (IMDB Ratings)
  console.log('   Fetching IMDB ratings (this takes time)...')
  const moviesToInsert = []
  
  // We want ~200 good movies in the pool
  for (const movie of unique) {
    if (moviesToInsert.length >= 200) break;

    try {
      const imdbId = await getIMDBId(movie.id)
      if (imdbId) {
        const omdb = await getOMDBRating(imdbId)
        if (omdb) {
          moviesToInsert.push({
            imdb_id: imdbId,
            title: movie.title,
            rating: omdb.rating,
            poster_url: omdb.poster || `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            year: movie.release_date.substring(0, 4)
          })
          process.stdout.write('.')
        }
      }
    } catch (e) {
      // ignore
    }
    // Be nice to OMDB
    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\n   ✅ Qualified: ${moviesToInsert.length} movies`)

  // 4. Insert into Supabase
  console.log('   💾 Inserting into database...')
  
  await supabase.from('movies_pool').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { error } = await supabase.from('movies_pool').insert(moviesToInsert)

  if (error) {
    console.error('   ❌ DB Insert Error:', error)
  } else {
    console.log('   ✨ Movies pool updated!')
  }
}

async function main() {
  await populateArtists()
  await populateMovies()
  console.log('\n✨ All done! Database populated.')
}

main().catch(console.error)

