'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, CheckCircle2, XCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthHydrated } from '@/hooks/useAuthHydrated'
import AdminSidebar from '@/components/admin/AdminSidebar'
import DashboardStats, { DashboardData } from '@/components/admin/DashboardStats'
import { useState } from 'react'

export default function AdminDashboard() {
  const router = useRouter()
  const authHydrated = useAuthHydrated()
  const { user, isAuthenticated } = useAuthStore()
  const [dashboardData, setDashboardData] = useState<DashboardData | undefined>()
  const [ragOnline, setRagOnline] = useState<boolean | null>(null)

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
  useEffect(() => {
    if (authHydrated && isAuthenticated && user?.role === 'admin') {
      fetch('/api/admin/dashboard', { cache: 'no-store' }).then(response => response.ok ? response.json() : Promise.reject()).then(setDashboardData).catch(() => setDashboardData(undefined))
      fetch('/api/health', { cache: 'no-store' }).then(response => setRagOnline(response.ok)).catch(() => setRagOnline(false))
    }
  }, [authHydrated, isAuthenticated, user])

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
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">
                Chào mừng trở lại, <span className="text-primary-400 font-medium">{user?.name}</span>. 
                Đây là tổng quan hệ thống của bạn.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 glass-effect rounded-xl">
                <div className="text-sm text-gray-400">Vai trò</div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary-400" />
                  <span className="font-medium">Administrator</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Dashboard Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <DashboardStats data={dashboardData} />
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-effect rounded-2xl p-6 mt-6"
        >
          <h3 className="text-lg font-bold mb-4">Trạng thái hệ thống</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{ service: 'RAG API', status: ragOnline }, { service: 'Supabase', status: dashboardData !== undefined }, { service: 'Dữ liệu dashboard', status: dashboardData !== undefined }].map((service) => (
              <div key={service.service} className="flex items-center justify-between gap-4 rounded-xl bg-dark-surface/50 p-4">
                <div>
                  <div className="text-sm font-medium">{service.service}</div>
                  <div className="text-sm text-gray-400">{service.status === null ? 'Đang kiểm tra...' : service.status ? 'Đã kết nối' : 'Không khả dụng'}</div>
                </div>
                <div className={`flex items-center gap-2 ${service.status ? 'text-green-400' : service.status === null ? 'text-yellow-400' : 'text-red-400'}`}>
                  {service.status ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <span className="text-sm font-medium whitespace-nowrap">
                    {service.status === null ? 'Đang kiểm tra' : service.status ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
