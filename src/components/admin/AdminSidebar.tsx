'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  BarChart3,
  Database,
  Shield,
  LogOut,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string
  badge?: number
}

export default function AdminSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [showMobile, setShowMobile] = useState(false)

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/admin' },
    { id: 'users', label: 'Quản lý User', icon: <Users className="w-5 h-5" />, path: '/admin/users', badge: 3 },
    { id: 'documents', label: 'Knowledge Base', icon: <Database className="w-5 h-5" />, path: '/admin/documents', badge: 12 },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, path: '/admin/analytics' },
    { id: 'chatlogs', label: 'Chat Logs', icon: <FileText className="w-5 h-5" />, path: '/admin/chatlogs' },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, path: '/admin/settings' },
  ]

  const handleNavigation = (path: string) => {
    router.push(path)
    setShowMobile(false)
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setShowMobile(!showMobile)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass-effect rounded-xl"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          x: showMobile ? 0 : -320,
          opacity: showMobile ? 1 : 0
        }}
        className={`fixed lg:relative inset-y-0 left-0 z-40 ${collapsed ? 'w-20' : 'w-64'} 
          glass-effect border-r border-dark-border flex flex-col transition-all duration-300`}
      >
        {/* Header */}
        <div className={`p-6 border-b border-dark-border ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {!collapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold">Admin Panel</h2>
                  <p className="text-xs text-gray-400">Legal AI Enterprise</p>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-dark-surface transition-colors"
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronRight className="w-5 h-5 rotate-180" />}
            </button>
          </div>
        </div>

        {/* User Profile */}
        {!collapsed && user && (
          <div className="p-4 border-b border-dark-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-accent-500 to-neon-cyan">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{user.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded-full">
                    {user.role}
                  </span>
                  <span className="text-xs text-gray-400 truncate">{user.department}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-3 rounded-xl
                  transition-all duration-300 ${isActive(item.path) 
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                    : 'hover:bg-dark-surface text-gray-300 hover:text-white'
                  }`}
              >
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                  {item.icon}
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </div>
                
                {!collapsed && item.badge && (
                  <span className="px-2 py-1 text-xs bg-accent-500/20 text-accent-400 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-border">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3 rounded-xl
              hover:bg-red-500/20 hover:text-red-400 transition-all duration-300 text-gray-300`}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="font-medium">Đăng xuất</span>}
          </button>
        </div>
      </motion.div>

      {/* Mobile overlay */}
      {showMobile && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowMobile(false)}
        />
      )}
    </>
  )
}