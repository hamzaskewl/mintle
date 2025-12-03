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
    <div className="flex items-center gap-3">
      {Array.from({ length: total }).map((_, index) => {
        const result = results[index] || 'pending'
        const isCurrent = index === currentRound
        
        return (
          <motion.div
            key={index}
            initial={false}
            animate={{
              scale: isCurrent ? 1.3 : 1,
              opacity: result === 'pending' && index > currentRound ? 0.3 : 1,
            }}
            className={cn(
              'w-3 h-3 rounded-full transition-all duration-300',
              result === 'pending' && 'bg-white/20',
              result === 'correct' && 'bg-success shadow-lg shadow-success/50',
              result === 'wrong' && 'bg-error shadow-lg shadow-error/50'
            )}
          />
        )
      })}
    </div>
  )
}

