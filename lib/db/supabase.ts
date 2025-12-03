import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_SERVICE_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Database types for Supabase
 */
export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: number
          name: string
          spotify_id: string | null
          listeners: number
          daily_change: number | null
          peak_rank: number | null
          peak_listeners: number | null
          image_url: string | null
          last_updated: string
        }
        Insert: {
          name: string
          spotify_id?: string
          listeners: number
          daily_change?: number
          peak_rank?: number
          peak_listeners?: number
          image_url?: string
        }
        Update: {
          name?: string
          spotify_id?: string
          listeners?: number
          daily_change?: number
          peak_rank?: number
          peak_listeners?: number
          image_url?: string
        }
      }
      movies: {
        Row: {
          imdb_id: string
          title: string
          year: number | null
          rating: number
          poster_url: string | null
          last_updated: string
        }
        Insert: {
          imdb_id: string
          title: string
          year?: number
          rating: number
          poster_url?: string
        }
        Update: {
          title?: string
          year?: number
          rating?: number
          poster_url?: string
        }
      }
      scores: {
        Row: {
          id: number
          wallet_address: string
          category: string
          game_date: string
          score: number
          created_at: string
        }
        Insert: {
          wallet_address: string
          category: string
          game_date: string
          score: number
        }
        Update: {
          score?: number
        }
      }
    }
  }
}

