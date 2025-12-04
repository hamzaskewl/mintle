'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { getTimeUntilReset } from '@/lib/game/daily-seed'
import { getTodayScore, getStreak } from '@/lib/game/game-logic'
import { useEffect, useState } from 'react'

const categories = [
  {
    id: 'movies',
    name: 'Movies',
    emoji: '🎬',
    description: 'Guess IMDB ratings',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    emoji: '🎵',
    description: 'Guess monthly listeners',
    gradient: 'from-green-500 to-emerald-600',
  },
]

export default function Home() {
  const [streak, setStreak] = useState({ current: 0, best: 0 })
  const [timeUntilReset, setTimeUntilReset] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [playedStatus, setPlayedStatus] = useState<Record<string, number | null>>({})
  
  useEffect(() => {
    setStreak(getStreak())
    setTimeUntilReset(getTimeUntilReset())
    setPlayedStatus({
      movies: getTodayScore('movies'),
      spotify: getTodayScore('spotify'),
    })
    
    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-5xl font-bold">
            <span className="bg-gradient-to-r from-accent-cyan via-accent-blue to-accent-purple bg-clip-text text-transparent">
              MorL
            </span>
          </h1>
          <p className="text-text-secondary">
            Daily More or Less Challenge
          </p>
        </motion.div>
        
        {/* Streak display & Leaderboard */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center items-center gap-3"
        >
          {streak.current > 0 && (
            <div className="glass-card px-6 py-3 flex items-center gap-4">
              <div className="text-2xl">🔥</div>
              <div>
                <div className="text-lg font-bold text-text-primary">{streak.current} day streak</div>
                <div className="text-xs text-text-muted">Best: {streak.best} days</div>
              </div>
            </div>
          )}
          
          <Link href="/leaderboard">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass-card px-6 py-3 flex items-center gap-3 bg-accent-cyan/10 border-2 border-accent-cyan/30 hover:border-accent-cyan transition-all duration-200 cursor-pointer"
            >
              <div className="text-2xl">🏆</div>
              <div>
                <div className="text-sm font-bold text-accent-cyan">Leaderboard</div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
        
        {/* Categories */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-text-muted text-center">Choose a category</h2>
          
          <div className="grid gap-4">
            {categories.map((category, index) => {
              const todayScore = playedStatus[category.id]
              const hasPlayed = todayScore !== null
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/play/${category.id}`}>
                    <Card hover className="group relative overflow-hidden">
                      {/* Gradient accent */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                      
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{category.emoji}</div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-text-primary group-hover:text-accent-cyan transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            {category.description}
                          </p>
                        </div>
                        
                        {/* Score badge if played */}
                        {hasPlayed ? (
                          <div className="flex flex-col items-center">
                            <div className="text-xl font-mono font-bold text-success">
                              {todayScore}/5
                            </div>
                            <div className="text-xs text-text-muted">played</div>
                          </div>
                        ) : (
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-2xl text-text-muted group-hover:text-accent-cyan transition-colors"
                          >
                            →
                          </motion.div>
                        )}
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
        
        {/* Next reset */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center space-y-1"
        >
          <p className="text-xs text-text-muted">New puzzles in</p>
          <p className="font-mono text-text-secondary">
            {String(timeUntilReset.hours).padStart(2, '0')}:
            {String(timeUntilReset.minutes).padStart(2, '0')}:
            {String(timeUntilReset.seconds).padStart(2, '0')}
          </p>
        </motion.div>
        
        {/* Footer links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-6 text-sm text-text-muted"
        >
          <Link href="/how-to-play" className="hover:text-accent-cyan transition-colors">
            How to play
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

