import { NextResponse } from 'next/server'
import { scrapeSpotifyListeners } from '@/lib/api/kworb-scraper'

/**
 * Cron job endpoint to sync Spotify listener data from kworb.net
 * 
 * This should be called daily (e.g., 11 PM EST) to refresh artist data.
 * In production, you'd store this in Supabase.
 * 
 * For Vercel cron jobs, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-spotify",
 *     "schedule": "0 4 * * *"  // 4 AM UTC = 11 PM EST
 *   }]
 * }
 */
export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    console.log('Starting Spotify sync...')
    const artists = await scrapeSpotifyListeners()
    
    if (artists.length === 0) {
      throw new Error('No artists scraped')
    }
    
    console.log(`Scraped ${artists.length} artists`)
    
    // TODO: Store in Supabase
    // For now, just log the top 10
    console.log('Top 10 artists:', artists.slice(0, 10))
    
    return NextResponse.json({
      success: true,
      count: artists.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Spotify sync failed:', error)
    return NextResponse.json(
      { error: 'Sync failed', message: String(error) },
      { status: 500 }
    )
  }
}

