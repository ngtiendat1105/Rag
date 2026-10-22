'use client'

import { KeyboardEvent, useRef, useState } from 'react'
import { ArrowUp, FileText, Paperclip, ShieldCheck, X } from 'lucide-react'
import type { ChatAttachment } from '@/store/chatStore'

interface Props { onSendMessage: (message: string, attachments?: ChatAttachment[]) => void | Promise<void>; placeholder?: string; disabled?: boolean; isLoading?: boolean; allowAttachments?: boolean; onAttachmentClick?: () => void }

export default function ChatInput({ onSendMessage, placeholder = 'Nhập câu hỏi về pháp lý...', disabled = false, isLoading = false, allowAttachments = true, onAttachmentClick }: Props) {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const suggestions = ['Quy định nghỉ phép năm', 'Thời gian thử việc tối đa', 'Chế độ bảo hiểm xã hội']

  const submit = async () => {
    const value = message.trim()
    if (!value || disabled || isLoading || isSubmitting) return
    setError(''); setIsSubmitting(true)
    try { await onSendMessage(value, attachments); setMessage(''); setAttachments([]); if (textareaRef.current) textareaRef.current.style.height = 'auto' }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể gửi câu hỏi. Vui lòng thử lại.'); textareaRef.current?.focus() }
    finally { setIsSubmitting(false) }
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit() } }
  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    const selected = Array.from(files)
    if (selected.some(file => !allowed.includes(file.type) || file.size > 10 * 1024 * 1024)) { setError('Chỉ hỗ trợ PDF, Word, TXT tối đa 10 MB mỗi tệp.'); return }
    setError(''); setAttachments(current => [...current, ...selected.map(file => ({ id: `${file.name}-${file.lastModified}-${file.size}`, name: file.name, size: file.size, type: file.type }))].slice(0, 5))
  }

  return <div>
    <div className="mb-3 flex gap-2 overflow-x-auto pb-1">{suggestions.map(item => <button key={item} onClick={() => { setMessage(item); textareaRef.current?.focus() }} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#173f73]/30 hover:bg-[#f3f7fb] hover:text-[#173f73]">{item}</button>)}</div>
    <div className="rounded-2xl border border-slate-300 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition focus-within:border-[#173f73]/50 focus-within:ring-4 focus-within:ring-[#173f73]/5">
      {attachments.length > 0 && <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3">{attachments.map(file => <span key={file.id} className="flex max-w-full items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600"><FileText className="h-3.5 w-3.5" /><span className="max-w-40 truncate">{file.name}</span><button onClick={() => setAttachments(current => current.filter(item => item.id !== file.id))} aria-label={`Bỏ tệp ${file.name}`}><X className="h-3.5 w-3.5" /></button></span>)}</div>}
      <textarea ref={textareaRef} value={message} maxLength={2000} rows={1} disabled={disabled || isLoading || isSubmitting} placeholder={placeholder} onKeyDown={handleKeyDown} onChange={event => { setMessage(event.target.value); setError(''); event.target.style.height = 'auto'; event.target.style.height = `${Math.min(event.target.scrollHeight, 140)}px` }} className="min-h-[64px] max-h-[140px] w-full resize-none bg-transparent px-4 pb-2 pt-4 text-[15px] leading-6 text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50" />
      {error && <p role="alert" className="mx-4 mb-2 text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex items-center gap-2"><button onClick={() => onAttachmentClick ? onAttachmentClick() : fileInputRef.current?.click()} disabled={!allowAttachments || disabled} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40" title="Đính kèm tài liệu"><Paperclip className="h-5 w-5" /></button><input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={event => handleFiles(event.target.files)} /><span className="hidden text-xs text-slate-400 sm:inline">PDF, Word hoặc TXT · tối đa 10 MB</span></div>
        <div className="flex items-center gap-3"><span className="text-[11px] text-slate-400">{message.length}/2000</span><button onClick={submit} disabled={!message.trim() || disabled || isSubmitting} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#173f73] text-white shadow-sm transition hover:bg-[#12345f] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400" aria-label="Gửi câu hỏi"><ArrowUp className="h-5 w-5" /></button></div>
      </div>
    </div>
    <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400"><ShieldCheck className="h-3.5 w-3.5" />Câu trả lời có thể cần được chuyên viên pháp lý kiểm tra lại</p>
  </div>
}
