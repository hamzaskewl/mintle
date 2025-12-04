import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'

export const dynamic = 'force-dynamic'

/**
 * Serve NFT metadata for a given token ID
 * This endpoint is called by OpenSea, BaseScan, and other NFT viewers
 * 
 * The token ID comes from the contract mint
 * We store metadata in our database when NFTs are minted
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tokenId } = await params
    
    // Option 1: Fetch from database (if you store it)
    // This requires storing metadata when minting
    const { data: nftData, error } = await supabase
      .from('nft_metadata') // You'll need to create this table
      .select('*')
      .eq('token_id', tokenId)
      .single()
    
    if (!error && nftData) {
      return NextResponse.json(nftData.metadata, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
    
    // Option 2: Generate on-the-fly from token ID
    // This is a fallback - better to store in database
    // For now, return a basic metadata structure
    return NextResponse.json({
      name: `Mintle Game Result #${tokenId}`,
      description: 'Daily Mintle Challenge Game Result NFT',
      image: `https://morless.vercel.app/api/nft/image?tokenId=${tokenId}`,
      external_url: 'https://morless.vercel.app',
      attributes: [
        {
          trait_type: 'Token ID',
          value: tokenId
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
    
  } catch (error) {
    console.error('Metadata fetch error:', error)
    return NextResponse.json(
      { error: 'Metadata not found' },
      { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  }
}

