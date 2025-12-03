import { NextResponse } from 'next/server'
import { prepareTomorrowGames } from '@/lib/db/daily-prep'

/**
 * Cron job to prepare tomorrow's games
 * Runs at 11 PM EST (4 AM UTC) daily
 * 
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/prepare-daily",
 *     "schedule": "0 4 * * *"
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
    await prepareTomorrowGames()
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Tomorrow\'s games prepared successfully',
    })
  } catch (error) {
    console.error('Failed to prepare daily games:', error)
    return NextResponse.json(
      { error: 'Failed to prepare games', details: String(error) },
      { status: 500 }
    )
  }
}

