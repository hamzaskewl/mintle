/**
 * Script to fetch Spotify artist images and store in Supabase
 * Run with: npm run fetch-spotify-images
 */

import 'dotenv/config'
import { searchSpotifyArtist, getBestSpotifyImage } from '../lib/api/spotify-api'
import { upsertArtist } from '../lib/db/queries'
import artistsData from '../data/artists.json'

async function fetchAndStoreArtists() {
  console.log('🎵 Fetching Spotify artists and storing in database...\n')
  
  // Check env vars
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    console.error('❌ ERROR: Spotify credentials not found!')
    console.error('Please add to .env.local:')
    console.error('  SPOTIFY_CLIENT_ID=your_client_id')
    console.error('  SPOTIFY_CLIENT_SECRET=your_client_secret')
    process.exit(1)
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ ERROR: Supabase credentials not found!')
    console.error('Please add to .env.local:')
    console.error('  NEXT_PUBLIC_SUPABASE_URL=your_url')
    console.error('  SUPABASE_SERVICE_KEY=your_key')
    process.exit(1)
  }
  
  console.log('✅ Credentials loaded')
  console.log(`   Spotify: ${process.env.SPOTIFY_CLIENT_ID.substring(0, 20)}...`)
  console.log(`   Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log('')
  
  let successCount = 0
  let failCount = 0
  
  for (let i = 0; i < artistsData.length; i++) {
    const artist = artistsData[i]
    console.log(`[${i + 1}/${artistsData.length}] Processing: ${artist.name}`)
    
    try {
      // Search for artist on Spotify
      const spotifyArtist = await searchSpotifyArtist(artist.name)
      
      if (spotifyArtist && spotifyArtist.images.length > 0) {
        const imageUrl = getBestSpotifyImage(spotifyArtist.images)
        
        // Store in database
        await upsertArtist({
          name: artist.name,
          listeners: artist.listeners,
          imageUrl,
          spotifyId: spotifyArtist.id,
        })
        
        console.log(`  ✅ Stored with image`)
        successCount++
      } else {
        // Store without image
        await upsertArtist({
          name: artist.name,
          listeners: artist.listeners,
          imageUrl: '',
          spotifyId: '',
        })
        console.log(`  ⚠️  Stored without image`)
        failCount++
      }
      
      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`  ❌ Error: ${error}`)
      failCount++
    }
  }
  
  console.log('\n✨ Done!')
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`💾 All data stored in Supabase`)
}

fetchAndStoreArtists().catch(console.error)

