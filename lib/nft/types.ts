export interface NFTMetadata {
  name: string
  description: string
  image: string
  external_url: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
  // Base-specific fields
  animation_url?: string
  background_color?: string
}

export interface GameResultNFT {
  category: 'movies' | 'spotify'
  score: number
  total: number
  results: ('correct' | 'wrong' | 'pending')[]
  date: string
  streak: number
  perfect: boolean
}

export interface MintNFTResponse {
  success: boolean
  tokenId?: string
  txHash?: string
  metadataUri?: string
  error?: string
  details?: string
  paymasterSponsored?: boolean
  userOperation?: any // User operation for account abstraction
  txData?: {
    to: string
    data: `0x${string}`
    value: string
  }
}

