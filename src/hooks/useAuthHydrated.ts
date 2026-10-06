'use client'

import { useSyncExternalStore } from 'react'
import { useAuthStore } from '@/store/authStore'

const subscribe = (onChange: () => void) => {
  const unsubscribeStart = useAuthStore.persist.onHydrate(onChange)
  const unsubscribeFinish = useAuthStore.persist.onFinishHydration(onChange)
  return () => {
    unsubscribeStart()
    unsubscribeFinish()
  }
}

export function useAuthHydrated() {
  return useSyncExternalStore(subscribe, () => useAuthStore.persist.hasHydrated(), () => false)
}
