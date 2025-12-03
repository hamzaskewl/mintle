'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface CorrectAnimationProps {
  show: boolean
}

export function CorrectAnimation({ show }: CorrectAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="fixed inset-0 pointer-events-none flex items-center justify-center z-50"
        >
          <div className="text-9xl">✨</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

