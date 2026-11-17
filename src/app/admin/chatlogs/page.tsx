'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, FileText, Search, ThumbsDown, ThumbsUp } from 'lucide-react'
import AdminPageShell from '@/components/admin/AdminPageShell'

interface Feedback {
  id: string
  userName: string
  rating: 'like' | 'dislike'
  reason: string
  messageContent: string
  createdAt: string
}

const logs = [
  { id: 1, user: 'Nguyễn Văn A', question: 'Thời hạn báo trước khi chấm dứt hợp đồng là bao lâu?', source: 'Bộ luật Lao động 2019', confidence: 94, time: '10:32 hôm nay' },
  { id: 2, user: 'Trần Thị B', question: 'Quy trình phê duyệt hợp đồng trên 500 triệu?', source: 'Chưa tìm thấy nguồn phù hợp', confidence: 38, time: '09:48 hôm nay' },
  { id: 3, user: 'Lê Văn C', question: 'Nhân viên được nghỉ phép bao nhiêu ngày?', source: 'Quy chế nhân sự nội bộ', confidence: 87, time: '08:15 hôm nay' },
]

function FeedbackCard({ item }: { item: Feedback }) {
  const isLike = item.rating === 'like'
  return <article className="rounded-xl bg-dark-surface/60 p-4">
    <div className="flex items-start gap-3">
      <div className={`rounded-lg p-2 ${isLike ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'}`}>
        {isLike ? <ThumbsUp className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">{item.userName}</p>
          <time className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString('vi-VN')}</time>
        </div>
        <p className={`mt-1 text-sm ${isLike ? 'text-green-300' : 'text-red-300'}`}>
          {isLike ? 'Like' : 'Dislike'} · {item.reason}
        </p>
        <p className="mt-2 line-clamp-3 text-sm text-gray-300">{item.messageContent}</p>
      </div>
    </div>
  </article>
}

export default function ChatLogsPage() {
  const [query, setQuery] = useState('')
  const [reviewed, setReviewed] = useState<number[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [feedbackError, setFeedbackError] = useState('')
  const [feedbackTab, setFeedbackTab] = useState<'like' | 'dislike'>('like')

  useEffect(() => {
    fetch('/api/feedback').then(async response => {
      const data = await response.json() as { feedback?: Feedback[]; message?: string }
      if (!response.ok) throw new Error(data.message || 'Không thể tải feedback.')
      setFeedback(data.feedback || [])
    }).catch(error => setFeedbackError(error instanceof Error ? error.message : 'Không thể tải feedback.'))
  }, [])

  const likes = feedback.filter(item => item.rating === 'like')
  const dislikes = feedback.filter(item => item.rating === 'dislike')
  const latest = feedback[0]
  const selectedFeedback = feedbackTab === 'like' ? likes : dislikes
  const visible = logs.filter(log => `${log.user} ${log.question}`.toLowerCase().includes(query.toLowerCase()))

  return <AdminPageShell>
    <header className="mb-8"><div className="mb-2 flex items-center gap-3"><FileText className="h-8 w-8 text-primary-400" /><h1 className="text-3xl font-bold">Giám sát câu trả lời AI</h1></div><p className="text-gray-400">Kiểm tra câu hỏi, nguồn tham chiếu và các câu trả lời có độ tin cậy thấp.</p></header>
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="glass-effect rounded-2xl p-5"><p className="text-sm text-gray-400">Câu hỏi hôm nay</p><p className="mt-2 text-3xl font-bold">128</p></div><div className="glass-effect rounded-2xl p-5"><p className="text-sm text-gray-400">Tin cậy thấp</p><p className="mt-2 text-3xl font-bold text-yellow-300">7</p></div><div className="glass-effect rounded-2xl p-5"><p className="text-sm text-gray-400">Không có nguồn</p><p className="mt-2 text-3xl font-bold text-red-400">3</p></div></div>
    <section className="glass-effect rounded-2xl p-4 sm:p-6">
      <label className="relative mb-6 block"><Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm theo người dùng hoặc câu hỏi..." className="glass-effect-light w-full rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary-500" /></label>
      <div className="mb-8 border-b border-white/10 pb-8">
        <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Đánh giá mới nhất</h2><p className="mt-1 text-sm text-gray-400">Phản hồi gần đây nhất từ người dùng.</p></div>{latest && <time className="text-xs text-gray-500">{new Date(latest.createdAt).toLocaleString('vi-VN')}</time>}</div>
        {feedbackError && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{feedbackError}</p>}
        {!feedbackError && !latest && <p className="rounded-lg bg-white/5 p-4 text-sm text-gray-400">Chưa có phản hồi nào.</p>}
        {latest && <FeedbackCard item={latest} />}
      </div>
      <div className="mb-8 border-b border-white/10 pb-8">
        <div className="mb-5 flex flex-wrap gap-2 rounded-xl bg-dark-surface/60 p-1">
          <button type="button" onClick={() => setFeedbackTab('like')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${feedbackTab === 'like' ? 'bg-green-500/20 text-green-300 shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}><ThumbsUp className="h-4 w-4" />Like<span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs">{likes.length}</span></button>
          <button type="button" onClick={() => setFeedbackTab('dislike')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${feedbackTab === 'dislike' ? 'bg-red-500/20 text-red-300 shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}><ThumbsDown className="h-4 w-4" />Dislike<span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs">{dislikes.length}</span></button>
        </div>
        <div className="space-y-3">{selectedFeedback.length ? selectedFeedback.map(item => <FeedbackCard key={item.id} item={item} />) : <p className="rounded-lg bg-white/5 p-4 text-sm text-gray-400">Chưa có đánh giá {feedbackTab === 'like' ? 'Like' : 'Dislike'}.</p>}</div>
      </div>
      <div className="space-y-4">{visible.map(log => <article key={log.id} className="rounded-xl bg-dark-surface/60 p-5"><div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm text-gray-400">{log.user} · {log.time}</p><h2 className="mt-1 font-semibold">{log.question}</h2></div><span className={`w-fit rounded-full px-3 py-1 text-xs ${log.confidence >= 70 ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-300'}`}>{log.confidence}% tin cậy</span></div><p className="mb-4 text-sm text-gray-300">Nguồn: <span className="text-accent-300">{log.source}</span></p><button onClick={() => setReviewed(current => current.includes(log.id) ? current.filter(id => id !== log.id) : [...current, log.id])} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">{reviewed.includes(log.id) ? <CheckCircle className="h-4 w-4 text-green-400" /> : <AlertTriangle className="h-4 w-4 text-yellow-300" />}{reviewed.includes(log.id) ? 'Đã kiểm tra' : 'Đánh dấu đã kiểm tra'}</button></article>)}</div>
    </section>
  </AdminPageShell>
}
