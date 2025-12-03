export type Category = 'movies' | 'spotify'

export interface GameItem {
  id: string
  name: string
  value: number
  imageUrl: string
  subtitle?: string // e.g., year for movies, genre for artists
}

export interface DailyGame {
  category: Category
  date: string
  items: GameItem[]
}

export interface GameState {
  category: Category | null
  currentRound: number
  score: number
  isGameOver: boolean
  results: ('correct' | 'wrong' | 'pending')[]
  items: GameItem[]
  hasPlayedToday: boolean
}

export interface PlayerScore {
  walletAddress: string
  category: Category
  score: number
  date: string
  streak: number
}

export interface LeaderboardEntry {
  rank: number
  walletAddress: string
  displayName?: string
  totalScore: number
  gamesPlayed: number
  bestScore: number
  currentStreak: number
}

