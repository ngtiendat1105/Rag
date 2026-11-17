'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (reason: string, detail: string) => Promise<void>
}

const reasons = ['Sai luật', 'Trích dẫn sai', 'Tối nghĩa']

export default function DislikeFeedbackModal({ open, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  if (!open) return null

  const submit = async () => {
    if (!reason) { setError('Vui lòng chọn một lý do.'); return }
    setSubmitting(true); setError('')
    try { await onSubmit(reason, detail.trim()); setReason(''); setDetail(''); onClose() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể gửi phản hồi.') }
    finally { setSubmitting(false) }
  }

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="dislike-title">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4"><div><h2 id="dislike-title" className="text-base font-semibold text-slate-900">Cải thiện câu trả lời</h2><p className="mt-1 text-sm text-slate-500">Phản hồi này được dùng để đánh giá chất lượng RAG.</p></div><button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng biểu mẫu"><X className="h-5 w-5" /></button></div>
      <fieldset className="mt-5 space-y-3"><legend className="mb-2 text-sm font-medium text-slate-700">Lý do không hài lòng</legend>{reasons.map(item => <label key={item} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"><input type="radio" name="dislike-reason" value={item} checked={reason === item} onChange={() => setReason(item)} className="h-4 w-4 accent-[#173f73]" />{item}</label>)}</fieldset>
      <label className="mt-4 block text-sm font-medium text-slate-700">Chi tiết phản hồi <span className="font-normal text-slate-400">(không bắt buộc)</span><textarea value={detail} onChange={event => setDetail(event.target.value)} maxLength={2000} rows={4} placeholder="Mô tả điểm cần sửa..." className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#173f73]/50 focus:ring-4 focus:ring-[#173f73]/10" /></label>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Hủy</button><button onClick={() => void submit()} disabled={submitting} className="rounded-xl bg-[#173f73] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12345f] disabled:opacity-50">{submitting ? 'Đang gửi...' : 'Gửi phản hồi'}</button></div>
    </div>
  </div>
}
