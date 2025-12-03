'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Category } from '@/lib/game/types'
import { getComparisonLabel } from '@/lib/game/game-logic'

interface CompareButtonsProps {
  category: Category
  onGuess: (guess: 'higher' | 'lower') => void
  disabled?: boolean
}

export function CompareButtons({ category, onGuess, disabled }: CompareButtonsProps) {
  const labels = getComparisonLabel(category)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 w-full max-w-xs"
    >
      <Button
        variant="higher"
        size="lg"
        onClick={() => onGuess('higher')}
        disabled={disabled}
        className="w-full group"
      >
        <span className="flex items-center justify-center gap-2">
          <motion.span
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            ↑
          </motion.span>
          {labels.higher}
        </span>
      </Button>
      
      <div className="text-center text-text-muted text-sm">
        or
      </div>
      
      <Button
        variant="lower"
        size="lg"
        onClick={() => onGuess('lower')}
        disabled={disabled}
        className="w-full group"
      >
        <span className="flex items-center justify-center gap-2">
          <motion.span
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            ↓
          </motion.span>
          {labels.lower}
        </span>
      </Button>
    </motion.div>
  )
}

