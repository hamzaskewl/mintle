'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface ScoreIndicatorProps {
  total: number
  results: ('correct' | 'wrong' | 'pending')[]
  currentRound: number
}

export function ScoreIndicator({ total, results, currentRound }: ScoreIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, index) => {
        const result = results[index] || 'pending'
        const isCurrent = index === currentRound
        const isPast = index < currentRound
        
        return (
          <motion.div
            key={index}
            initial={false}
            animate={{
              scale: isCurrent ? 1.1 : 1,
            }}
            className={cn(
              'relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 font-bold text-sm',
              result === 'pending' && 'bg-bg-card border-bg-secondary text-text-muted',
              result === 'correct' && 'bg-success border-success/30 text-white shadow-lg shadow-success/30',
              result === 'wrong' && 'bg-error border-error/30 text-white shadow-lg shadow-error/30',
              isCurrent && result === 'pending' && 'border-accent-cyan text-text-primary'
            )}
          >
            {result === 'correct' && (
              <span className="text-base">✓</span>
            )}
            {result === 'wrong' && (
              <span className="text-base">✗</span>
            )}
            {result === 'pending' && (
              <span className="text-xs">{index + 1}</span>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

