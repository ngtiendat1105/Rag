'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Users, Database, BarChart3 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthHydrated } from '@/hooks/useAuthHydrated'
import AdminSidebar from '@/components/admin/AdminSidebar'
import DashboardStats from '@/components/admin/DashboardStats'

export default function AdminDashboard() {
  const router = useRouter()
  const authHydrated = useAuthHydrated()
  const { user, isAuthenticated } = useAuthStore()

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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Users className="w-6 h-6" />, label: 'Tổng User', value: '1,248', color: 'from-primary-500 to-secondary-500' },
            { icon: <Database className="w-6 h-6" />, label: 'Tài liệu', value: '156', color: 'from-accent-500 to-neon-cyan' },
            { icon: <BarChart3 className="w-6 h-6" />, label: 'Cuộc trò chuyện', value: '8,742', color: 'from-neon-purple to-neon-pink' },
            { icon: <Shield className="w-6 h-6" />, label: 'Active AI Models', value: '3', color: 'from-green-500 to-emerald-500' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="glass-effect rounded-2xl p-6"
            >
              <div className={`w-12 h-12 rounded-xl mb-4 bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Dashboard Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <DashboardStats />
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
            {[
              { service: 'RAG Database', status: 'online', latency: '25ms', color: 'text-green-400' },
              { service: 'AI Model API', status: 'online', latency: '120ms', color: 'text-green-400' },
              { service: 'User Authentication', status: 'online', latency: '15ms', color: 'text-green-400' },
              { service: 'Document Storage', status: 'online', latency: '45ms', color: 'text-green-400' },
              { service: 'Real-time Chat', status: 'online', latency: '85ms', color: 'text-green-400' },
              { service: 'Analytics Engine', status: 'maintenance', latency: 'N/A', color: 'text-yellow-400' },
            ].map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-dark-surface/50">
                <div>
                  <div className="font-medium">{service.service}</div>
                  <div className="text-sm text-gray-400">{service.latency}</div>
                </div>
                <div className={`flex items-center gap-2 ${service.color}`}>
                  <div className={`w-2 h-2 rounded-full ${service.status === 'online' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <span className="text-sm font-medium">
                    {service.status === 'online' ? 'Online' : 'Maintenance'}
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
