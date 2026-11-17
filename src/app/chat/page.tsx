'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ChatWorkspace from '@/components/tuan/workspace/ChatWorkspace'
import { useAuthHydrated } from '@/hooks/useAuthHydrated'
import { useAuthStore } from '@/store/authStore'

export default function ChatPage() {
  const router = useRouter()
  const authHydrated = useAuthHydrated()
  const { user, logout, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (authHydrated && !isAuthenticated) router.replace('/login')
  }, [authHydrated, isAuthenticated, router])

  if (!authHydrated || !isAuthenticated || !user) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#f6f5f1] p-4 text-sm text-[#344254]">
        <p role="status">Đang xác thực phiên đăng nhập…</p>
      </main>
    )
  }

  return <ChatWorkspace user={user} onLogout={() => { logout(); router.push('/login') }} />
}
