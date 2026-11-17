'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import theme from './theme.module.css'
import styles from './chatDialog.module.css'

interface ChatDialogProps {
  title: string
  description?: string
  icon: ReactNode
  closeLabel: string
  onClose: () => void
  className?: string
  children: (dismiss: () => void) => ReactNode
}

export default function ChatDialog({ title, description, icon, closeLabel, onClose, className, children }: ChatDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = `${titleId}-description`

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  function dismiss() {
    const dialog = dialogRef.current
    if (!dialog?.open) return
    dialog.close()
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className={className ? `${styles.dialog} ${className}` : styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={event => { event.preventDefault(); dismiss() }}
      onClick={event => { if (event.target === event.currentTarget) dismiss() }}
    >
      <header className={styles.header}>
        <span className={styles.headerIcon} aria-hidden="true">{icon}</span>
        <div>
          <h2 id={titleId}>{title}</h2>
          {description && <p id={descriptionId}>{description}</p>}
        </div>
        <button type="button" className={theme.iconButton} onClick={dismiss} aria-label={closeLabel}>
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      {children(dismiss)}
    </dialog>
  )
}
