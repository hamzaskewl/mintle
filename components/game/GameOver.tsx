'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ScoreIndicator } from './ScoreIndicator'
import { Category } from '@/lib/game/types'
import { getTimeUntilReset } from '@/lib/game/daily-seed'
import { getStreak, hasPlayedToday } from '@/lib/game/game-logic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface GameOverProps {
  score: number
  total: number
  results: ('correct' | 'wrong' | 'pending')[]
  category: Category
}

export function GameOver({ score, total, results, category }: GameOverProps) {
  const router = useRouter()
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilReset())
  const [streak, setStreak] = useState({ current: 0, best: 0 })
  const [hasPlayedOther, setHasPlayedOther] = useState(false)
  
  useEffect(() => {
    setStreak(getStreak())
    
    // Check if the other category has been played
    const otherCategory = category === 'movies' ? 'spotify' : 'movies'
    setHasPlayedOther(hasPlayedToday(otherCategory))
    
    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  const isPerfect = score === total
  const shareText = `MorL ${category === 'movies' ? '🎬' : '🎵'}\n${results.map(r => r === 'correct' ? '🟢' : '🔴').join('')}\nScore: ${score}/${total}\n🔥 Streak: ${streak.current}`
  
  const otherCategory = category === 'movies' ? 'spotify' : 'movies'
  const nextUrl = hasPlayedOther ? '/' : `/play/${otherCategory}`
  const nextLabel = hasPlayedOther ? 'Home' : 'Next'
  
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
  
  const handleNext = () => {
    router.push(nextUrl)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-sm mx-auto relative"
    >
      {/* Close button */}
      <button
        onClick={() => router.push('/')}
        className="absolute -top-2 -right-2 w-8 h-8 bg-bg-card hover:bg-error/80 rounded-full flex items-center justify-center text-text-primary hover:text-white transition-all duration-200 border-2 border-white/10 hover:border-error z-10"
      >
        ✕
      </button>
      
      <Card className="w-full text-center p-6">
        {/* Result header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-4xl mb-2"
        >
          {isPerfect ? '🏆' : score >= 3 ? '⭐' : '💪'}
        </motion.div>
        
        <h2 className="text-xl font-bold text-text-primary mb-3">
          {isPerfect ? 'Perfect!' : score >= 3 ? 'Great job!' : 'Nice try!'}
        </h2>
        
        {/* Score display */}
        <div className="mb-3">
          <div className="text-4xl font-mono font-bold text-accent-cyan">
            {score}<span className="text-text-muted">/{total}</span>
          </div>
        </div>
        
        {/* Result dots */}
        <div className="flex justify-center mb-4">
          <ScoreIndicator total={total} results={results} currentRound={total} />
        </div>
        
        {/* Streak & Next game in one row */}
        <div className="flex justify-between items-center gap-4 py-3 border-y border-white/10 mb-4">
          <div className="text-center flex-1">
            <div className="text-xl font-bold text-accent-blue">{streak.current}</div>
            <div className="text-xs text-text-muted">Streak</div>
          </div>
          <div className="text-center flex-1">
            <div className="font-mono text-lg text-text-primary">
              {String(timeUntilReset.hours).padStart(2, '0')}:
              {String(timeUntilReset.minutes).padStart(2, '0')}:
              {String(timeUntilReset.seconds).padStart(2, '0')}
            </div>
            <div className="text-xs text-text-muted">Next game</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-xl font-bold text-accent-purple">{streak.best}</div>
            <div className="text-xs text-text-muted">Best</div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1 py-2"
            onClick={handleShare}
          >
            Share 📤
          </Button>
          <Button 
            variant="primary" 
            className="flex-1 py-2"
            onClick={handleNext}
          >
            {nextLabel} {!hasPlayedOther && (category === 'movies' ? '🎵' : '🎬')}
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

