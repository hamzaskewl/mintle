import { GameItem, DailyGame, Category } from './types'
import { getDailySeed, getCategorySeed, seededShuffle } from './daily-seed'

const ROUNDS_PER_GAME = 5
const ITEMS_NEEDED = ROUNDS_PER_GAME + 1 // 6 items for 5 comparisons

/**
 * Generate the daily game for a category
 */
export function generateDailyGame(
  category: Category,
  allItems: GameItem[],
  dateSeed?: string
): DailyGame {
  const date = dateSeed || getDailySeed()
  const seed = getCategorySeed(category, date)
  
  // Shuffle all items and take first 6
  const shuffled = seededShuffle(allItems, seed)
  const selectedItems = shuffled.slice(0, ITEMS_NEEDED)
  
  return {
    category,
    date,
    items: selectedItems,
  }
}

/**
 * Check if guess is correct
 * @param currentValue - The known value
 * @param nextValue - The hidden value being guessed
 * @param guess - 'higher' or 'lower'
 * @returns true if guess is correct
 */
export function checkGuess(
  currentValue: number,
  nextValue: number,
  guess: 'higher' | 'lower'
): boolean {
  if (guess === 'higher') {
    return nextValue >= currentValue
  } else {
    return nextValue <= currentValue
  }
}

/**
 * Get the comparison label based on category
 */
export function getComparisonLabel(category: Category): { higher: string; lower: string; unit: string } {
  switch (category) {
    case 'movies':
      return { higher: 'Higher', lower: 'Lower', unit: 'IMDB Rating' }
    case 'spotify':
      return { higher: 'More', lower: 'Less', unit: 'Monthly Listeners' }
    default:
      return { higher: 'Higher', lower: 'Lower', unit: 'Value' }
  }
}

/**
 * Format value based on category
 * Always show full numbers with commas for accuracy
 */
export function formatValue(value: number, category: Category): string {
  switch (category) {
    case 'movies':
      return value.toFixed(1)
    case 'spotify':
      // Show full number with commas (e.g., 65,405,471)
      return value.toLocaleString('en-US')
    default:
      return value.toLocaleString('en-US')
  }
}

/**
 * Get local storage key for played status
 */
export function getPlayedKey(category: Category, date?: string): string {
  const gameDate = date || getDailySeed()
  return `morl-played-${category}-${gameDate}`
}

/**
 * Check if user has already played today
 */
export function hasPlayedToday(category: Category): boolean {
  if (typeof window === 'undefined') return false
  const key = getPlayedKey(category)
  return localStorage.getItem(key) !== null
}

/**
 * Mark game as played
 */
export function markAsPlayed(category: Category, score: number): void {
  if (typeof window === 'undefined') return
  const key = getPlayedKey(category)
  localStorage.setItem(key, JSON.stringify({ score, timestamp: Date.now() }))
}

/**
 * Get today's score if already played
 */
export function getTodayScore(category: Category): number | null {
  if (typeof window === 'undefined') return null
  const key = getPlayedKey(category)
  const data = localStorage.getItem(key)
  if (!data) return null
  try {
    return JSON.parse(data).score
  } catch {
    return null
  }
}

/**
 * Get streak data from local storage
 */
export function getStreak(): { current: number; best: number } {
  if (typeof window === 'undefined') return { current: 0, best: 0 }
  const data = localStorage.getItem('morl-streak')
  if (!data) return { current: 0, best: 0 }
  try {
    return JSON.parse(data)
  } catch {
    return { current: 0, best: 0 }
  }
}

/**
 * Update streak after playing
 */
export function updateStreak(): { current: number; best: number } {
  if (typeof window === 'undefined') return { current: 0, best: 0 }
  
  const today = getDailySeed()
  const streakData = localStorage.getItem('morl-streak')
  
  let current = 1
  let best = 1
  let lastPlayed = ''
  
  if (streakData) {
    try {
      const parsed = JSON.parse(streakData)
      current = parsed.current || 0
      best = parsed.best || 0
      lastPlayed = parsed.lastPlayed || ''
    } catch {
      // Reset if corrupted
    }
  }
  
  // Check if played yesterday
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  
  if (lastPlayed === yesterdayStr) {
    // Continuing streak
    current += 1
  } else if (lastPlayed !== today) {
    // Streak broken or first time
    current = 1
  }
  // If lastPlayed === today, don't change current
  
  best = Math.max(best, current)
  
  const newData = { current, best, lastPlayed: today }
  localStorage.setItem('morl-streak', JSON.stringify(newData))
  
  return { current, best }
}

