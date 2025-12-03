'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

const steps = [
  {
    emoji: '🎯',
    title: 'Choose a Category',
    description: 'Pick between Movies (IMDB ratings) or Spotify (monthly listeners).',
  },
  {
    emoji: '🤔',
    title: 'Compare Values',
    description: 'You\'ll see two items. Guess if the second one is higher or lower than the first.',
  },
  {
    emoji: '✅',
    title: 'Get It Right',
    description: 'Correct guesses advance you to the next round. Wrong guesses end the game.',
  },
  {
    emoji: '🏆',
    title: 'Score 5/5',
    description: 'Get all 5 comparisons correct for a perfect score!',
  },
  {
    emoji: '🔥',
    title: 'Build Streaks',
    description: 'Play daily to build your streak and climb the leaderboard.',
  },
  {
    emoji: '🌅',
    title: 'Daily Reset',
    description: 'New puzzles every day at midnight EST. Same puzzles for everyone!',
  },
]

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-text-muted hover:text-text-primary transition-colors">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">How to Play</h1>
          <div className="w-16" />
        </div>
        
        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="flex items-start gap-4">
                <div className="text-4xl">{step.emoji}</div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-1">
                    {step.title}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {step.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Example */}
        <Card>
          <h3 className="text-lg font-bold text-text-primary mb-4">Example</h3>
          <div className="space-y-4 text-sm text-text-secondary">
            <p>
              You see <span className="text-accent-cyan font-bold">The Godfather</span> with 
              rating <span className="font-mono text-success">9.2</span>
            </p>
            <p>
              Then you see <span className="text-accent-cyan font-bold">Inception</span> with 
              a hidden rating <span className="font-mono text-text-muted">???</span>
            </p>
            <p>
              You guess <span className="text-error font-bold">Lower</span> because you think 
              Inception is rated lower than The Godfather.
            </p>
            <p>
              Inception's rating is revealed: <span className="font-mono text-success">8.8</span>
            </p>
            <p className="text-success font-bold">
              ✓ Correct! 8.8 is lower than 9.2
            </p>
          </div>
        </Card>
        
        {/* CTA */}
        <div className="text-center">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary"
            >
              Start Playing →
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  )
}

