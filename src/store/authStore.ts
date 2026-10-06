import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserRole } from '@/utils/constants'
import { readDirectoryUsers } from '@/utils/demoUserDirectory'

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
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const normalizedEmail = email.trim().toLowerCase()
        const isAdmin = normalizedEmail === 'ngtiendatt1105@gmail.com' && password === 'admin123'
        const directoryUser = readDirectoryUsers().find(item => item.email.toLowerCase() === normalizedEmail)
        if (!isAdmin && (!directoryUser || directoryUser.status !== 'active' || password !== 'password123')) {
          set({ isLoading: false })
          throw new Error('Tài khoản chưa được admin cấp, đang bị khóa hoặc mật khẩu không đúng.')
        }
        const demoUser: User = {
          id: isAdmin ? 'admin_default' : directoryUser?.id || 'user_unknown',
          email: normalizedEmail,
          name: isAdmin ? 'Quản trị viên' : directoryUser?.name || 'Người dùng',
          role: isAdmin ? 'admin' : directoryUser?.role || 'user',
          department: isAdmin ? 'IT Department' : directoryUser?.department || 'Chưa phân loại',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        }

        set({
          user: demoUser,
          token: 'demo_jwt_token_123456',
          isAuthenticated: true,
          isLoading: false,
        })
      },

      logout: () => {
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
