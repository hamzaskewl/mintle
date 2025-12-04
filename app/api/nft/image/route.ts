import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Generate NFT image based on game results
 * 
 * TODO: Implement actual image generation using:
 * - @vercel/og for server-side image generation
 * - canvas library for more control
 * - Pre-made templates with dynamic text overlay
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'movies'
  const score = searchParams.get('score') || '0'
  const total = searchParams.get('total') || '5'
  const streak = searchParams.get('streak') || '0'
  const perfect = searchParams.get('perfect') === 'true'
  
  // For now, return a placeholder or redirect to OG image
  // In production, generate a custom image here
  
  // Option 1: Redirect to a generated OG image
  const imageUrl = `https://morless.vercel.app/api/og?category=${category}&score=${score}&total=${total}&streak=${streak}&perfect=${perfect}`
  
  // Option 2: Return a placeholder image
  // return NextResponse.redirect('https://morless.vercel.app/og.png')
  
  // Option 3: Generate image using @vercel/og (requires installation)
  // See: https://vercel.com/docs/functions/edge-functions/og-image-generation
  
  return NextResponse.redirect(imageUrl)
}

