import { supabase } from './supabase'
import { GameItem } from '@/lib/game/types'

/**
 * Store or update artist in database
 */
export async function upsertArtist(artist: {
  name: string
  listeners: number
  imageUrl: string
  spotifyId: string
}) {
  const { error } = await supabase
    .from('artists')
    .upsert({
      name: artist.name,
      listeners: artist.listeners,
      image_url: artist.imageUrl,
      spotify_id: artist.spotifyId,
    }, {
      onConflict: 'name'
    })
  
  if (error) {
    console.error('Error upserting artist:', error)
    throw error
  }
}

/**
 * Get all artists for game generation
 */
export async function getAllArtists(): Promise<GameItem[]> {
  const { data, error } = await supabase
    .from('artists')
    .select('name, listeners, image_url, spotify_id')
    .order('listeners', { ascending: false })
  
  if (error) {
    console.error('Error fetching artists:', error)
    throw error
  }
  
  return (data || []).map((artist, index) => ({
    id: artist.spotify_id || artist.name.toLowerCase().replace(/\s+/g, '-'),
    name: artist.name,
    value: artist.listeners,
    imageUrl: artist.image_url || '',
    subtitle: `#${index + 1}`,
  }))
}

/**
 * Get random artists for game (limit to top N for quality)
 */
export async function getTopArtists(limit: number = 200): Promise<GameItem[]> {
  const { data, error } = await supabase
    .from('artists')
    .select('name, listeners, image_url, spotify_id')
    .order('listeners', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching top artists:', error)
    throw error
  }
  
  return (data || []).map((artist, index) => ({
    id: artist.spotify_id || artist.name.toLowerCase().replace(/\s+/g, '-'),
    name: artist.name,
    value: artist.listeners,
    imageUrl: artist.image_url || '',
    subtitle: `#${index + 1}`,
  }))
}

/**
 * Store or update movie in database
 */
export async function upsertMovie(movie: {
  imdbId: string
  title: string
  year: number
  rating: number
  posterUrl: string
}) {
  const { error } = await supabase
    .from('movies')
    .upsert({
      imdb_id: movie.imdbId,
      title: movie.title,
      year: movie.year,
      rating: movie.rating,
      poster_url: movie.posterUrl,
    }, {
      onConflict: 'imdb_id'
    })
  
  if (error) {
    console.error('Error upserting movie:', error)
    throw error
  }
}

/**
 * Get all cached movies
 */
export async function getAllMovies(): Promise<GameItem[]> {
  const { data, error } = await supabase
    .from('movies')
    .select('imdb_id, title, year, rating, poster_url')
    .order('rating', { ascending: false })
  
  if (error) {
    console.error('Error fetching movies:', error)
    throw error
  }
  
  return (data || []).map(movie => ({
    id: movie.imdb_id,
    name: movie.title,
    value: movie.rating,
    imageUrl: movie.poster_url || '',
    subtitle: movie.year?.toString(),
  }))
}

