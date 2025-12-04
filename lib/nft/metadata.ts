import { NFTMetadata, GameResultNFT } from './types'

/**
 * Generate NFT metadata for a completed game
 */
export function generateNFTMetadata(
  gameResult: GameResultNFT,
  imageUrl: string
): NFTMetadata {
  const { category, score, total, results, date, streak, perfect } = gameResult
  
  const categoryName = category === 'movies' ? 'Movies' : 'Spotify'
  const categoryEmoji = category === 'movies' ? '🎬' : '🎵'
  const resultPattern = results.map(r => r === 'correct' ? '🟢' : '🔴').join('')
  
  // Determine rarity/tier based on score
  let tier = 'Bronze'
  let tierEmoji = '🥉'
  if (perfect) {
    tier = 'Perfect'
    tierEmoji = '🏆'
  } else if (score >= 4) {
    tier = 'Gold'
    tierEmoji = '🥇'
  } else if (score >= 3) {
    tier = 'Silver'
    tierEmoji = '🥈'
  }
  
  const name = `${categoryEmoji} MorL ${categoryName} - ${score}/${total} ${tierEmoji}`
  
  const description = `Daily MorL Challenge - ${categoryName}\n\n` +
    `Score: ${score}/${total}\n` +
    `Results: ${resultPattern}\n` +
    `Streak: ${streak} days\n` +
    `Date: ${new Date(date).toLocaleDateString()}\n\n` +
    `${perfect ? 'Perfect score! 🎉' : `Great job completing today's challenge!`}`
  
  return {
    name,
    description,
    image: imageUrl,
    external_url: `https://morless.vercel.app`,
    attributes: [
      {
        trait_type: 'Category',
        value: categoryName
      },
      {
        trait_type: 'Score',
        value: `${score}/${total}`
      },
      {
        trait_type: 'Tier',
        value: tier
      },
      {
        trait_type: 'Perfect',
        value: perfect ? 'Yes' : 'No'
      },
      {
        trait_type: 'Streak',
        value: streak
      },
      {
        trait_type: 'Date',
        value: date
      },
      {
        trait_type: 'Result Pattern',
        value: resultPattern
      }
    ],
    background_color: perfect ? 'FFD700' : score >= 4 ? 'C0C0C0' : 'CD7F32' // Gold, Silver, Bronze
  }
}

/**
 * Generate a shareable image URL for the NFT
 * This could be a dynamically generated image or a pre-made template
 */
export function generateNFTImageUrl(gameResult: GameResultNFT): string {
  // For now, return a placeholder. You can:
  // 1. Use a service like Vercel OG Image Generation
  // 2. Use a canvas library to generate images
  // 3. Use pre-made templates with query params
  
  const params = new URLSearchParams({
    category: gameResult.category,
    score: gameResult.score.toString(),
    total: gameResult.total.toString(),
    streak: gameResult.streak.toString(),
    perfect: gameResult.perfect.toString(),
    pattern: gameResult.results.map(r => r === 'correct' ? '1' : '0').join('')
  })
  
  // This will be an API route that generates the image
  return `https://morless.vercel.app/api/nft/image?${params.toString()}`
}

