'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Database, FileText, Loader2, RefreshCw, Search, Trash2, Upload } from 'lucide-react'
import AdminPageShell from '@/components/admin/AdminPageShell'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface DocumentItem {
  id: string
  name: string
  path: string
  size: number
  contentType: string
  createdAt: string | null
  updatedAt: string | null
}

type UploadStatus = 'queued' | 'uploading' | 'indexing' | 'done' | 'error'
interface UploadItem {
  id: string
  name: string
  size: number
  progress: number
  status: UploadStatus
  error?: string
}

const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
const formatDate = (value: string | null) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa rõ ngày'
const uploadStatusLabel: Record<UploadStatus, string> = {
  queued: 'Đang chờ',
  uploading: 'Đang tải lên',
  indexing: 'Đang lập chỉ mục RAG',
  done: 'Hoàn tất',
  error: 'Tải lên thất bại',
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/documents', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Không thể tải tài liệu.')
      setDocuments(data.documents || [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể tải tài liệu.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadDocuments() }, [loadDocuments])

  const updateUpload = (id: string, patch: Partial<UploadItem>) => {
    setUploads(current => current.map(item => item.id === id ? { ...item, ...patch } : item))
  }

  const uploadSingleFile = (file: File, item: UploadItem) => new Promise<void>((resolve, reject) => {
    const form = new FormData()
    form.append('files', file, file.name)
    const request = new XMLHttpRequest()
    request.open('POST', '/api/documents')
    request.upload.onprogress = event => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        updateUpload(item.id, { status: progress === 100 ? 'indexing' : 'uploading', progress })
      }
    }
    request.onerror = () => reject(new Error('Không thể kết nối máy chủ.'))
    request.onload = () => {
      let data: { documents?: DocumentItem[]; message?: string } = {}
      try { data = JSON.parse(request.responseText) } catch { /* server returned no JSON */ }
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(data.message || 'Không thể tải tài liệu lên.'))
        return
      }
      setDocuments(data.documents || [])
      resolve()
    }
    request.send(form)
  })

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const selectedFiles = Array.from(files)
    const items = selectedFiles.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'queued' as UploadStatus,
    }))
    setUploads(items)
    setError('')
    for (let index = 0; index < selectedFiles.length; index += 1) {
      const file = selectedFiles[index]
      const item = items[index]
      try {
        updateUpload(item.id, { status: 'uploading' })
        await uploadSingleFile(file, item)
        updateUpload(item.id, { status: 'indexing', progress: 100 })
        await loadDocuments()
        updateUpload(item.id, { status: 'done' })
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Không thể tải tài liệu.'
        updateUpload(item.id, { status: 'error', error: message })
        setError(message)
      }
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  const removeDocument = async () => {
    if (!deleteTarget) return
    try {
      const response = await fetch(`/api/documents?path=${encodeURIComponent(deleteTarget.path)}`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể xóa tài liệu.')
      setDocuments(current => current.filter(document => document.path !== deleteTarget.path))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể xóa tài liệu.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const visible = useMemo(() => documents.filter(document => document.name.toLocaleLowerCase('vi-VN').includes(query.toLocaleLowerCase('vi-VN'))), [documents, query])

  return <AdminPageShell>
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="mb-2 flex items-center gap-3"><Database className="h-8 w-8 text-primary-400" /><h1 className="text-3xl font-bold">Knowledge Base</h1></div><p className="text-gray-400">Tài liệu được đọc trực tiếp từ Supabase Storage: legal-documents.</p></div>
      <button onClick={() => inputRef.current?.click()} className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 font-semibold hover:bg-primary-500"><Upload className="h-4 w-4" />Tải tài liệu</button>
      <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.md" className="hidden" onChange={event => void uploadFiles(event.target.files)} />
    </header>
    {uploads.length > 0 && <section className="mb-6 rounded-2xl border border-primary-500/30 bg-primary-500/5 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Tiến trình tải tài liệu</h2><p className="text-sm text-gray-400">File sẽ được lập chỉ mục RAG sau khi tải lên Storage.</p></div><Upload className="h-5 w-5 text-primary-400" /></div>
      <div className="space-y-3">{uploads.map(item => <div key={item.id} className="rounded-xl bg-dark-surface/70 p-3">
        <div className="mb-2 flex items-center gap-3"><FileText className="h-5 w-5 shrink-0 text-accent-400" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span><span className="shrink-0 text-xs text-gray-400">{formatSize(item.size)}</span>{item.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary-400" />}{item.status === 'indexing' && <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />}{item.status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-400" />}{item.status === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}</div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10"><motion.div className={`h-full rounded-full ${item.status === 'error' ? 'bg-red-500' : item.status === 'done' ? 'bg-green-500' : 'bg-primary-500'}`} animate={{ width: `${item.progress}%` }} /></div>
        <div className={`mt-2 text-xs ${item.status === 'error' ? 'text-red-300' : item.status === 'done' ? 'text-green-300' : 'text-gray-400'}`}>{item.status === 'indexing' ? uploadStatusLabel[item.status] : `${uploadStatusLabel[item.status]}${item.status === 'uploading' ? ` · ${item.progress}%` : ''}`}{item.error ? `: ${item.error}` : ''}</div>
      </div>)}</div>
    </section>}
    <section className="glass-effect rounded-2xl p-4 sm:p-6">
      <div className="mb-6 flex gap-3"><label className="relative flex-1"><Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tài liệu trong Storage..." className="glass-effect-light w-full rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary-500" /></label><button onClick={() => void loadDocuments()} className="rounded-xl border border-white/10 px-4 hover:bg-white/10" title="Làm mới"><RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /></button></div>
      {error && <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      {loading && !documents.length ? <p className="py-12 text-center text-gray-400">Đang tải tài liệu từ Supabase Storage...</p> : !visible.length ? <p className="py-12 text-center text-gray-400">Storage chưa có tài liệu phù hợp.</p> : <div className="space-y-3">{visible.map((document, index) => <motion.article key={document.path} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="flex flex-col gap-4 rounded-xl bg-dark-surface/60 p-4 md:flex-row md:items-center"><FileText className="h-8 w-8 shrink-0 text-accent-400" /><div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{document.name}</h2><p className="text-sm text-gray-400">{formatSize(document.size)} · {formatDate(document.updatedAt)}</p></div><span className="w-fit rounded-full bg-green-500/15 px-3 py-1 text-xs text-green-400">Đã lưu Storage</span><button title="Xóa tài liệu" onClick={() => setDeleteTarget(document)} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button></motion.article>)}</div>}
    </section>
    <ConfirmDialog isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={() => void removeDocument()} title="Xóa tài liệu khỏi Storage?" message={deleteTarget ? `“${deleteTarget.name}” sẽ bị xóa khỏi bucket legal-documents.` : ''} confirmLabel="Xóa tài liệu" />
  </AdminPageShell>
}
