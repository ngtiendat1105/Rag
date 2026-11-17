import { ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  tone?: 'dark' | 'light'
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  tone = 'dark',
}: ModalProps) {
  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={clsx(
                'w-full rounded-2xl shadow-2xl',
                tone === 'dark' ? 'glass-effect text-white' : 'bg-white text-slate-900',
                sizes[size]
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className={`flex items-center justify-between p-6 border-b ${tone === 'dark' ? 'border-dark-border' : 'border-slate-200'}`}>
                  {title && (
                    <h3 className={`text-xl font-bold ${tone === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
                  )}
                  
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className={`p-2 rounded-lg transition-colors ${tone === 'dark' ? 'hover:bg-dark-surface' : 'hover:bg-slate-100'}`}
                    >
                      <X className={`w-5 h-5 ${tone === 'dark' ? 'text-gray-400' : 'text-slate-400'}`} />
                    </button>
                  )}
                </div>
              )}
              
              {/* Content */}
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}