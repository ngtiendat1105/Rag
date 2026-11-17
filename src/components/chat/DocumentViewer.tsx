'use client'

import { useEffect, useRef } from 'react'
import { ExternalLink, X } from 'lucide-react'
import type { ChatReference } from '@/store/chatStore'

interface Props {
  reference: ChatReference | null
  onClose: () => void
}

export default function DocumentViewer({ reference, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (reference && dialog && !dialog.open) dialog.showModal()
  }, [reference])

  if (!reference) return null
  const viewerUrl = reference.previewUrl
    ? `${reference.previewUrl}${reference.page ? `#page=${reference.page}` : ''}`
    : ''

  function dismiss() {
    dialogRef.current?.close()
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-0 h-[100dvh] w-full max-h-none max-w-none bg-transparent p-3 text-[var(--ui-text)] backdrop:bg-slate-950/60 md:p-6"
      aria-label="Xem tài liệu nguồn"
      onCancel={event => { event.preventDefault(); dismiss() }}
      onClick={event => { if (event.currentTarget === event.target) dismiss() }}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-[var(--ui-surface)] shadow-2xl">
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-[var(--ui-line)] px-3 md:px-5">
          <h2 className="min-w-0 truncate text-sm font-semibold" title={reference.title}>{reference.title}</h2>
          <div className="flex flex-none gap-1">
            {reference.previewUrl && (
              <a href={viewerUrl} target="_blank" rel="noreferrer" className="grid size-11 place-items-center rounded-lg hover:bg-[var(--ui-hover)]" aria-label="Mở tài liệu trong tab mới">
                <ExternalLink size={18} aria-hidden="true" />
              </a>
            )}
            <button type="button" onClick={dismiss} className="grid size-11 place-items-center rounded-lg hover:bg-[var(--ui-hover)]" aria-label="Đóng trình xem">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          {reference.excerpt && (
            <div className="hidden w-[min(34%,28rem)] shrink-0 overflow-y-auto border-r border-[var(--ui-line)] bg-[var(--ui-sidebar)] p-5 md:block">
              {reference.page && <p className="mb-2 text-xs font-semibold">Trang {reference.page}</p>}
              <p className="whitespace-pre-wrap break-words text-sm leading-6">{reference.excerpt}</p>
            </div>
          )}
          <div className="min-w-0 flex-1 bg-[var(--ui-subtle)]">
            {reference.previewUrl
              ? <iframe title={reference.title} src={viewerUrl} className="h-full w-full" />
              : <p className="grid h-full place-items-center p-8 text-center text-sm text-[var(--ui-muted)]">Không có bản PDF để hiển thị.</p>}
          </div>
        </div>
      </div>
    </dialog>
  )
}
