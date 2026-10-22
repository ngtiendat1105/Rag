'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

interface LoginCredentials {
  email: string
  password: string
  department?: string
}

interface OTPCredentials {
  email: string
  otp: string
}

export function useAuth() {
  const router = useRouter()
  const { user, token, isAuthenticated, login: storeLogin, logout: storeLogout } = useAuthStore()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Login with email and password
   */
  const login = async (credentials: LoginCredentials) => {
    setLoading(true)
    setError(null)

    try {
      // For demo purposes, use mock login
      await storeLogin(credentials.email, credentials.password)
      
      // In real implementation:
      // const response = await authService.login(credentials.email, credentials.password)
      // storeLogin(response.data.user)
      
      const redirectPath = useAuthStore.getState().user?.role === 'admin' ? '/admin' : '/chat'
      router.push(redirectPath)
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại')
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Verify OTP
   */
  const verifyOTP = async (credentials: OTPCredentials) => {
    setLoading(true)
    setError(null)

    try {
      // For demo purposes, auto verify
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In real implementation:
      // const response = await authService.verifyOTP(credentials.email, credentials.otp)
      
      // Mock login to set user data based on email
      await storeLogin(credentials.email, 'demo-password')
      
      const redirectPath = useAuthStore.getState().user?.role === 'admin' ? '/admin' : '/chat'
      router.push(redirectPath)
    } catch (err: any) {
      setError(err.message || 'Xác thực OTP thất bại')
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Logout
   */
  const logout = async () => {
    setLoading(true)
    
    try {
      await authService.logout()
      storeLogout()
      router.push('/login')
    } catch (err: any) {
      console.error('Logout error:', err)
      storeLogout()
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get current user session
   */
  const getCurrentUser = async () => {
    if (!token) return null

    try {
      // In real implementation:
      // const response = await authService.getCurrentUser()
      // return response.data
      
      return user
    } catch (err) {
      console.error('Get current user error:', err)
      return null
    }
  }

  /**
   * Check if user has required role
   */
  const hasRole = (requiredRole: string): boolean => {
    if (!user) return false
    return user.role === requiredRole
  }

  /**
   * Check if user has permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    
    // Define role permissions
    const rolePermissions: Record<string, string[]> = {
      admin: ['manage_users', 'manage_documents', 'view_analytics', 'system_settings'],
      moderator: ['manage_documents', 'view_analytics'],
      user: ['view_documents', 'chat'],
    }

    const userPermissions = rolePermissions[user.role] || []
    return userPermissions.includes(permission)
  }

  /**
   * Require authentication
   */
  const requireAuth = (redirectTo = '/login') => {
    useEffect(() => {
      if (!isAuthenticated) {
        router.push(redirectTo)
      }
    }, [isAuthenticated, router, redirectTo])
  }

  /**
   * Require specific role
   */
  const requireRole = (requiredRole: string, redirectTo = '/chat') => {
    useEffect(() => {
      if (!isAuthenticated || !hasRole(requiredRole)) {
        router.push(redirectTo)
      }
    }, [isAuthenticated, user, router, redirectTo, requiredRole])
  }

  return {
    // State
    user,
    token,
    isAuthenticated,
    loading,
    error,
    
    // Actions
    login,
    verifyOTP,
    logout,
    getCurrentUser,
    
    // Permissions
    hasRole,
    hasPermission,
    
    // Guards
    requireAuth,
    requireRole,
    
    // Utilities
    clearError: () => setError(null),
  }
}
