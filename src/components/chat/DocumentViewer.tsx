'use client'

import { useEffect } from 'react'
import { ExternalLink, X } from 'lucide-react'
import type { ChatReference } from '@/store/chatStore'

interface Props {
  reference: ChatReference | null
  onClose: () => void
}

export default function DocumentViewer({ reference, onClose }: Props) {
  useEffect(() => {
    if (!reference) return
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [reference, onClose])

  if (!reference) return null
  const viewerUrl = reference.previewUrl
    ? `${reference.previewUrl}${reference.page ? `#page=${reference.page}` : ''}`
    : ''

  return <div className="fixed inset-0 z-[90] flex items-stretch bg-slate-950/60 p-3 backdrop-blur-sm md:p-6" role="dialog" aria-modal="true" aria-label="Xem tài liệu nguồn">
    <div className="flex min-w-0 flex-1 overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="hidden w-[min(34%,28rem)] shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 p-5 md:block">
        <div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#a7793d]">Nguồn tham khảo</p><h2 className="mt-1 break-words text-base font-semibold text-slate-900">{reference.title}</h2></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700" aria-label="Đóng trình xem"><X className="h-5 w-5" /></button></div>
        {reference.page && <p className="text-xs text-slate-500">Trang {reference.page} sẽ được mở trong trình xem.</p>}
        <p className="mt-4 text-sm leading-6 text-slate-700">{reference.excerpt || 'Chưa có đoạn trích chi tiết cho nguồn này.'}</p>
        {!reference.previewUrl && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">File gốc chưa được liên kết hoặc không phải PDF. Hãy kiểm tra tài liệu trong kho quản trị.</p>}
      </div>
      <div className="relative min-w-0 flex-1 bg-slate-100">
        <div className="absolute right-3 top-3 z-10 flex gap-2"><button onClick={onClose} className="rounded-lg bg-white p-2 text-slate-500 shadow hover:text-slate-900 md:hidden" aria-label="Đóng trình xem"><X className="h-5 w-5" /></button>{reference.previewUrl && <a href={viewerUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-white p-2 text-slate-500 shadow hover:text-[#173f73]" aria-label="Mở tài liệu trong tab mới"><ExternalLink className="h-5 w-5" /></a>}</div>
        {reference.previewUrl ? <iframe title={reference.title} src={viewerUrl} className="h-full w-full" /> : <div className="flex h-full items-center justify-center p-8 text-center text-sm text-slate-500">Không có bản PDF để hiển thị.</div>}
      </div>
    </div>
  </div>
}
