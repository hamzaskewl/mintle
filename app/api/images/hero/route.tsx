import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import React from 'react'

export const runtime = 'edge'

/**
 * Hero image for Base Mini App discovery/listing
 * Featured image shown in app directory
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
            padding: '80px',
          },
        },
        // Header
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '60px',
            },
          },
          React.createElement(
            'div',
            {
              style: {
                fontSize: '100px',
                marginBottom: '30px',
              },
            },
            '🎮'
          ),
          React.createElement(
            'div',
            {
              style: {
                fontSize: '80px',
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
                fontSize: '40px',
                color: '#94a3b8',
                marginBottom: '10px',
              },
            },
            'More or Less? Prove it.'
          )
        ),
        // Game Preview
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'row',
              gap: '40px',
              alignItems: 'center',
              marginBottom: '40px',
            },
          },
          React.createElement(
            'div',
            {
              style: {
                fontSize: '60px',
                padding: '30px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
              },
            },
            '🎬'
          ),
          React.createElement(
            'div',
            {
              style: {
                fontSize: '48px',
                color: '#ffffff',
                fontWeight: 'bold',
              },
            },
            'VS'
          ),
          React.createElement(
            'div',
            {
              style: {
                fontSize: '60px',
                padding: '30px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
              },
            },
            '🎵'
          )
        ),
        // Features
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'row',
              gap: '60px',
              fontSize: '32px',
              color: '#94a3b8',
            },
          },
          React.createElement('div', null, '🎯 Daily Challenges'),
          React.createElement('div', null, '🏆 Leaderboards'),
          React.createElement('div', null, '🎨 Mint NFTs')
        )
      ),
      {
        width: 1200,
        height: 630, // Open Graph standard
      }
    )
  } catch (e: any) {
    console.error('Error generating hero image:', e)
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    })
  }
}

