'use client'

import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

interface TypingIndicatorProps {
  isTyping?: boolean
  message?: string
}

export default function TypingIndicator({
  isTyping = true,
  message = 'Legal AI Assistant đang soạn câu trả lời...',
}: TypingIndicatorProps) {
  if (!isTyping) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-accent-500 to-neon-cyan flex items-center justify-center">
        <Bot className="w-5 h-5" />
      </div>

      {/* Typing content */}
      <div className="flex-1">
        <div className="text-left mb-1">
          <span className="font-semibold text-sm">Legal AI Assistant</span>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-2xl rounded-bl-sm p-4 max-w-md">
          {/* Typing dots */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                className="w-2 h-2 bg-accent-400 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 bg-accent-400 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 bg-accent-400 rounded-full"
              />
            </div>
            
            <span className="text-sm text-gray-300">{message}</span>
          </div>

          {/* Loading progress */}
          <div className="mt-3 w-full h-1 bg-dark-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-500 to-neon-cyan"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          {/* Subtle animation */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span>Đang xử lý...</span>
            <span className="flex items-center gap-1">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-3 h-3"
              >
                ⚙️
              </motion.div>
              <span>RAG Search</span>
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}