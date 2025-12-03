'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ScoreIndicator } from './ScoreIndicator'
import { Category } from '@/lib/game/types'
import { getTimeUntilReset } from '@/lib/game/daily-seed'
import { getStreak } from '@/lib/game/game-logic'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface GameOverProps {
  score: number
  total: number
  results: ('correct' | 'wrong' | 'pending')[]
  category: Category
}

export function GameOver({ score, total, results, category }: GameOverProps) {
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilReset())
  const [streak, setStreak] = useState({ current: 0, best: 0 })
  
  useEffect(() => {
    setStreak(getStreak())
    
    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  const isPerfect = score === total
  const shareText = `MorL ${category === 'movies' ? '🎬' : '🎵'}\n${results.map(r => r === 'correct' ? '🟢' : '🔴').join('')}\nScore: ${score}/${total}\n🔥 Streak: ${streak.current}`
  
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'MorL - Daily More or Less',
        text: shareText,
      })
    } else {
      await navigator.clipboard.writeText(shareText)
      alert('Results copied to clipboard!')
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 w-full max-w-md mx-auto"
    >
      <Card className="w-full text-center">
        {/* Result header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-6xl mb-4"
        >
          {isPerfect ? '🏆' : score >= 3 ? '⭐' : '💪'}
        </motion.div>
        
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {isPerfect ? 'Perfect!' : score >= 3 ? 'Great job!' : 'Nice try!'}
        </h2>
        
        {/* Score display */}
        <div className="my-6">
          <div className="text-5xl font-mono font-bold text-accent-cyan">
            {score}<span className="text-text-muted">/{total}</span>
          </div>
        </div>
        
        {/* Result dots */}
        <div className="flex justify-center mb-6">
          <ScoreIndicator total={total} results={results} currentRound={total} />
        </div>
        
        {/* Streak */}
        <div className="flex justify-center gap-8 py-4 border-t border-white/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-blue">{streak.current}</div>
            <div className="text-xs text-text-muted">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-purple">{streak.best}</div>
            <div className="text-xs text-text-muted">Best Streak</div>
          </div>
        </div>
      </Card>
      
      {/* Next game countdown */}
      <Card className="w-full text-center">
        <p className="text-text-secondary text-sm mb-2">Next game in</p>
        <div className="font-mono text-2xl text-text-primary">
          {String(timeUntilReset.hours).padStart(2, '0')}:
          {String(timeUntilReset.minutes).padStart(2, '0')}:
          {String(timeUntilReset.seconds).padStart(2, '0')}
        </div>
      </Card>
      
      {/* Actions */}
      <div className="flex gap-4 w-full">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={handleShare}
        >
          Share 📤
        </Button>
        <Link href="/" className="flex-1">
          <Button variant="primary" className="w-full">
            Play Another
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}

