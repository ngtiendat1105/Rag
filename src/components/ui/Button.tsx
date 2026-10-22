import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  className?: string
  icon?: ReactNode
}

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon,
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'glass-effect hover:scale-105 bg-gradient-to-r from-primary-500 to-secondary-500 text-white',
    secondary: 'glass-effect-light hover:scale-105 bg-dark-surface text-white',
    ghost: 'bg-transparent border border-dark-border hover:bg-dark-surface text-white',
    danger: 'glass-effect hover:scale-105 bg-gradient-to-r from-red-500 to-pink-500 text-white',
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }
  
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? (
        <div className="spinner w-5 h-5" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </motion.button>
  )
}