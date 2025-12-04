import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

/**
 * Generate NFT image based on game results
 * Uses Vercel OG Image Generation for dynamic NFT images
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'movies'
    const score = parseInt(searchParams.get('score') || '0')
    const total = parseInt(searchParams.get('total') || '5')
    const streak = parseInt(searchParams.get('streak') || '0')
    const perfect = searchParams.get('perfect') === 'true'
    const pattern = searchParams.get('pattern') || ''
    
    const categoryName = category === 'movies' ? 'Movies' : 'Spotify'
    const categoryEmoji = category === 'movies' ? '🎬' : '🎵'
    
    // Determine tier
    let tier = 'Bronze'
    let tierEmoji = '🥉'
    let tierColor = '#CD7F32' // Bronze
    if (perfect) {
      tier = 'Perfect'
      tierEmoji = '🏆'
      tierColor = '#FFD700' // Gold
    } else if (score >= 4) {
      tier = 'Gold'
      tierEmoji = '🥇'
      tierColor = '#FFD700' // Gold
    } else if (score >= 3) {
      tier = 'Silver'
      tierEmoji = '🥈'
      tierColor = '#C0C0C0' // Silver
    }
    
    // Generate result pattern emojis
    const resultPattern = pattern
      .split('')
      .map((r: string) => r === '1' ? '🟢' : '🔴')
      .join('')
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#020617', // slate-950
            backgroundImage: 'linear-gradient(to bottom, #0f172a, #1e293b)',
            fontFamily: 'system-ui, -apple-system',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>
              {categoryEmoji}
            </div>
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '10px',
              }}
            >
              Mintle {categoryName}
            </div>
            <div
              style={{
                fontSize: '36px',
                color: tierColor,
                fontWeight: 'bold',
              }}
            >
              {score}/{total} {tierEmoji} {tier}
            </div>
          </div>
          
          {/* Result Pattern */}
          <div
            style={{
              fontSize: '60px',
              marginBottom: '40px',
              letterSpacing: '10px',
            }}
          >
            {resultPattern || '🔴🔴🔴🔴🔴'}
          </div>
          
          {/* Stats */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              fontSize: '32px',
              color: '#94a3b8',
            }}
          >
            <div>🔥 Streak: {streak} days</div>
            {perfect && (
              <div style={{ color: '#FFD700', fontWeight: 'bold' }}>
                Perfect Game! 🎉
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              fontSize: '24px',
              color: '#64748b',
            }}
          >
            morless.vercel.app
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 1200,
      }
    )
  } catch (e: any) {
    console.error('Error generating NFT image:', e)
    // Fallback: return a simple error response or redirect to placeholder
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    })
  }
}

