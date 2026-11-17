'use client'

import { Moon, Sun } from 'lucide-react'
import theme from './theme.module.css'
import styles from './themeSwitch.module.css'

interface ThemeSwitchProps {
  dark: boolean
  onToggle: () => void
  compact?: boolean
}

export default function ThemeSwitch({ dark, onToggle, compact = false }: ThemeSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      className={`${theme.actionButton} ${styles.switch} ${compact ? styles.compact : ''}`}
      onClick={onToggle}
    >
      <span className={compact ? 'sr-only' : undefined}>Giao diện tối</span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob}>
          <Sun className={styles.sun} size={13} />
          <Moon className={styles.moon} size={12} />
        </span>
      </span>
    </button>
  )
}
