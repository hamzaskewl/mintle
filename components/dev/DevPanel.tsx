'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { formatValue } from '@/lib/game/game-logic'

interface DevPanelProps {
  onClose: () => void
}

export function DevPanel({ onClose }: DevPanelProps) {
  const [spotifyGame, setSpotifyGame] = useState<any>(null)
  const [moviesGame, setMoviesGame] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadGames = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Fetch TODAY's actual games from API routes
      const [spotifyRes, moviesRes] = await Promise.all([
        fetch('/api/daily/spotify'),
        fetch('/api/daily/movies')
      ])

      if (!spotifyRes.ok || !moviesRes.ok) {
        throw new Error('Failed to fetch games')
      }

      const spotifyData = await spotifyRes.json()
      const moviesData = await moviesRes.json()

      setSpotifyGame(spotifyData)
      setMoviesGame(moviesData)
    } catch (err) {
      setError(String(err))
      console.error('Failed to load games:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGames()
  }, [])

  const handleRefresh = () => {
    loadGames()
  }

  const handlePrepTomorrow = async () => {
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/cron/prepare-daily')
      if (!res.ok) {
        throw new Error('Failed to prepare tomorrow\'s games')
      }
      const data = await res.json()
      alert('✅ Tomorrow\'s games prepared!\n\n' + data.message)
    } catch (err) {
      setError('Failed to prepare games: ' + String(err))
      alert('❌ Error: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto"
    >
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-text-primary">🛠️ Dev Panel</h1>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-error/20 hover:bg-error/40 text-error rounded-lg transition-all"
            >
              Close ✕
            </button>
          </div>

          {/* Controls */}
          <Card className="mb-6 p-4">
            <div className="space-y-4">
              {error && (
                <div className="bg-error/10 border border-error/30 rounded-lg p-3 text-error text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-accent-cyan hover:bg-accent-cyan/80 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
                >
                  {loading ? '⏳ Loading...' : '🔄 Refresh Today\'s Games'}
                </button>
                <button
                  onClick={handlePrepTomorrow}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-success hover:bg-success/80 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
                >
                  {loading ? '⏳ Loading...' : '🚀 Prepare Tomorrow\'s Games'}
                </button>
              </div>

              {/* Data Source Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <div className="text-xs text-text-muted mb-1">🎵 Spotify Source</div>
                  <div className="text-lg font-bold text-success">
                    {spotifyGame?.source || '...'}
                  </div>
                  <div className="text-xs text-text-muted">
                    {spotifyGame?.source === 'live-kworb' && '✅ Scraped from kworb.net (LIVE)'}
                    {spotifyGame?.source === 'prepared' && '✅ Pre-generated in DB'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">🎬 Movies Source</div>
                  <div className="text-lg font-bold text-accent-cyan">
                    {moviesGame?.source || '...'}
                  </div>
                  <div className="text-xs text-text-muted">
                    {moviesGame?.source === 'prepared' && '✅ Pre-generated in DB'}
                    {moviesGame?.source === 'database' && '✅ Loaded from DB (fast!)'}
                    {!moviesGame?.source && '⚠️ Loading...'}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Spotify Game Preview */}
          {spotifyGame && (
            <Card className="mb-6 p-4">
              <h2 className="text-xl font-bold text-success mb-4">🎵 Spotify Game</h2>
              <div className="text-sm text-text-muted mb-2">
                Date: <span className="text-text-primary font-mono">{spotifyGame.date}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {spotifyGame.items.map((item: any, idx: number) => (
                  <div key={idx} className="bg-bg-secondary rounded-lg p-3">
                    <div className="text-xs text-text-muted mb-1">Round {idx === 0 ? 'Start' : idx}</div>
                    <div className="font-semibold text-text-primary text-sm mb-1">{item.name}</div>
                    <div className="text-success font-mono text-xs">
                      {formatValue(item.value, 'spotify')} listeners
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Movies Game Preview */}
          {moviesGame && (
            <Card className="mb-6 p-4">
              <h2 className="text-xl font-bold text-accent-cyan mb-4">🎬 Movies Game</h2>
              <div className="text-sm text-text-muted mb-2">
                Date: <span className="text-text-primary font-mono">{moviesGame.date}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {moviesGame.items.map((item: any, idx: number) => (
                  <div key={idx} className="bg-bg-secondary rounded-lg p-3">
                    <div className="text-xs text-text-muted mb-1">Round {idx === 0 ? 'Start' : idx}</div>
                    <div className="font-semibold text-text-primary text-sm mb-1">{item.name}</div>
                    <div className="text-error font-mono text-xs">
                      {formatValue(item.value, 'movies')} (FAKE)
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* How It Works */}
          <Card className="p-4">
            <h3 className="text-lg font-bold text-text-primary mb-3">📖 How Daily Generation Works</h3>
            <div className="space-y-3 text-sm text-text-secondary">
              <div>
                <strong className="text-success">🎵 Spotify (Cron at Midnight):</strong>
                <ol className="list-decimal list-inside mt-1 ml-2 space-y-1 text-xs">
                  <li>Scrape kworb.net for top ~200 artists</li>
                  <li>Shuffle with date seed</li>
                  <li>Pick 6 random artists</li>
                  <li>Fetch images from Spotify API</li>
                  <li>Store in daily_games table</li>
                </ol>
              </div>
              
              <div>
                <strong className="text-accent-cyan">🎬 Movies (Smart System):</strong>
                <ol className="list-decimal list-inside mt-1 ml-2 space-y-1 text-xs">
                  <li><strong>One-time:</strong> 1000 popular movies from TMDB (50 pages)</li>
                  <li><strong>Popular = made good money</strong> (box office success)</li>
                  <li><strong>NO rating filter</strong> - Any rating range (4-10 naturally)</li>
                  <li><strong>Wide time variety</strong> - 1970s to 2020s</li>
                  <li><strong>Daily:</strong> Pick 6 random (not yesterday's) → Fetch IMDB (6 calls)</li>
                </ol>
              </div>
              
              <div>
                <strong className="text-text-primary">👤 User Plays:</strong>
                <ol className="list-decimal list-inside mt-1 ml-2 space-y-1 text-xs">
                  <li>Pull today's game from daily_games</li>
                  <li>Hide all values except first one</li>
                  <li>Send to client</li>
                  <li>Fast! No API calls during gameplay</li>
                </ol>
              </div>
              
              <div className="pt-2 border-t border-white/10">
                <strong className="text-text-primary">⚙️ Setup Status:</strong>
                <div className="mt-2 space-y-1 text-xs">
                  <div className={spotifyGame?.source === 'database' ? 'text-success' : 'text-error'}>
                    {spotifyGame?.source === 'database' ? '✅' : '❌'} Spotify: {spotifyGame?.source === 'database' ? 'Using DB' : 'No data - run cron!'}
                  </div>
                  <div className={moviesGame?.source === 'database' ? 'text-success' : 'text-error'}>
                    {moviesGame?.source === 'database' ? '✅' : '❌'} Movies: {moviesGame?.source === 'database' ? 'Using DB' : 'No data - run cron!'}
                  </div>
                </div>
                <p className="text-xs mt-2 text-text-muted">
                  Click "Prepare Tomorrow's Games" to test cron manually
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

