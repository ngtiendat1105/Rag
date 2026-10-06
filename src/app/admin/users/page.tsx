'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import AdminSidebar from '@/components/admin/AdminSidebar'
import UserTable from '@/components/admin/UserTable'

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Check if user is admin
    if (user?.role !== 'admin') {
      router.push('/chat')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== 'admin') {
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
              <span>Active: 24 users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span>Pending: 3 users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span>Inactive: 5 users</span>
            </div>
          </div>
        </motion.div>

        {/* User Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <UserTable />
        </motion.div>

        {/* User Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-2xl p-6 mt-6"
        >
          <h3 className="text-lg font-bold mb-4">Thống kê người dùng</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'New Users This Month', value: '28', change: '+12%', color: 'text-green-400' },
              { label: 'Active Sessions', value: '156', change: '+5%', color: 'text-blue-400' },
              { label: 'Avg. Usage Time', value: '2.4h', change: '+8%', color: 'text-purple-400' },
              { label: 'Support Tickets', value: '12', change: '-3%', color: 'text-yellow-400' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
                <div className={`text-sm ${stat.color}`}>{stat.change}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}