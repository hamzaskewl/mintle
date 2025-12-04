'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getDailySeed } from '@/lib/game/daily-seed'
import { useAccount } from 'wagmi'
import { formatAddress } from '@/lib/utils/ens'

interface LeaderboardEntry {
  rank: number
  walletAddress: string
  score: number
  streak: number
  date?: string
}

export default function LeaderboardPage() {
  const [date, setDate] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<'movies' | 'spotify'>('spotify')
  const { address } = useAccount()
  
  useEffect(() => {
    setDate(getDailySeed())
  }, [])
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/leaderboard?category=${category}&date=${date}`)
        const data = await response.json()
        
        if (data.success) {
          setLeaderboard(data.leaderboard || [])
        } else {
          console.error('Failed to fetch leaderboard:', data.error)
          setLeaderboard([])
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
        setLeaderboard([])
      } finally {
        setLoading(false)
      }
    }
    
    if (date) {
      fetchLeaderboard()
    }
  }, [category, date])
  
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-bg-card/60 hover:bg-bg-card backdrop-blur-sm border border-white/10 rounded-full text-text-secondary hover:text-text-primary transition-all duration-200 shadow-lg"
            >
              Back
            </motion.div>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">Leaderboard</h1>
          <div className="w-16" />
        </div>
        
        {/* Category selector */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setCategory('spotify')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              category === 'spotify'
                ? 'bg-accent-purple text-white'
                : 'bg-bg-card/60 text-text-secondary hover:bg-bg-card'
            }`}
          >
            🎵 Spotify
          </button>
          <button
            onClick={() => setCategory('movies')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              category === 'movies'
                ? 'bg-accent-purple text-white'
                : 'bg-bg-card/60 text-text-secondary hover:bg-bg-card'
            }`}
          >
            🎬 Movies
          </button>
        </div>
        
        {/* Date badge */}
        <div className="flex justify-center">
          <div className="glass-card px-4 py-2 text-sm">
            <span className="text-text-muted">Daily scores for </span>
            <span className="text-accent-cyan font-mono">{date}</span>
          </div>
        </div>
        
        {/* Leaderboard */}
        <Card>
          {loading ? (
            <div className="p-8 text-center text-text-muted">
              Loading leaderboard...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <p>No scores yet for today!</p>
              <p className="mt-2 text-sm">Be the first to play and appear on the leaderboard.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm text-text-muted border-b border-white/10">
                <div className="col-span-1">#</div>
                <div className="col-span-7">Player</div>
                <div className="col-span-2 text-right">Score</div>
                <div className="col-span-2 text-right">Streak</div>
              </div>
              
              {/* Leaderboard rows */}
              {leaderboard.map((entry, index) => {
                const isCurrentUser = address?.toLowerCase() === entry.walletAddress.toLowerCase()
                return (
                  <motion.div
                    key={`${entry.walletAddress}-${entry.rank}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-lg transition-colors ${
                      index < 3 
                        ? 'bg-white/5' 
                        : isCurrentUser
                        ? 'bg-accent-purple/20 border border-accent-purple/30'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Rank */}
                    <div className="col-span-1 flex items-center">
                      {entry.rank === 1 && <span className="text-xl">🥇</span>}
                      {entry.rank === 2 && <span className="text-xl">🥈</span>}
                      {entry.rank === 3 && <span className="text-xl">🥉</span>}
                      {entry.rank > 3 && (
                        <span className="text-text-muted font-mono">{entry.rank}</span>
                      )}
                    </div>
                    
                    {/* Address */}
                    <div className="col-span-7 flex items-center gap-2">
                      <span className={`font-mono ${isCurrentUser ? 'text-accent-purple font-bold' : 'text-text-primary'}`}>
                        {formatAddress(entry.walletAddress)}
                      </span>
                      {isCurrentUser && (
                        <span className="text-xs bg-accent-purple/20 px-2 py-0.5 rounded text-accent-purple">
                          You
                        </span>
                      )}
                    </div>
                    
                    {/* Score */}
                    <div className="col-span-2 flex items-center justify-end">
                      <span className={`font-mono font-bold ${isCurrentUser ? 'text-accent-purple' : 'text-accent-cyan'}`}>
                        {entry.score}/5
                      </span>
                    </div>
                    
                    {/* Streak */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <span className="text-sm">🔥</span>
                      <span className="font-mono text-text-secondary">{entry.streak}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </Card>
        
        {/* Info notice */}
        {!address && (
          <div className="text-center text-text-muted text-sm">
            <p>Connect your Base Account to appear on the leaderboard</p>
            <p className="mt-1 text-accent-purple">Play games to compete!</p>
          </div>
        )}
      </div>
    </div>
  )
}

