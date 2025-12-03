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
    title: 'Click to Choose',
    description: 'You\'ll see two items. Click on the card you think has the higher value!',
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
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-bg-card/60 hover:bg-bg-card backdrop-blur-sm border border-white/10 rounded-full text-text-secondary hover:text-text-primary transition-all duration-200 shadow-lg"
            >
              Back
            </motion.div>
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
              <span className="font-bold text-text-primary">Left card:</span> <span className="text-accent-cyan font-bold">The Godfather</span> - 
              rating <span className="font-mono text-text-muted">???</span>
            </p>
            <p>
              <span className="font-bold text-text-primary">Right card:</span> <span className="text-accent-cyan font-bold">Inception</span> - 
              rating <span className="font-mono text-text-muted">???</span>
            </p>
            <p>
              Question: <span className="font-bold">"Which movie is rated higher?"</span>
            </p>
            <p>
              You click on <span className="text-accent-cyan font-bold">The Godfather</span> because you think 
              it has the higher rating.
            </p>
            <p>
              Both ratings are revealed: The Godfather <span className="font-mono text-success">9.2</span> vs Inception <span className="font-mono text-success">8.8</span>
            </p>
            <p className="text-success font-bold">
              ✓ Correct! The Godfather (9.2) is higher than Inception (8.8)
            </p>
            <p className="text-text-muted italic mt-2">
              The winning card slides to the left, and a new movie appears on the right for round 2!
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

