'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

const HEARTBEAT_INTERVAL_MS = 60_000

export default function PresenceHeartbeat() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) return

    const sendHeartbeat = () => {
      void fetch('/api/auth/heartbeat', { method: 'POST', keepalive: true })
    }

    sendHeartbeat()
    const timer = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [isAuthenticated])

  return null
}
