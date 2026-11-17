'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { BookOpen, Copy, ExternalLink, FileText, X } from 'lucide-react'
import type { ChatReference } from '@/store/chatStore'
import theme from '@/components/tuan/ui/theme.module.css'
import styles from './sourceInspector.module.css'

// Keep this breakpoint in sync with the source column in workspace.module.css.
const dockedQuery = '(min-width: 1200px)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(dockedQuery)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

const isDocked = () => window.matchMedia(dockedQuery).matches
const isDockedOnServer = () => false

interface Props {
  reference: ChatReference
  previewing: boolean
  onPreview: () => void
  onClose: () => void
}

export default function SourceInspector({ reference, previewing, onPreview, onClose }: Props) {
  const docked = useSyncExternalStore(subscribe, isDocked, isDockedOnServer)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previewRef = useRef<HTMLButtonElement>(null)
  const restorePreviewFocus = useRef(false)
  const titleId = useId()
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  useEffect(() => {
    if (previewing) {
      restorePreviewFocus.current = true
      return
    }
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    if (restorePreviewFocus.current) {
      previewRef.current?.focus()
      restorePreviewFocus.current = false
    } else {
      closeRef.current?.focus()
    }
  }, [docked, previewing])

  function dismiss() {
    dialogRef.current?.close()
    onClose()
  }

  async function copyCitation() {
    const citation = [
      reference.title,
      reference.page ? `Trang ${reference.page}` : '',
      reference.excerpt,
    ].filter(Boolean).join(' — ')
    try {
      await navigator.clipboard.writeText(citation)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  const panel = (
    <div className={styles.panel}>
      <header className={styles.header}>
        <h2 id={titleId}><BookOpen size={17} aria-hidden="true" /> Nguồn tham chiếu</h2>
        <button ref={closeRef} type="button" className={theme.iconButton} aria-label="Đóng nguồn tham chiếu" onClick={dismiss}>
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      <div className={styles.content}>
        <div className={styles.document}>
          <span className={styles.fileIcon}><FileText size={22} aria-hidden="true" /></span>
          <div>
            <h3>{reference.title}</h3>
            {reference.page && <p>Trang {reference.page}</p>}
          </div>
        </div>
        {reference.excerpt && <p className={styles.excerpt}>{reference.excerpt}</p>}
        <div className={styles.actions}>
          <button type="button" className={`${theme.actionButton} ${styles.copyButton}`} onClick={() => void copyCitation()}>
            <Copy size={16} aria-hidden="true" /> Sao chép nguồn
          </button>
          {reference.previewUrl && (
            <button ref={previewRef} type="button" className={theme.primaryButton} onClick={() => {
              dialogRef.current?.close()
              onPreview()
            }}>
              <ExternalLink size={16} aria-hidden="true" /> Xem tài liệu
            </button>
          )}
        </div>
        <div className={styles.feedback} role="status">
          {copyStatus === 'copied' && 'Đã sao chép nguồn.'}
          {copyStatus === 'error' && 'Không thể sao chép nguồn.'}
        </div>
      </div>
    </div>
  )

  if (docked) {
    return (
      <aside className={styles.docked} aria-labelledby={titleId} onKeyDown={event => {
        if (event.key === 'Escape' && !previewing) dismiss()
      }}>
        {panel}
      </aside>
    )
  }

  if (previewing) return null

  return (
    <dialog ref={dialogRef} className={styles.sheet} aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); dismiss() }}
      onClick={event => { if (event.currentTarget === event.target) dismiss() }}>
      {panel}
    </dialog>
  )
}
