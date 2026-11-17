'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Activity, CheckCircle2, Clock3, UserPlus, Users } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthHydrated } from '@/hooks/useAuthHydrated'
import AdminSidebar from '@/components/admin/AdminSidebar'
import UserTable from '@/components/admin/UserTable'
import type { AppUser } from '@/lib/supabaseUsers'

const ONLINE_WINDOW_MS = 5 * 60 * 1000

function isOnline(user: AppUser, now: number) {
  if (user.status !== 'active' || !user.lastActive) return false
  const lastActive = Date.parse(user.lastActive)
  return Number.isFinite(lastActive) && now - lastActive >= 0 && now - lastActive <= ONLINE_WINDOW_MS
}

export default function AdminUsersPage() {
  const router = useRouter()
  const authHydrated = useAuthHydrated()
  const { user, isAuthenticated } = useAuthStore()
  const [users, setUsers] = useState<AppUser[]>([])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const userStats = useMemo(() => ({
    total: users.length,
    online: users.filter(item => isOnline(item, now)).length,
    pending: users.filter(item => item.status === 'pending').length,
    inactive: users.filter(item => item.status === 'inactive').length,
    active: users.filter(item => item.status === 'active').length,
    newThisMonth: users.filter(item => {
      if (!item.createdAt) return false
      const createdAt = Date.parse(item.createdAt)
      return Number.isFinite(createdAt) && now - createdAt >= 0 && now - createdAt <= 30 * 24 * 60 * 60 * 1000
    }).length,
  }), [users, now])

  const activeRate = userStats.total ? Math.round((userStats.active / userStats.total) * 100) : 0
  const statusRows = [
    { label: 'Đang hoạt động', value: userStats.active, color: 'bg-emerald-400', text: 'text-emerald-300' },
    { label: 'Đang trực tuyến', value: userStats.online, color: 'bg-sky-400', text: 'text-sky-300' },
    { label: 'Chờ duyệt', value: userStats.pending, color: 'bg-amber-400', text: 'text-amber-300' },
    { label: 'Không hoạt động', value: userStats.inactive, color: 'bg-slate-400', text: 'text-slate-300' },
  ]
  const departmentRows = useMemo(() => {
    const counts = users.reduce<Record<string, number>>((result, item) => {
      const department = item.department || 'Chưa phân loại'
      result[department] = (result[department] || 0) + 1
      return result
    }, {})
    return Object.entries(counts).sort(([, first], [, second]) => second - first).slice(0, 5)
  }, [users])

  useEffect(() => {
    if (!authHydrated) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Check if user is admin
    if (user?.role !== 'admin') {
      router.push('/chat')
    }
  }, [authHydrated, isAuthenticated, user, router])

  if (!authHydrated || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4" />
          <p>Đang xác thực quyền truy cập...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-dark-bg">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 
              flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold mb-2">Quản lý người dùng</h1>
              <p className="text-gray-400">
                Quản lý và giám sát tất cả người dùng trong hệ thống Legal AI Enterprise
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span title="Tài khoản active có heartbeat trong 5 phút gần nhất">
                Online: {userStats.online} users
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span>Pending: {userStats.pending} users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span>Inactive: {userStats.inactive} users</span>
            </div>
          </div>
        </motion.div>

        {/* User Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <UserTable onUsersChange={setUsers} />
        </motion.div>

        {/* User Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-2xl p-5 md:p-6 mt-6"
        >
          <div className="flex flex-col gap-1 mb-5">
            <h3 className="text-lg font-bold">Thống kê người dùng</h3>
            <p className="text-sm text-gray-400">Tổng hợp trực tiếp từ danh sách tài khoản hiện tại.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Tổng người dùng', value: userStats.total, icon: Users, tone: 'text-primary-300', bg: 'bg-primary-500/10' },
              { label: 'Đang trực tuyến', value: userStats.online, icon: Activity, tone: 'text-sky-300', bg: 'bg-sky-500/10', hint: 'Trong 5 phút gần nhất' },
              { label: 'User mới 30 ngày', value: userStats.newThisMonth, icon: UserPlus, tone: 'text-violet-300', bg: 'bg-violet-500/10' },
              { label: 'Tỷ lệ tài khoản active', value: `${activeRate}%`, icon: CheckCircle2, tone: 'text-emerald-300', bg: 'bg-emerald-500/10' },
            ].map(stat => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`rounded-lg p-2 ${stat.bg} ${stat.tone}`}><Icon className="h-5 w-5" /></div>
                    {stat.label === 'Đang trực tuyến' && <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />}
                  </div>
                  <div className="mt-4 text-2xl font-bold text-white">{stat.value}</div>
                  <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
                  {stat.hint && <div className="mt-2 text-xs text-gray-500">{stat.hint}</div>}
                </div>
              )
            })}
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Phân bố trạng thái</h4>
                <Clock3 className="h-4 w-4 text-gray-500" />
              </div>
              <div className="space-y-4">
                {statusRows.map(row => {
                  const percentage = userStats.total ? Math.round((row.value / userStats.total) * 100) : 0
                  return (
                    <div key={row.label}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="text-gray-300">{row.label}</span>
                        <span className={`font-semibold ${row.text}`}>{row.value} <span className="text-xs text-gray-500">({percentage}%)</span></span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full rounded-full ${row.color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Theo phòng ban</h4>
                <span className="text-xs text-gray-500">Top 5</span>
              </div>
              {departmentRows.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500">Chưa có dữ liệu phòng ban.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-white/5">
                  {departmentRows.map(([department, count], index) => (
                    <div key={department} className={`flex items-center justify-between gap-4 px-3 py-3 text-sm ${index > 0 ? 'border-t border-white/5' : ''}`}>
                      <span className="truncate text-gray-300">{department}</span>
                      <span className="shrink-0 rounded-full bg-primary-500/15 px-2.5 py-1 font-semibold text-primary-200">{count} user</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
