import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserRole } from '@/utils/constants'

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  department: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
  clearAuth: () => void
  completeLogin: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        
        set({ isLoading: false })
        throw new Error('Hãy đăng nhập qua trang OTP để tạo phiên Supabase.')
      },

      logout: () => {
        void fetch('/api/auth/logout', { method: 'POST' })
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      setUser: (user: User) => {
        set({ user })
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true })
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      completeLogin: (user: User) => {
        set({ user: { ...user, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}` }, token: 'http-only-session', isAuthenticated: true, isLoading: false })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
