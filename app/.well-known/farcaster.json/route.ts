import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

/**
 * Serve the Farcaster manifest for Base Mini App
 * This ensures the manifest is accessible at /.well-known/farcaster.json
 */
export async function GET() {
  try {
    const filePath = join(process.cwd(), 'public', '.well-known', 'farcaster.json')
    const fileContents = readFileSync(filePath, 'utf8')
    const manifest = JSON.parse(fileContents)
    
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
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

