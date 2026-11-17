'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

interface LoginFormProps {
  onLoginSuccess?: (email: string, password: string) => void | Promise<void>
  onShowOTP?: (email: string, password: string) => void | Promise<void>
}

export default function LoginForm({ onLoginSuccess, onShowOTP }: LoginFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    // Validate
    const newErrors: Record<string, string> = {}
    if (!formData.email) newErrors.email = 'Vui lòng nhập email'
    if (!formData.password) newErrors.password = 'Vui lòng nhập mật khẩu'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    try {
      if (onShowOTP) {
        await onShowOTP(formData.email, formData.password)
      } else if (onLoginSuccess) {
        await onLoginSuccess(formData.email, formData.password)
      }
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Không thể gửi mã OTP.' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="mb-2 text-3xl font-bold text-primary-300">
          Đăng nhập hệ thống
        </h2>
        <p className="text-gray-300">
          Vui lòng nhập thông tin tài khoản của bạn
        </p>
      </div>

      <Input
        label="Email công ty"
        type="email"
        placeholder="username@company.com"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        error={errors.email}
        icon={<Mail className="w-5 h-5" />}
        className="border border-dark-border bg-dark-surface text-gray-100"
        required
      />

      <Input
        label="Mật khẩu"
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        value={formData.password}
        onChange={(e) => handleChange('password', e.target.value)}
        error={errors.password}
        icon={<Lock className="w-5 h-5" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        }
        className="border border-dark-border bg-dark-surface text-gray-100"
        required
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-dark-border bg-dark-surface text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-300">Ghi nhớ đăng nhập</span>
        </label>
        
        <button
          type="button"
          className="text-sm text-accent-400 hover:text-accent-300 transition-colors"
          onClick={() => router.push('/forgot-password')}
        >
          Quên mật khẩu?
        </button>
      </div>

      {errors.submit && <p role="alert" className="text-sm text-red-400">{errors.submit}</p>}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        className="w-full !bg-primary-500 !text-white shadow-lg shadow-primary-500/20 hover:!bg-primary-600"
        icon={<User className="w-5 h-5" />}
      >
        {loading ? 'Đang xác thực...' : 'Đăng nhập'}
      </Button>

      <div className="mt-6 border-t border-dark-border pt-8 text-center">
        <p className="text-gray-400 text-sm">
          Hệ thống chỉ dành cho nhân viên công ty. 
          Liên hệ IT Support nếu có vấn đề đăng nhập.
        </p>
      </div>

    </motion.form>
  )
}
