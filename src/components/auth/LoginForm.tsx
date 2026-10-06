'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Building, User } from 'lucide-react'
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
    department: '',
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
    if (!formData.department) newErrors.department = 'Vui lòng chọn phòng ban'

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

  const departments = [
    'Phòng Pháp chế',
    'Phòng Nhân sự',
    'Phòng Kế toán',
    'Phòng Kinh doanh',
    'Ban Giám đốc',
    'IT Department',
  ]

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">
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
        required
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Phòng ban
        </label>
        <select
          value={formData.department}
          onChange={(e) => handleChange('department', e.target.value)}
          className={`
            w-full glass-effect-light rounded-xl px-4 py-3 text-white
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all duration-300 appearance-none
            ${errors.department ? 'border-red-500 focus:ring-red-500' : ''}
          `}
          required
        >
          <option value="" className="bg-dark-surface">
            Chọn phòng ban
          </option>
          {departments.map((dept) => (
            <option key={dept} value={dept} className="bg-dark-surface">
              {dept}
            </option>
          ))}
        </select>
        {errors.department && (
          <p className="text-sm text-red-400">{errors.department}</p>
        )}
      </div>

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
          onClick={() => console.log('Forgot password')}
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
        className="w-full"
        icon={<User className="w-5 h-5" />}
      >
        {loading ? 'Đang xác thực...' : 'Đăng nhập'}
      </Button>

      <div className="text-center pt-6 border-t border-dark-border">
        <p className="text-gray-400 text-sm">
          Hệ thống chỉ dành cho nhân viên công ty. 
          Liên hệ IT Support nếu có vấn đề đăng nhập.
        </p>
      </div>

      {/* Demo credentials */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="glass-effect p-4 rounded-xl text-sm"
      >
        <p className="font-semibold text-gray-300 mb-2">Demo Credentials:</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-400">User:</span>
            <span className="ml-2 break-all text-gray-300">ngtiendatt1105@gmail.com</span>
          </div>
          <div>
            <span className="text-gray-400">Pass:</span>
            <span className="ml-2 text-gray-300">password123</span>
          </div>
          <div>
            <span className="text-gray-400">Admin:</span>
            <span className="ml-2 break-all text-gray-300">ngtiendatt1105@gmail.com</span>
          </div>
          <div>
            <span className="text-gray-400">Pass:</span>
            <span className="ml-2 text-gray-300">admin123</span>
          </div>
        </div>
      </motion.div>
    </motion.form>
  )
}
