'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameCard } from '@/components/game/GameCard'
import { GameItem } from '@/lib/game/types'
import Link from 'next/link'

export default function EndlessSpotifyPage() {
  const [items, setItems] = useState<GameItem[]>([])
  const [currentRound, setCurrentRound] = useState(0)
  const [displayRound, setDisplayRound] = useState(0)
  const [score, setScore] = useState(0)
  const [isRevealing, setIsRevealing] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showCorrect, setShowCorrect] = useState<'left' | 'right' | null>(null)
  const [showWrong, setShowWrong] = useState<'left' | 'right' | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch random artists
  const fetchNewArtists = async () => {
    try {
      const response = await fetch('/api/endless/spotify')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setItems(data.items)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching artists:', error)
    }
  }

  useEffect(() => {
    fetchNewArtists()
  }, [])

  const currentItem = items[displayRound]
  const nextItem = items[currentRound + 1]

  const handleCardClick = async (choice: 'left' | 'right') => {
    if (isRevealing || isTransitioning || !currentItem || !nextItem) return

    setIsRevealing(true)

    // Determine guess:
    // Click left = user thinks left (current) has more = next has less
    // Click right = user thinks right (next) has more = next has more
    const guess = choice === 'left' ? 'lower' : 'higher'
    
    // Verify answer with server
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentId: currentItem.id,
        nextId: nextItem.id,
        guess,
        category: 'spotify',
      }),
    })

    const result = await response.json()

    // Show result
    if (result.correct) {
      setShowCorrect(choice)
      setScore(score + 1)
    } else {
      setShowWrong(choice)
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Always slide to next (don't reset on wrong)
    setShowCorrect(null)
    setShowWrong(null)
    setIsRevealing(false)
    setIsTransitioning(true)
    setCurrentRound(currentRound + 1)
    
    setTimeout(() => {
      setDisplayRound(currentRound + 1)
      setIsTransitioning(false)
    }, 800) // Slower transition
    
    // Fetch more if running low
    if (currentRound >= items.length - 3) {
      fetchNewArtists()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bg-primary via-bg-secondary to-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎵</div>
          <div className="text-text-muted">Loading endless mode...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-primary via-bg-secondary to-bg-primary py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/"
            className="glass-card px-4 py-2 hover:bg-white/10 transition-colors"
          >
            ← Back
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-text-primary mb-1">
              🎵 Endless Mode
            </h1>
            <p className="text-text-muted text-sm">Testing artist variety</p>
          </div>
          
          <div className="glass-card px-4 py-2">
            <div className="text-2xl font-bold text-success">
              {score}
            </div>
            <div className="text-xs text-text-muted">Score</div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl lg:text-4xl font-bold text-text-primary">
            Which artist has <span className="text-success">more</span> monthly listeners?
          </h2>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 mb-8 relative">
          <div className="w-full max-w-[336px] flex-shrink-0 relative">
            <AnimatePresence mode="wait">
              {currentItem && (
                <motion.div
                  key={`current-${displayRound}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{
                    x: -400, // Less distance
                    transition: {
                      type: "spring",
                      stiffness: 100,
                      damping: 30,
                      duration: 0.8 // Slower
                    }
                  }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleCardClick('left')}
                  className={!isRevealing && !isTransitioning ? 'cursor-pointer' : ''}
                >
                  <GameCard
                    name={currentItem.name}
                    subtitle={currentItem.subtitle}
                    imageUrl={currentItem.imageUrl}
                    value={currentItem.value}
                    showValue={displayRound > 0 || isRevealing}
                    category="spotify"
                    isClickable={!isRevealing && !isTransitioning}
                    isWrong={showWrong === 'left'}
                    disableAnimation={displayRound > 0}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-4xl font-black text-text-muted/30 hidden lg:block">
            VS
          </div>

          <div className="w-full max-w-[336px] flex-shrink-0 relative">
            <AnimatePresence mode="wait">
              {nextItem && !isTransitioning && (
                <motion.div
                  key={`next-${currentRound}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{
                    x: -400, // Less distance
                    transition: {
                      type: "spring",
                      stiffness: 100,
                      damping: 30,
                      duration: 0.8 // Slower
                    }
                  }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  onClick={() => handleCardClick('right')}
                  className={!isRevealing && !isTransitioning ? 'cursor-pointer' : ''}
                >
                  <GameCard
                    name={nextItem.name}
                    subtitle={nextItem.subtitle}
                    imageUrl={nextItem.imageUrl}
                    value={nextItem.value}
                    showValue={isRevealing}
                    category="spotify"
                    isClickable={!isRevealing && !isTransitioning}
                    isWrong={showWrong === 'right'}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="text-center text-text-muted text-sm">
          <p>Click a card to guess. Keep going until you're wrong!</p>
        </div>
      </div>
    </div>
  )
}

