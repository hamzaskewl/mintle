/**
 * Get today's date seed in EST timezone
 * Format: YYYY-MM-DD
 */
export function getDailySeed(): string {
  const now = new Date()
  
  // Convert to EST (UTC-5)
  const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  
  const year = estDate.getFullYear()
  const month = String(estDate.getMonth() + 1).padStart(2, '0')
  const day = String(estDate.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Get time until next reset (midnight EST)
 */
export function getTimeUntilReset(): { hours: number; minutes: number; seconds: number } {
  const now = new Date()
  const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  
  // Midnight EST tomorrow
  const tomorrow = new Date(est)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  const diff = tomorrow.getTime() - est.getTime()
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  return { hours, minutes, seconds }
}

/**
 * Seeded random number generator
 * Uses a simple LCG algorithm for deterministic randomness
 */
export function seededRandom(seed: string): () => number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return function() {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff
    return hash / 0x7fffffff
  }
}

/**
 * Shuffle array with a seed (deterministic)
 */
export function seededShuffle<T>(array: T[], seed: string): T[] {
  const rng = seededRandom(seed)
  const shuffled = [...array]
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled
}

/**
 * Get a unique seed for a specific category on a given day
 */
export function getCategorySeed(category: string, dateSeed?: string): string {
  const date = dateSeed || getDailySeed()
  return `${date}-${category}`
}

