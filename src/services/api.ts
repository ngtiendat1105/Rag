import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { API_ENDPOINTS } from '@/utils/constants'

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    
    // Handle other errors
    const errorMessage = (error.response?.data as any)?.message || error.message
    console.error('API Error:', errorMessage)
    
    return Promise.reject(error)
  }
)

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}

export interface ChatRequest {
  message: string
  context?: any
  model?: string
  temperature?: number
}

export interface ChatResponse {
  id: string
  message: string
  role: 'assistant' | 'user'
  timestamp: string
  references: string[]
  confidence: number
}

export interface Document {
  id: string
  title: string
  type: 'pdf' | 'docx' | 'txt' | 'other'
  size: number
  uploadedAt: string
  status: 'processed' | 'processing' | 'error'
  tags: string[]
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'moderator'
  department: string
  status: 'active' | 'inactive' | 'pending'
  lastActive: string
}

// API functions
export const chatService = {
  // Send message to RAG system
  sendMessage: async (data: ChatRequest): Promise<ApiResponse<ChatResponse>> => {
    const response = await api.post(API_ENDPOINTS.CHAT, data)
    return response.data
  },

  // Get chat history
  getChatHistory: async (page = 1, limit = 20): Promise<ApiResponse<ChatResponse[]>> => {
    const response = await api.get(API_ENDPOINTS.CHAT_HISTORY, {
      params: { page, limit },
    })
    return response.data
  },

  // RAG search
  searchDocuments: async (query: string): Promise<ApiResponse<any[]>> => {
    const response = await api.post(API_ENDPOINTS.RAG_SEARCH, { query })
    return response.data
  },
}

export const authService = {
  // Login with email and password
  login: async (email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await api.post(API_ENDPOINTS.AUTH_LOGIN, { email, password })
    const { token, user } = response.data.data
    
    // Store token in localStorage
    if (token) {
      localStorage.setItem('auth_token', token)
    }
    
    return response.data
  },

  // Verify OTP
  verifyOTP: async (email: string, otp: string): Promise<ApiResponse<{ verified: boolean }>> => {
    const response = await api.post(API_ENDPOINTS.AUTH_VERIFY, { email, otp })
    return response.data
  },

  // Logout
  logout: async (): Promise<ApiResponse> => {
    localStorage.removeItem('auth_token')
    const response = await api.post(API_ENDPOINTS.AUTH_LOGOUT)
    return response.data
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/api/auth/me')
    return response.data
  },
}

export const documentService = {
  // Upload document
  uploadDocument: async (file: File): Promise<ApiResponse<Document>> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post(API_ENDPOINTS.UPLOAD_DOCUMENT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Get all documents
  getDocuments: async (): Promise<ApiResponse<Document[]>> => {
    const response = await api.get('/api/documents')
    return response.data
  },

  // Delete document
  deleteDocument: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/documents/${id}`)
    return response.data
  },
}

export const adminService = {
  // Get statistics
  getStatistics: async (): Promise<ApiResponse<any>> => {
    const response = await api.get(API_ENDPOINTS.STATISTICS)
    return response.data
  },

  // Get all users
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get(API_ENDPOINTS.USERS)
    return response.data
  },

  // Update user
  updateUser: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put(`${API_ENDPOINTS.USERS}/${id}`, data)
    return response.data
  },

  // Delete user
  deleteUser: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`${API_ENDPOINTS.USERS}/${id}`)
    return response.data
  },
}

// Mock API functions for development
export const mockApi = {
  chat: {
    sendMessage: async (data: ChatRequest): Promise<ApiResponse<ChatResponse>> => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        success: true,
        data: {
          id: `msg_${Date.now()}`,
          message: `Đây là phản hồi mô phỏng cho: "${data.message}". Tôi đã phân tích câu hỏi và tìm thấy các tài liệu pháp lý liên quan.`,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          references: ['Điều 15 Bộ luật Lao động', 'Nghị định 145/2020/NĐ-CP'],
          confidence: 0.85,
        },
        message: 'Tin nhắn được xử lý thành công',
        timestamp: new Date().toISOString(),
      }
    },
  },
}

export default api