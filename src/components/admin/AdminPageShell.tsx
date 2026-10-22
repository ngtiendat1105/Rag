'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useAuthHydrated } from '@/hooks/useAuthHydrated'
import AdminSidebar from './AdminSidebar'

export default function AdminPageShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const hydrated = useAuthHydrated()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) router.replace('/login')
    else if (user?.role !== 'admin') router.replace('/chat')
  }, [hydrated, isAuthenticated, user, router])

  if (!hydrated || !isAuthenticated || user?.role !== 'admin') {
    return <div className="flex min-h-screen items-center justify-center"><div className="text-center"><div className="spinner mx-auto mb-4 h-12 w-12" /><p>Đang xác thực quyền truy cập...</p></div></div>
  }

  return <div className="flex min-h-screen bg-dark-bg"><AdminSidebar /><main className="min-w-0 flex-1 overflow-y-auto p-4 pt-20 md:p-6 lg:pt-6">{children}</main></div>
}
