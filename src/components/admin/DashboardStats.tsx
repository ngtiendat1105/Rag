'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, BarChart3, Clock, FileText, MessageSquare, TrendingUp, Users } from 'lucide-react'

export interface DashboardData {
  totals: { users: number; documents: number; chats: number; activeModels: number; responseTimeMs: number | null }
  changes: { users: number | null; chats: number | null; documents: number | null; responseTime: number | null }
  chart: Array<{ label: string; users: number; chats: number }>
  popularQuestions: Array<{ question: string; count: number }>
  recentQuestions: Array<{ question: string; createdAt: string }>
}

const emptyData: DashboardData = {
  totals: { users: 0, documents: 0, chats: 0, activeModels: 0, responseTimeMs: null },
  changes: { users: null, chats: null, documents: null, responseTime: null },
  chart: [],
  popularQuestions: [],
  recentQuestions: [],
}

const formatNumber = (value: number) => new Intl.NumberFormat('vi-VN').format(value)
const formatChange = (value: number | null) => value === null ? 'Chưa đủ dữ liệu' : `${value > 0 ? '+' : ''}${value}%`
const timeAgo = (value: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  return minutes < 1 ? 'Vừa xong' : minutes < 60 ? `${minutes} phút trước` : `${Math.round(minutes / 60)} giờ trước`
}

export default function DashboardStats({ data: initialData }: { data?: DashboardData }) {
  const [data, setData] = useState(initialData || emptyData)
  const [loading, setLoading] = useState(!initialData)

  useEffect(() => {
    if (initialData) return
    fetch('/api/admin/dashboard', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('dashboard request failed')))
      .then(setData)
      .catch(() => setData(emptyData))
      .finally(() => setLoading(false))
  }, [initialData])

  const stats = [
    { title: 'Tổng User', value: formatNumber(data.totals.users), change: data.changes.users, icon: <Users className="w-6 h-6" />, color: 'from-primary-500 to-secondary-500' },
    { title: 'Cuộc trò chuyện', value: formatNumber(data.totals.chats), change: data.changes.chats, icon: <MessageSquare className="w-6 h-6" />, color: 'from-accent-500 to-neon-cyan' },
    { title: 'Tài liệu', value: formatNumber(data.totals.documents), change: data.changes.documents, icon: <FileText className="w-6 h-6" />, color: 'from-neon-purple to-neon-pink' },
    { title: 'Thời gian phản hồi', value: data.totals.responseTimeMs === null ? 'Chưa đo' : `${data.totals.responseTimeMs}ms`, change: data.changes.responseTime, icon: <Clock className="w-6 h-6" />, color: 'from-green-500 to-emerald-500' },
  ]
  const maxChart = Math.max(1, ...data.chart.flatMap(item => [item.users, item.chats]))

  return <div className="space-y-6">
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="glass-effect rounded-2xl p-6">
        <div className="mb-4 flex items-start justify-between"><div><p className="mb-1 text-sm text-gray-400">{stat.title}</p><h3 className="text-2xl font-bold">{loading ? '...' : stat.value}</h3></div><div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color}`}>{stat.icon}</div></div>
        <div className="flex items-center gap-2 text-sm"><span className={stat.change !== null && stat.change < 0 ? 'text-red-400' : stat.change === null ? 'text-gray-500' : 'text-green-400'}>{stat.change !== null && (stat.change >= 0 ? <ArrowUpRight className="inline h-4 w-4" /> : <ArrowDownRight className="inline h-4 w-4" />)} {formatChange(stat.change)}</span><span className="text-gray-400">so với tháng trước</span></div>
      </motion.div>)}
    </div>

    <div className="glass-effect rounded-2xl p-6">
      <div className="mb-6"><h3 className="text-lg font-bold">Tăng trưởng sử dụng</h3><p className="text-sm text-gray-400">Dữ liệu đăng ký và câu hỏi thực tế theo tháng</p></div>
      {data.chart.length === 0 ? <p className="py-12 text-center text-gray-500">Chưa có dữ liệu theo tháng.</p> : <div className="flex h-64 items-end justify-between gap-2">{data.chart.map(item => <div key={item.label} className="flex flex-1 flex-col items-center"><div className="mb-2 flex h-52 items-end justify-center gap-1"><div className="w-3 rounded-t-lg bg-primary-500" style={{ height: `${Math.max(3, item.users / maxChart * 100)}%` }} /><div className="w-3 rounded-t-lg bg-accent-500" style={{ height: `${Math.max(3, item.chats / maxChart * 100)}%` }} /></div><span className="text-xs text-gray-400">{item.label}</span></div>)}</div>}
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass-effect rounded-2xl p-6"><div className="mb-6 flex items-center justify-between"><div><h3 className="text-lg font-bold">Hoạt động gần đây</h3><p className="text-sm text-gray-400">Các câu hỏi mới nhất từ người dùng</p></div><BarChart3 className="h-5 w-5 text-gray-400" /></div><div className="space-y-3">{data.recentQuestions.length === 0 ? <p className="py-8 text-center text-gray-500">Chưa có hoạt động.</p> : data.recentQuestions.map((item, index) => <div key={`${item.createdAt}-${index}`} className="rounded-lg bg-dark-surface/50 p-3"><p className="line-clamp-2 text-sm">{item.question}</p><p className="mt-1 text-xs text-gray-400">{timeAgo(item.createdAt)}</p></div>)}</div></div>
      <div className="glass-effect rounded-2xl p-6"><div className="mb-6 flex items-center justify-between"><div><h3 className="text-lg font-bold">Top câu hỏi</h3><p className="text-sm text-gray-400">Tổng hợp từ dữ liệu truy vấn thật</p></div><MessageSquare className="h-5 w-5 text-gray-400" /></div><div className="space-y-3">{data.popularQuestions.length === 0 ? <p className="py-8 text-center text-gray-500">Chưa có dữ liệu câu hỏi.</p> : data.popularQuestions.map((item, index) => <div key={item.question} className="flex items-center gap-3 rounded-lg p-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/20 font-bold">{index + 1}</span><p className="min-w-0 flex-1 truncate text-sm">{item.question}</p><span className="shrink-0 text-xs text-gray-400">{item.count} lượt</span></div>)}</div></div>
    </div>
    <div className="rounded-xl border border-dark-border bg-dark-surface/70 p-5"><div className="flex items-center gap-2 text-sm text-gray-400"><TrendingUp className="h-4 w-4" /> Chỉ số được lấy từ dữ liệu hệ thống; thời gian phản hồi chỉ hiển thị khi backend có ghi nhận latency.</div></div>
  </div>
}
