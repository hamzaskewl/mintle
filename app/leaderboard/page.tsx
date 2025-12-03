'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getDailySeed } from '@/lib/game/daily-seed'

// Placeholder leaderboard data - will be replaced with Supabase integration
const mockLeaderboard = [
  { rank: 1, address: '0x1234...5678', score: 10, streak: 7 },
  { rank: 2, address: '0xabcd...efgh', score: 9, streak: 5 },
  { rank: 3, address: '0x9876...5432', score: 8, streak: 3 },
  { rank: 4, address: '0xfedc...ba98', score: 7, streak: 2 },
  { rank: 5, address: '0x5555...6666', score: 6, streak: 1 },
]

export default function LeaderboardPage() {
  const [date, setDate] = useState('')
  
  useEffect(() => {
    setDate(getDailySeed())
  }, [])
  
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-text-muted hover:text-text-primary transition-colors">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">Leaderboard</h1>
          <div className="w-16" />
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
          <div className="space-y-1">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm text-text-muted border-b border-white/10">
              <div className="col-span-1">#</div>
              <div className="col-span-7">Player</div>
              <div className="col-span-2 text-right">Score</div>
              <div className="col-span-2 text-right">Streak</div>
            </div>
            
            {/* Leaderboard rows */}
            {mockLeaderboard.map((entry, index) => (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-lg transition-colors ${
                  index < 3 ? 'bg-white/5' : 'hover:bg-white/5'
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
                <div className="col-span-7 flex items-center">
                  <span className="font-mono text-text-primary">{entry.address}</span>
                </div>
                
                {/* Score */}
                <div className="col-span-2 flex items-center justify-end">
                  <span className="font-mono font-bold text-accent-cyan">
                    {entry.score}/10
                  </span>
                </div>
                
                {/* Streak */}
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <span className="text-sm">🔥</span>
                  <span className="font-mono text-text-secondary">{entry.streak}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
        
        {/* Coming soon notice */}
        <div className="text-center text-text-muted text-sm">
          <p>Connect your wallet to appear on the leaderboard</p>
          <p className="mt-1 text-accent-purple">Wallet integration coming soon!</p>
        </div>
      </div>
    </div>
  )
}

