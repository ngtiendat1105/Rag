'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Clock, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import AdminPageShell from '@/components/admin/AdminPageShell'

interface Feedback {
  id: string
  rating: 'like' | 'dislike'
  reason: string
  createdAt: string
}

const COLORS = ['#34d399', '#f87171', '#60a5fa', '#fbbf24', '#a78bfa', '#fb923c']
const emptyData = [{ label: 'Chưa có dữ liệu', value: 0 }]

export default function AnalyticsPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/feedback')
      .then(async response => {
        const data = await response.json() as { feedback?: Feedback[]; message?: string }
        if (!response.ok) throw new Error(data.message || 'Không thể tải dữ liệu đánh giá.')
        setFeedback(data.feedback || [])
      })
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Không thể tải dữ liệu đánh giá.'))
      .finally(() => setLoading(false))
  }, [])

  const ratingData = useMemo(() => [
    { name: 'Like', value: feedback.filter(item => item.rating === 'like').length },
    { name: 'Dislike', value: feedback.filter(item => item.rating === 'dislike').length },
  ], [feedback])

  const reasonData = useMemo(() => {
    const counts = new Map<string, number>()
    feedback.forEach(item => counts.set(item.reason, (counts.get(item.reason) || 0) + 1))
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }))
  }, [feedback])

  const trendData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (6 - index))
      return date
    })
    return days.map(date => {
      const day = date.toISOString().slice(0, 10)
      const items = feedback.filter(item => item.createdAt.slice(0, 10) === day)
      return {
        label: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        Like: items.filter(item => item.rating === 'like').length,
        Dislike: items.filter(item => item.rating === 'dislike').length,
      }
    })
  }, [feedback])

  const dailyTotalData = useMemo(() => trendData.map(item => ({
    label: item.label,
    total: item.Like + item.Dislike,
  })), [trendData])

  const hourlyData = useMemo(() => Array.from({ length: 24 }, (_, hour) => ({
    label: `${String(hour).padStart(2, '0')}h`,
    total: feedback.filter(item => new Date(item.createdAt).getHours() === hour).length,
  })), [feedback])

  const likes = ratingData[0].value
  const dislikes = ratingData[1].value
  const satisfaction = likes + dislikes ? Math.round((likes / (likes + dislikes)) * 100) : 0

  const cards = [
    { label: 'Tổng câu hỏi', value: '1.284', icon: <MessageSquare /> },
    { label: 'Phản hồi trung bình', value: '1,8 giây', icon: <Clock /> },
    { label: 'Hài lòng', value: `${satisfaction}%`, icon: <ThumbsUp /> },
    { label: 'Tổng đánh giá', value: `${feedback.length}`, icon: <BarChart3 /> },
  ]

  return <AdminPageShell>
    <header className="mb-8"><div className="mb-2 flex items-center gap-3"><BarChart3 className="h-8 w-8 text-primary-400" /><h1 className="text-3xl font-bold">Analytics</h1></div><p className="text-gray-400">Theo dõi mức độ sử dụng và chất lượng câu trả lời từ đánh giá người dùng.</p></header>
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(item => <div key={item.label} className="glass-effect rounded-2xl p-5"><div className="mb-4 text-primary-400">{item.icon}</div><p className="text-sm text-gray-400">{item.label}</p><p className="mt-1 text-2xl font-bold">{item.value}</p></div>)}</div>
    {error && <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
    <div className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
      <section className="glass-effect rounded-2xl p-5 sm:p-6"><div className="mb-5"><h2 className="text-lg font-bold">Tỷ lệ đánh giá</h2><p className="mt-1 text-sm text-gray-400">So sánh phản hồi tích cực và cần cải thiện.</p></div>{loading ? <div className="flex h-64 items-center justify-center text-sm text-gray-500">Đang tải dữ liệu...</div> : feedback.length === 0 ? <div className="flex h-64 items-center justify-center text-sm text-gray-500">Chưa có dữ liệu đánh giá.</div> : <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={ratingData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={92} paddingAngle={4}>{ratingData.map((item, index) => <Cell key={item.name} fill={index === 0 ? '#34d399' : '#f87171'} />)}</Pie><Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 12, color: '#0f172a' }} labelStyle={{ color: '#0f172a' }} itemStyle={{ color: '#0f172a' }} /><Legend /></PieChart></ResponsiveContainer></div>}</section>
      <section className="glass-effect rounded-2xl p-5 sm:p-6"><div className="mb-5"><h2 className="text-lg font-bold">Xu hướng đánh giá 7 ngày</h2><p className="mt-1 text-sm text-gray-400">Số lượt Like và Dislike theo ngày.</p></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#64748b" /><XAxis dataKey="label" stroke="#e2e8f0" tick={{ fill: '#e2e8f0' }} fontSize={12} /><YAxis allowDecimals={false} stroke="#e2e8f0" tick={{ fill: '#e2e8f0' }} fontSize={12} /><Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 12, color: '#0f172a' }} labelStyle={{ color: '#0f172a' }} itemStyle={{ color: '#0f172a' }} /><Legend wrapperStyle={{ color: '#e2e8f0' }} /><Line type="monotone" dataKey="Like" stroke="#34d399" strokeWidth={3} dot={{ r: 4 }} /><Line type="monotone" dataKey="Dislike" stroke="#f87171" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div></section>
      <section className="glass-effect rounded-2xl p-5 sm:p-6 xl:col-span-2"><div className="mb-5"><h2 className="text-lg font-bold">Lý do đánh giá phổ biến</h2><p className="mt-1 text-sm text-gray-400">Những điểm người dùng thường ghi nhận hoặc yêu cầu cải thiện.</p></div>{loading ? <div className="flex h-64 items-center justify-center text-sm text-gray-500">Đang tải dữ liệu...</div> : reasonData.length === 0 ? <div className="flex h-64 items-center justify-center text-sm text-gray-500">Chưa có dữ liệu lý do.</div> : <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={reasonData.length ? reasonData : emptyData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} /><XAxis type="number" allowDecimals={false} stroke="#9ca3af" fontSize={12} /><YAxis type="category" dataKey="label" width={120} stroke="#d1d5db" fontSize={12} /><Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 12, color: '#0f172a' }} labelStyle={{ color: '#0f172a' }} itemStyle={{ color: '#0f172a' }} /><Bar dataKey="value" name="Số lượt" radius={[0, 6, 6, 0]}>{reasonData.map((item, index) => <Cell key={item.label} fill={COLORS[index % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div>}</section>
      <section className="glass-effect rounded-2xl p-5 sm:p-6"><div className="mb-5"><h2 className="text-lg font-bold">Tổng phản hồi theo ngày</h2><p className="mt-1 text-sm text-gray-400">Tổng số lượt đánh giá trong 7 ngày gần nhất.</p></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={dailyTotalData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#64748b" /><XAxis dataKey="label" stroke="#e2e8f0" tick={{ fill: '#e2e8f0' }} fontSize={12} /><YAxis allowDecimals={false} stroke="#e2e8f0" tick={{ fill: '#e2e8f0' }} fontSize={12} /><Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 12, color: '#0f172a' }} labelStyle={{ color: '#0f172a' }} itemStyle={{ color: '#0f172a' }} /><Bar dataKey="total" name="Tổng phản hồi" fill="#60a5fa" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
      <section className="glass-effect rounded-2xl p-5 sm:p-6"><div className="mb-5"><h2 className="text-lg font-bold">Phân bố theo khung giờ</h2><p className="mt-1 text-sm text-gray-400">Khung giờ phát sinh đánh giá trong dữ liệu hiện có.</p></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#64748b" /><XAxis dataKey="label" interval={2} stroke="#e2e8f0" tick={{ fill: '#e2e8f0' }} fontSize={12} /><YAxis allowDecimals={false} stroke="#e2e8f0" tick={{ fill: '#e2e8f0' }} fontSize={12} /><Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 12, color: '#0f172a' }} labelStyle={{ color: '#0f172a' }} itemStyle={{ color: '#0f172a' }} /><Bar dataKey="total" name="Số lượt đánh giá" fill="#a78bfa" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
    </div>
  </AdminPageShell>
}
