'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle, Info, X } from 'lucide-react'

type ToastTone = 'success' | 'info'
interface ToastItem { id: number; message: string; tone: ToastTone }
interface ToastContextValue { showToast: (message: string, tone?: ToastTone) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(current => [...current, { id, message, tone }])
    window.setTimeout(() => setToasts(current => current.filter(item => item.id !== id)), 2800)
  }, [])
  const value = useMemo(() => ({ showToast }), [showToast])

  return <ToastContext.Provider value={value}>
    {children}
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {toasts.map(toast => <div key={toast.id} className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-xl">
        {toast.tone === 'success' ? <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" /> : <Info className="h-4 w-4 shrink-0 text-[#173f73]" />}
        <span className="min-w-0 flex-1">{toast.message}</span>
        <button type="button" onClick={() => setToasts(current => current.filter(item => item.id !== toast.id))} aria-label="Đóng thông báo"><X className="h-4 w-4 text-slate-400" /></button>
      </div>)}
    </div>
  </ToastContext.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast phải được sử dụng bên trong ToastProvider.')
  return context
}
