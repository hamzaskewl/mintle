'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameCard } from '@/components/game/GameCard'
import { CompareButtons } from '@/components/game/CompareButtons'
import { ScoreIndicator } from '@/components/game/ScoreIndicator'
import { GameOver } from '@/components/game/GameOver'
import { Card } from '@/components/ui/Card'
import { GameItem, DailyGame } from '@/lib/game/types'
import { checkGuess, hasPlayedToday, markAsPlayed, getTodayScore, updateStreak } from '@/lib/game/game-logic'
import Link from 'next/link'

const TOTAL_ROUNDS = 5

export default function MoviesGame() {
  const [game, setGame] = useState<DailyGame | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<('correct' | 'wrong' | 'pending')[]>([])
  const [isGameOver, setIsGameOver] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)
  const [previousScore, setPreviousScore] = useState<number | null>(null)
  
  // Fetch game data
  useEffect(() => {
    const fetchGame = async () => {
      // DEV MODE: Comment out to allow replaying
      // if (hasPlayedToday('movies')) {
      //   const prevScore = getTodayScore('movies')
      //   setAlreadyPlayed(true)
      //   setPreviousScore(prevScore)
      //   setLoading(false)
      //   return
      // }
      
      try {
        const response = await fetch('/api/daily/movies')
        if (!response.ok) throw new Error('Failed to fetch game')
        
        const data = await response.json()
        setGame(data)
        setResults(Array(TOTAL_ROUNDS).fill('pending'))
      } catch (err) {
        setError('Failed to load today\'s game')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchGame()
  }, [])
  
  const handleGuess = useCallback(async (guess: 'higher' | 'lower') => {
    if (!game || isRevealing || isGameOver) return
    
    setIsRevealing(true)
    
    try {
      // Verify guess server-side
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'movies',
          date: game.date,
          round: currentRound,
          guess,
        }),
      })
      
      if (!response.ok) throw new Error('Verification failed')
      
      const result = await response.json()
      
      // Update game items with real values
      const updatedItems = [...game.items]
      updatedItems[currentRound].value = result.currentValue
      updatedItems[currentRound + 1].value = result.nextValue
      setGame({ ...game, items: updatedItems })
      
      // Wait for reveal animation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newResults = [...results]
      newResults[currentRound] = result.correct ? 'correct' : 'wrong'
      setResults(newResults)
      
      if (result.correct) {
        setScore(prev => prev + 1)
        
        if (currentRound + 1 >= TOTAL_ROUNDS) {
          markAsPlayed('movies', score + 1)
          updateStreak()
          setIsGameOver(true)
        } else {
          // Smooth transition to next round
          await new Promise(resolve => setTimeout(resolve, 800))
          setCurrentRound(prev => prev + 1)
        }
      } else {
        markAsPlayed('movies', score)
        updateStreak()
        setIsGameOver(true)
      }
    } catch (error) {
      console.error('Error verifying guess:', error)
      alert('Failed to verify guess. Please try again.')
    }
    
    setIsRevealing(false)
  }, [game, currentRound, isRevealing, isGameOver, results, score])
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full"
        />
      </div>
    )
  }
  
  // Already played state
  if (alreadyPlayed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Already Played!
          </h1>
          <p className="text-text-secondary mb-4">
            You scored <span className="text-accent-cyan font-bold">{previousScore}/5</span> today
          </p>
          <p className="text-text-muted text-sm mb-6">
            Come back tomorrow for a new challenge!
          </p>
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full"
            >
              Back to Home
            </motion.button>
          </Link>
        </Card>
      </div>
    )
  }
  
  // Error state
  if (error || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">😵</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Oops!</h1>
          <p className="text-text-secondary mb-6">{error || 'Something went wrong'}</p>
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary"
            >
              Back to Home
            </motion.button>
          </Link>
        </Card>
      </div>
    )
  }
  
  // Game over state
  if (isGameOver) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GameOver
          score={score}
          total={TOTAL_ROUNDS}
          results={results}
          category="movies"
        />
      </div>
    )
  }
  
  const currentItem = game.items[currentRound]
  const nextItem = game.items[currentRound + 1]
  
  return (
    <div className="min-h-screen flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="text-text-muted hover:text-text-primary transition-colors">
          ← Back
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎬</span>
          <span className="font-bold text-text-primary">Movies</span>
        </div>
        <div className="w-16" /> {/* Spacer */}
      </div>
      
      {/* Score indicator */}
      <div className="flex justify-center mb-8">
        <ScoreIndicator total={TOTAL_ROUNDS} results={results} currentRound={currentRound} />
      </div>
      
      {/* Game area */}
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-6xl px-4 space-y-6">
          {/* Question text */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-lg lg:text-xl text-text-primary">
              Does <span className="font-bold text-accent-cyan">{nextItem.name}</span> have a
            </p>
            <p className="text-2xl lg:text-3xl font-bold text-text-primary mt-1">
              higher or lower IMDB rating?
            </p>
            <p className="text-sm text-text-muted mt-2">
              than <span className="text-accent-cyan">{currentItem.name}</span>
            </p>
          </motion.div>
          
          {/* Cards */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8">
            {/* Current item */}
            <motion.div 
              key={`current-${currentRound}`}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-[320px]"
            >
              <GameCard
                name={currentItem.name}
                imageUrl={currentItem.imageUrl}
                value={currentItem.value}
                showValue={true}
                category="movies"
              />
            </motion.div>
            
            {/* VS separator */}
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-3xl font-bold text-text-muted opacity-50"
            >
              VS
            </motion.div>
            
            {/* Next item */}
            <motion.div
              key={`next-${currentRound}`}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
              className="w-full max-w-[320px]"
            >
              <GameCard
                name={nextItem.name}
                imageUrl={nextItem.imageUrl}
                value={nextItem.value}
                showValue={isRevealing}
                category="movies"
                isActive={true}
              />
            </motion.div>
          </div>
          
          {/* Buttons at bottom */}
          <div className="flex justify-center">
            <CompareButtons
              category="movies"
              onGuess={handleGuess}
              disabled={isRevealing}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

