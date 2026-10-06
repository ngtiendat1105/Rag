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
        
        // Demo user data
        const demoUser: User = {
          id: 'user_123',
          email: email,
          name: email.includes('admin') ? 'Quản trị viên' : 'Nguyễn Văn A',
          role: email.includes('admin') ? 'admin' : 'user',
          department: email.includes('admin') ? 'IT Department' : 'Phòng Pháp chế',
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