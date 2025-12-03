'use client'

import { cn } from '@/lib/utils'
import { motion, HTMLMotionProps } from 'framer-motion'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'higher' | 'lower' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-accent-blue hover:bg-accent-blue/80 text-white shadow-lg shadow-accent-blue/25',
    secondary: 'bg-bg-card hover:bg-bg-card-hover text-text-primary border border-white/10',
    higher: 'bg-gradient-to-r from-success to-emerald-400 text-white shadow-lg shadow-success/25',
    lower: 'bg-gradient-to-r from-error to-rose-400 text-white shadow-lg shadow-error/25',
    ghost: 'bg-transparent hover:bg-white/5 text-text-secondary hover:text-text-primary',
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </motion.button>
  )
}

