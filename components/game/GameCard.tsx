'use client'

import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { Category } from '@/lib/game/types'
import { formatValue } from '@/lib/game/game-logic'
import { useCountUp } from '@/lib/use-count-up'

interface GameCardProps {
  name: string
  subtitle?: string
  imageUrl: string
  value?: number
  showValue: boolean
  category: Category
  isActive?: boolean
  isRevealing?: boolean
  isClickable?: boolean
  isWrong?: boolean
  disableAnimation?: boolean
}

export function GameCard({
  name,
  subtitle,
  imageUrl,
  value,
  showValue,
  category,
  isActive = false,
  isRevealing = false,
  isClickable = false,
  isWrong = false,
  disableAnimation = false,
}: GameCardProps) {
  const [imageError, setImageError] = useState(false)
  const [startAnimation, setStartAnimation] = useState(false)
  
  // Animate the count-up (disabled if disableAnimation is true)
  const animatedValue = useCountUp(value || 0, 2000, startAnimation && !isWrong && !disableAnimation)
  
  useEffect(() => {
    // Never animate if disableAnimation is true
    if (disableAnimation) {
      setStartAnimation(false)
      return
    }
    
    if (showValue && value && value > 0 && !isWrong) {
      // Small delay before starting animation
      setStartAnimation(false)
      setTimeout(() => setStartAnimation(true), 100)
    } else if (isWrong) {
      // Show immediately without animation for wrong answers
      setStartAnimation(false)
    } else {
      setStartAnimation(false)
    }
  }, [showValue, value, isWrong, disableAnimation])
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={isClickable ? { scale: 1.03, y: -8 } : {}}
      whileTap={isClickable ? { scale: 0.97 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        'relative overflow-hidden w-full rounded-2xl shadow-2xl border-4',
        isClickable && 'cursor-pointer hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:border-accent-cyan transition-all duration-300 border-white/20',
        !isClickable && !isWrong && 'border-white/10',
        isWrong && 'border-error border-4 shadow-[0_0_30px_rgba(239,68,68,0.6)]',
        isActive && 'ring-4 ring-accent-cyan/60'
      )}
    >
      {/* Image with overlay */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-bg-secondary">
        {imageUrl && !imageError ? (
          <>
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
              onError={() => {
                console.error(`Failed to load image for ${name}: ${imageUrl}`)
                setImageError(true)
              }}
              unoptimized
            />
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-card">
            <span className="text-8xl opacity-50">
              {category === 'movies' ? '🎬' : '🎵'}
            </span>
          </div>
        )}
        
        {/* Text overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <h3 className="text-2xl font-bold text-white drop-shadow-lg">{name}</h3>
          
          {/* Value display */}
          <AnimatePresence mode="wait">
            {showValue && value !== undefined && value > 0 ? (
              <motion.div
                key="value"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-1"
              >
                <div className="text-xs text-white/80 uppercase tracking-wide">
                  {category === 'movies' ? 'IMDB Rating' : 'Monthly Listeners'}
                </div>
                <div className={cn(
                  "font-mono font-bold text-white drop-shadow-lg",
                  category === 'spotify' ? 'text-2xl' : 'text-4xl'
                )}>
                  {(isWrong || disableAnimation) ? formatValue(value, category) : formatValue(startAnimation ? animatedValue : value, category)}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-start gap-1"
              >
                <div className="text-xs text-white/60 uppercase tracking-wide">
                  {category === 'movies' ? 'IMDB Rating' : 'Monthly Listeners'}
                </div>
                <div className="text-5xl opacity-60">❓</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

