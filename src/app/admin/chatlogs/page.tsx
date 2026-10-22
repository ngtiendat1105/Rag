'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, FileText, Search } from 'lucide-react'
import AdminPageShell from '@/components/admin/AdminPageShell'

const logs = [
  { id: 1, user: 'Nguyễn Văn A', question: 'Thời hạn báo trước khi chấm dứt hợp đồng là bao lâu?', source: 'Bộ luật Lao động 2019', confidence: 94, time: '10:32 hôm nay' },
  { id: 2, user: 'Trần Thị B', question: 'Quy trình phê duyệt hợp đồng trên 500 triệu?', source: 'Chưa tìm thấy nguồn phù hợp', confidence: 38, time: '09:48 hôm nay' },
  { id: 3, user: 'Lê Văn C', question: 'Nhân viên được nghỉ phép bao nhiêu ngày?', source: 'Quy chế nhân sự nội bộ', confidence: 87, time: '08:15 hôm nay' },
]

export default function ChatLogsPage() {
  const [query, setQuery] = useState('')
  const [reviewed, setReviewed] = useState<number[]>([])
  const visible = logs.filter(log => `${log.user} ${log.question}`.toLowerCase().includes(query.toLowerCase()))
  return <AdminPageShell>
    <header className="mb-8"><div className="mb-2 flex items-center gap-3"><FileText className="h-8 w-8 text-primary-400" /><h1 className="text-3xl font-bold">Giám sát câu trả lời AI</h1></div><p className="text-gray-400">Kiểm tra câu hỏi, nguồn tham chiếu và các câu trả lời có độ tin cậy thấp.</p></header>
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="glass-effect rounded-2xl p-5"><p className="text-sm text-gray-400">Câu hỏi hôm nay</p><p className="mt-2 text-3xl font-bold">128</p></div><div className="glass-effect rounded-2xl p-5"><p className="text-sm text-gray-400">Tin cậy thấp</p><p className="mt-2 text-3xl font-bold text-yellow-300">7</p></div><div className="glass-effect rounded-2xl p-5"><p className="text-sm text-gray-400">Không có nguồn</p><p className="mt-2 text-3xl font-bold text-red-400">3</p></div></div>
    <section className="glass-effect rounded-2xl p-4 sm:p-6"><label className="relative mb-6 block"><Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm theo người dùng hoặc câu hỏi..." className="glass-effect-light w-full rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary-500" /></label>
      <div className="space-y-4">{visible.map(log => <article key={log.id} className="rounded-xl bg-dark-surface/60 p-5"><div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm text-gray-400">{log.user} · {log.time}</p><h2 className="mt-1 font-semibold">{log.question}</h2></div><span className={`w-fit rounded-full px-3 py-1 text-xs ${log.confidence >= 70 ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-300'}`}>{log.confidence}% tin cậy</span></div><p className="mb-4 text-sm text-gray-300">Nguồn: <span className="text-accent-300">{log.source}</span></p><button onClick={() => setReviewed(current => current.includes(log.id) ? current.filter(id => id !== log.id) : [...current, log.id])} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">{reviewed.includes(log.id) ? <CheckCircle className="h-4 w-4 text-green-400" /> : <AlertTriangle className="h-4 w-4 text-yellow-300" />}{reviewed.includes(log.id) ? 'Đã kiểm tra' : 'Đánh dấu đã kiểm tra'}</button></article>)}</div>
    </section>
  </AdminPageShell>
}
