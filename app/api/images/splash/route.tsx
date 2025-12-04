import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import React from 'react'

export const runtime = 'edge'

/**
 * Splash screen image for Base Mini App
 * Shown while the app is loading
 */
export async function GET(request: NextRequest) {
  try {
    return new ImageResponse(
      React.createElement(
        'div',
        {
          style: {
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#020617',
            backgroundImage: 'linear-gradient(to bottom, #0f172a, #1e293b)',
            fontFamily: 'system-ui, -apple-system',
          },
        },
        // Logo/App Name
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '30px',
            },
          },
          React.createElement(
            'div',
            {
              style: {
                fontSize: '120px',
                fontWeight: 'bold',
                color: '#ffffff',
              },
            },
            '🎮'
          ),
          React.createElement(
            'div',
            {
              style: {
                fontSize: '72px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '20px',
              },
            },
            'Mintle'
          ),
          React.createElement(
            'div',
            {
              style: {
                fontSize: '32px',
                color: '#94a3b8',
              },
            },
            'More or Less? Prove it.'
          )
        )
      ),
      {
        width: 1200,
        height: 1200,
      }
    )
  } catch (e: any) {
    console.error('Error generating splash image:', e)
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    })
  }
}

