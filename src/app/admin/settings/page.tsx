'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Settings } from 'lucide-react'
import AdminPageShell from '@/components/admin/AdminPageShell'

export default function SettingsPage() {
  const [topK, setTopK] = useState(5)
  const [temperature, setTemperature] = useState(0.2)
  const [citations, setCitations] = useState(true)
  const [saved, setSaved] = useState(false)
  useEffect(() => { const value = localStorage.getItem('rag-settings'); if (value) { const config = JSON.parse(value); setTopK(config.topK ?? 5); setTemperature(config.temperature ?? 0.2); setCitations(config.citations ?? true) } }, [])
  const save = () => { localStorage.setItem('rag-settings', JSON.stringify({ topK, temperature, citations })); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  return <AdminPageShell><header className="mb-8"><div className="mb-2 flex items-center gap-3"><Settings className="h-8 w-8 text-primary-400" /><h1 className="text-3xl font-bold">Cấu hình RAG</h1></div><p className="text-gray-400">Điều chỉnh cách hệ thống tìm tài liệu và tạo câu trả lời.</p></header>
    <section className="glass-effect max-w-3xl space-y-8 rounded-2xl p-6"><label className="block"><span className="mb-2 block font-medium">Mô hình AI</span><select className="glass-effect-light w-full rounded-xl px-4 py-3"><option className="bg-dark-surface">Mô hình mặc định</option><option className="bg-dark-surface">Mô hình tiết kiệm</option></select></label>
      <label className="block"><span className="mb-2 flex justify-between font-medium"><span>Số đoạn tài liệu truy xuất</span><strong>{topK}</strong></span><input className="w-full accent-blue-500" type="range" min="1" max="10" value={topK} onChange={e => setTopK(Number(e.target.value))} /><span className="text-sm text-gray-400">Số lớn hơn cung cấp nhiều ngữ cảnh nhưng có thể làm câu trả lời dài hơn.</span></label>
      <label className="block"><span className="mb-2 flex justify-between font-medium"><span>Temperature</span><strong>{temperature.toFixed(1)}</strong></span><input className="w-full accent-blue-500" type="range" min="0" max="1" step="0.1" value={temperature} onChange={e => setTemperature(Number(e.target.value))} /><span className="text-sm text-gray-400">Giá trị thấp phù hợp với câu trả lời pháp lý cần tính nhất quán.</span></label>
      <label className="flex items-center justify-between gap-4 rounded-xl bg-dark-surface/60 p-4"><span><strong className="block">Bắt buộc trích dẫn nguồn</strong><span className="text-sm text-gray-400">Hiển thị tài liệu tham chiếu trong câu trả lời.</span></span><input type="checkbox" checked={citations} onChange={e => setCitations(e.target.checked)} className="h-5 w-5 accent-blue-500" /></label>
      <button onClick={save} className="flex min-h-[44px] items-center gap-2 rounded-xl bg-primary-600 px-5 font-semibold hover:bg-primary-500">{saved && <CheckCircle className="h-4 w-4" />}{saved ? 'Đã lưu cấu hình' : 'Lưu cấu hình'}</button>
    </section>
  </AdminPageShell>
}
