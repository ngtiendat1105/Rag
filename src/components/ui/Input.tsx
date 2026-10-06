'use client'

import { InputHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerClassName?: string
}

export default function Input({
  label,
  error,
  icon,
  rightIcon,
  className,
  containerClassName,
  ...props
}: InputProps) {
  return (
    <motion.div 
      className={clsx('space-y-2', containerClassName)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          className={clsx(
            'w-full glass-effect-light rounded-xl px-4 py-3 text-white placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-all duration-300',
            icon && 'pl-12',
            rightIcon && 'pr-12',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
        
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-400 mt-1"
          >
            {error}
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}