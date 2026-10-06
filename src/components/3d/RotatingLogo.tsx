'use client'

import { motion } from 'framer-motion'
import { Scale, Shield } from 'lucide-react'

export default function RotatingLogo() {
  return (
    <div className="relative w-32 h-32 mx-auto">
      <motion.div
        className="absolute inset-0 rounded-full gradient-border"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <div className="w-full h-full bg-dark-bg rounded-full flex items-center justify-center">
          <div className="relative">
            {/* Main logo icon */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-2xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
            
            {/* Rotating rings */}
            <motion.div
              className="absolute -inset-4 rounded-full border-2 border-primary-500/30"
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            />
            
            <motion.div
              className="absolute -inset-6 rounded-full border-2 border-secondary-500/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            />
            
            {/* Floating dots */}
            <motion.div
              className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-neon-cyan"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-neon-purple"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            <motion.div
              className="absolute -top-2 -left-2 w-3 h-3 rounded-full bg-neon-pink"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 1 }}
            />
          </div>
        </div>
      </motion.div>
      
      {/* Glow effect */}
      <div className="absolute -inset-8 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 blur-3xl rounded-full" />
    </div>
  )
}