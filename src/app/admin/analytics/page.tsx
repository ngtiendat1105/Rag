import { BarChart3, Clock, MessageSquare, ThumbsUp } from 'lucide-react'
import AdminPageShell from '@/components/admin/AdminPageShell'

export default function AnalyticsPage() {
  const days = [{ day: 'T2', value: 62 }, { day: 'T3', value: 78 }, { day: 'T4', value: 55 }, { day: 'T5', value: 91 }, { day: 'T6', value: 82 }, { day: 'T7', value: 48 }, { day: 'CN', value: 36 }]
  return <AdminPageShell><header className="mb-8"><div className="mb-2 flex items-center gap-3"><BarChart3 className="h-8 w-8 text-primary-400" /><h1 className="text-3xl font-bold">Analytics</h1></div><p className="text-gray-400">Hiệu quả sử dụng Legal AI trong 7 ngày gần nhất.</p></header>
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: 'Tổng câu hỏi', value: '1.284', icon: <MessageSquare /> }, { label: 'Phản hồi trung bình', value: '1,8 giây', icon: <Clock /> }, { label: 'Hài lòng', value: '91%', icon: <ThumbsUp /> }, { label: 'Có nguồn trích dẫn', value: '96%', icon: <BarChart3 /> },
    ].map(item => <div key={item.label} className="glass-effect rounded-2xl p-5"><div className="mb-4 text-primary-400">{item.icon}</div><p className="text-sm text-gray-400">{item.label}</p><p className="mt-1 text-2xl font-bold">{item.value}</p></div>)}</div>
    <section className="glass-effect rounded-2xl p-6"><h2 className="mb-1 text-lg font-bold">Lượng câu hỏi theo ngày</h2><p className="mb-8 text-sm text-gray-400">Mức cao nhất được chuẩn hóa thành 100%</p><div className="flex h-64 items-end gap-3">{days.map(item => <div key={item.day} className="flex h-full flex-1 flex-col justify-end gap-2"><div className="rounded-t-lg bg-gradient-to-t from-primary-600 to-accent-400" style={{ height: `${item.value}%` }} /><span className="text-center text-xs text-gray-400">{item.day}</span></div>)}</div></section>
  </AdminPageShell>
}
