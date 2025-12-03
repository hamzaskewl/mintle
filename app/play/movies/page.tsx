'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameCard } from '@/components/game/GameCard'
import { ScoreIndicator } from '@/components/game/ScoreIndicator'
import { GameOver } from '@/components/game/GameOver'
import { Card } from '@/components/ui/Card'
import { GameItem, DailyGame } from '@/lib/game/types'
import { checkGuess, hasPlayedToday, markAsPlayed, getTodayScore, updateStreak } from '@/lib/game/game-logic'
// import { playCorrectSound, playWrongSound } from '@/lib/sounds' // TODO: Add sound effects later
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
  const [wrongCard, setWrongCard] = useState<'left' | 'right' | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayRound, setDisplayRound] = useState(0)
  
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
  
  const handleCardClick = useCallback(async (clickedSide: 'left' | 'right') => {
    if (!game || isRevealing || isGameOver) return
    
    setIsRevealing(true)
    
    // Convert card click to higher/lower guess
    // Clicking left = you think left has more (so right has lower)
    // Clicking right = you think right has more (so right has higher)
    const guess: 'higher' | 'lower' = clickedSide === 'right' ? 'higher' : 'lower'
    
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
        // playCorrectSound() // TODO: Add sound effects later
        setScore(prev => prev + 1)
        
        if (currentRound + 1 >= TOTAL_ROUNDS) {
          markAsPlayed('movies', score + 1)
          updateStreak()
          setIsGameOver(true)
        } else {
          // Wait for count-up animation to complete (2s) + a bit more
          await new Promise(resolve => setTimeout(resolve, 2300))
          
          // Start transition
          setIsTransitioning(true)
          
          // Advance to next round (triggers slide animation)
          setCurrentRound(prev => prev + 1)
          
          // Wait for slide animation to complete before updating display (longer now)
          await new Promise(resolve => setTimeout(resolve, 900))
          
          // Now update the left card display
          setDisplayRound(prev => prev + 1)
          setIsTransitioning(false)
        }
      } else {
        // playWrongSound() // TODO: Add sound effects later
        // Set which card was wrong
        setWrongCard(clickedSide)
        // Wait a bit to show the wrong answer before game over
        await new Promise(resolve => setTimeout(resolve, 2500))
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
  
  // Current and next items - use displayRound for left card to delay update
  const currentItem = game.items[displayRound]
  const nextItem = game.items[currentRound + 1]
  
  return (
    <div className="min-h-screen flex flex-col p-6">
      {/* Header */}
      <div className="flex flex-col items-center mb-8 gap-4">
        <div className="flex items-center justify-between w-full">
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-bg-card/60 hover:bg-bg-card backdrop-blur-sm border border-white/10 rounded-full text-text-secondary hover:text-text-primary transition-all duration-200 shadow-lg"
            >
              Back
            </motion.div>
          </Link>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan via-accent-blue to-accent-purple">
            MorL
          </h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
        
        {/* Game mode switcher */}
        <div className="flex items-center gap-3">
          <Link href="/play/spotify">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-bg-card/60 hover:bg-bg-card backdrop-blur-sm border border-white/10 rounded-full text-text-secondary hover:text-text-primary transition-all duration-200"
            >
              <span className="text-xl mr-2">🎵</span>
              <span className="font-semibold">Spotify</span>
            </motion.div>
          </Link>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="px-4 py-2 bg-accent-cyan/20 border-2 border-accent-cyan rounded-full"
          >
            <span className="text-xl mr-2">🎬</span>
            <span className="font-semibold text-accent-cyan">Movies</span>
          </motion.div>
        </div>
      </div>
      
      {/* Game area */}
      <div className="flex-1 flex items-center justify-center py-4">
        <div className="w-full max-w-5xl px-4 space-y-4">
          {/* Question text */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-2xl lg:text-4xl font-bold text-text-primary">
              Which movie is rated <span className="text-accent-cyan">higher</span>?
            </h2>
          </motion.div>
          
          {/* Cards Container */}
          <div className="relative flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8">
            {/* Left card - STATIC, shows value only after first round */}
            <div className="w-full max-w-[336px] flex-shrink-0">
              <button
                onClick={() => handleCardClick('left')}
                disabled={isRevealing}
                className="w-full h-full text-left disabled:cursor-not-allowed"
              >
                <GameCard
                  name={currentItem.name}
                  imageUrl={currentItem.imageUrl}
                  value={currentItem.value}
                  showValue={(displayRound > 0 || isRevealing) && !isTransitioning}
                  category="movies"
                  isClickable={!isRevealing}
                  isWrong={wrongCard === 'left'}
                  disableAnimation={displayRound > 0}
                />
              </button>
            </div>
            
            {/* Right card - ANIMATED, slides over left when correct */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`next-${currentRound}`}
                initial={{ opacity: 1 }}
                animate={{ 
                  opacity: 1
                }}
                exit={{ 
                  x: '-100%',
                  transition: { 
                    type: "spring",
                    stiffness: 90,
                    damping: 25,
                    duration: 0.8
                  }
                }}
                className="w-full max-w-[336px] flex-shrink-0 relative z-10"
              >
                <button
                  onClick={() => handleCardClick('right')}
                  disabled={isRevealing}
                  className="w-full h-full text-left disabled:cursor-not-allowed"
                >
                  <GameCard
                    name={nextItem.name}
                    imageUrl={nextItem.imageUrl}
                    value={nextItem.value}
                    showValue={isRevealing}
                    category="movies"
                    isClickable={!isRevealing}
                    isWrong={wrongCard === 'right'}
                  />
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Score indicator with numbers - Below cards */}
          <div className="flex justify-center pt-4">
            <ScoreIndicator total={TOTAL_ROUNDS} results={results} currentRound={currentRound} />
          </div>
        </div>
      </div>
      
      {/* Game Over Overlay */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <GameOver
              score={score}
              total={TOTAL_ROUNDS}
              results={results}
              category="movies"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

