'use client'

import { useMemo, useRef, useState } from 'react'
import { Database, FileText, RefreshCw, Search, Upload, Trash2 } from 'lucide-react'
import AdminPageShell from '@/components/admin/AdminPageShell'

const initialDocs = [
  { id: 1, name: 'Bộ luật Lao động 2019.pdf', department: 'Pháp chế', size: '3.2 MB', status: 'ready', updated: '06/10/2026' },
  { id: 2, name: 'Quy chế nhân sự nội bộ.docx', department: 'Nhân sự', size: '1.4 MB', status: 'processing', updated: '06/10/2026' },
  { id: 3, name: 'Mẫu hợp đồng dịch vụ.pdf', department: 'Kinh doanh', size: '860 KB', status: 'error', updated: '05/10/2026' },
  { id: 4, name: 'Quy trình bảo mật dữ liệu.pdf', department: 'IT', size: '2.1 MB', status: 'ready', updated: '02/10/2026' },
]

const statusLabel: Record<string, string> = { ready: 'Đã lập chỉ mục', processing: 'Đang xử lý', error: 'Có lỗi' }
const statusColor: Record<string, string> = { ready: 'bg-green-500/15 text-green-400', processing: 'bg-yellow-500/15 text-yellow-300', error: 'bg-red-500/15 text-red-400' }

export default function DocumentsPage() {
  const [docs, setDocs] = useState(initialDocs)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const inputRef = useRef<HTMLInputElement>(null)
  const visible = useMemo(() => docs.filter(doc => (filter === 'all' || doc.status === filter) && doc.name.toLowerCase().includes(query.toLowerCase())), [docs, query, filter])

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const additions = Array.from(files).map((file, index) => ({ id: Date.now() + index, name: file.name, department: 'Chưa phân loại', size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, status: 'processing', updated: new Date().toLocaleDateString('vi-VN') }))
    setDocs(current => [...additions, ...current])
    if (inputRef.current) inputRef.current.value = ''
  }

  return <AdminPageShell>
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="mb-2 flex items-center gap-3"><Database className="h-8 w-8 text-primary-400" /><h1 className="text-3xl font-bold">Knowledge Base</h1></div><p className="text-gray-400">Quản lý tài liệu và trạng thái lập chỉ mục RAG.</p></div>
      <button onClick={() => inputRef.current?.click()} className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 font-semibold hover:bg-primary-500"><Upload className="h-4 w-4" />Tải tài liệu</button>
      <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" onChange={event => addFiles(event.target.files)} />
    </header>
    <section className="glass-effect rounded-2xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <label className="relative flex-1"><Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm tài liệu..." className="glass-effect-light w-full rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary-500" /></label>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="glass-effect-light rounded-xl px-4 py-3 outline-none"><option className="bg-dark-surface" value="all">Tất cả trạng thái</option><option className="bg-dark-surface" value="ready">Đã lập chỉ mục</option><option className="bg-dark-surface" value="processing">Đang xử lý</option><option className="bg-dark-surface" value="error">Có lỗi</option></select>
      </div>
      <div className="space-y-3">{visible.map(doc => <article key={doc.id} className="flex flex-col gap-4 rounded-xl bg-dark-surface/60 p-4 md:flex-row md:items-center">
        <FileText className="h-8 w-8 shrink-0 text-accent-400" /><div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{doc.name}</h2><p className="text-sm text-gray-400">{doc.department} · {doc.size} · {doc.updated}</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs ${statusColor[doc.status]}`}>{statusLabel[doc.status]}</span>
        <div className="flex gap-2"><button title="Lập chỉ mục lại" onClick={() => setDocs(current => current.map(item => item.id === doc.id ? { ...item, status: 'processing' } : item))} className="rounded-lg p-2 hover:bg-white/10"><RefreshCw className="h-4 w-4" /></button><button title="Xóa tài liệu" onClick={() => setDocs(current => current.filter(item => item.id !== doc.id))} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button></div>
      </article>)}</div>
      {!visible.length && <p className="py-10 text-center text-gray-400">Không tìm thấy tài liệu phù hợp.</p>}
    </section>
  </AdminPageShell>
}
