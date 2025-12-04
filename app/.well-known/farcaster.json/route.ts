import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

/**
 * Serve the Farcaster manifest for Base Mini App
 * This ensures the manifest is accessible at /.well-known/farcaster.json
 * Returns the raw file content to preserve exact formatting
 */
export async function GET() {
  try {
    const filePath = join(process.cwd(), 'public', '.well-known', 'farcaster.json')
    const fileContents = readFileSync(filePath, 'utf8')
    
    // Validate JSON but return raw content
    JSON.parse(fileContents)
    
    return new NextResponse(fileContents, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error reading manifest:', error)
    return NextResponse.json(
      { error: 'Manifest not found' },
      { status: 404 }
    )
  }
}

