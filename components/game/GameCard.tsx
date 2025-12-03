'use client'

import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import React from 'react'
import { Category } from '@/lib/game/types'
import { formatValue } from '@/lib/game/game-logic'

interface GameCardProps {
  name: string
  subtitle?: string
  imageUrl: string
  value?: number
  showValue: boolean
  category: Category
  isActive?: boolean
  isRevealing?: boolean
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
}: GameCardProps) {
  const [imageError, setImageError] = React.useState(false)
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative overflow-hidden w-full rounded-2xl',
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
                  {formatValue(value, category)}
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

