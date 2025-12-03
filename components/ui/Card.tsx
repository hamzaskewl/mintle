'use client'

import { cn } from '@/lib/utils'
import { motion, HTMLMotionProps } from 'framer-motion'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  hover?: boolean
  glow?: boolean
}

export function Card({ 
  className, 
  hover = false, 
  glow = false, 
  children, 
  ...props 
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'glass-card p-6',
        hover && 'hover:bg-bg-card-hover cursor-pointer transition-colors',
        glow && 'glow-border',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

