'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import SimpleBackground from '@/components/3d/SimpleBackground'
import LoginForm from '@/components/auth/LoginForm'
import OTPVerification from '@/components/auth/OTPVerification'
import Button from '@/components/ui/Button'
import { ArrowLeft, Shield } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [showOTP, setShowOTP] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [step, setStep] = useState(1) // 1: Login, 2: OTP

  const handleLoginSuccess = (email: string) => {
    setUserEmail(email)
    setShowOTP(true)
    setStep(2)
  }

  const handleOTPBack = () => {
    setShowOTP(false)
    setStep(1)
  }

  const handleVerifyOTP = async (otp: string) => {
    console.log('Verifying OTP:', otp)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check if user is admin or regular user
    const isAdmin = userEmail.toLowerCase().includes('admin')
    
    // Navigate based on user role
    if (isAdmin) {
      router.push('/admin')
    } else {
      router.push('/chat')
    }
  }

  const handleResendCode = async () => {
    console.log('Resending code to:', userEmail)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-dark-bg via-dark-bg/90 to-dark-bg">
      {/* Animated Canvas Background */}
      <SimpleBackground />
      
      {/* Glassmorphism Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 w-full max-w-2xl mx-4 sm:mx-6"
      >
        <div className="glass-effect rounded-3xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary-800 to-secondary-800 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Legal AI Enterprise
                  </h1>
                  <p className="text-gray-200 text-sm">
                    Hệ thống chatbot pháp lý nội bộ
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/30" />
                <div className="w-2 h-2 rounded-full bg-white/60" />
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="p-6 border-b border-dark-border">
            <div className="flex items-center justify-center gap-8">
              <div className={`flex items-center gap-3 ${step >= 1 ? 'text-primary-400' : 'text-gray-500'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center
                  ${step >= 1 ? 'bg-primary-500/20 border border-primary-500' : 'bg-dark-surface border border-dark-border'}`}>
                  1
                </div>
                <span className="font-medium">Đăng nhập</span>
              </div>
              
              <div className="flex-1 h-1 bg-dark-border" />
              
              <div className={`flex items-center gap-3 ${step >= 2 ? 'text-primary-400' : 'text-gray-500'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center
                  ${step >= 2 ? 'bg-primary-500/20 border border-primary-500' : 'bg-dark-surface border border-dark-border'}`}>
                  2
                </div>
                <span className="font-medium">Xác thực OTP</span>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="p-8">
            {!showOTP ? (
              <LoginForm 
                onLoginSuccess={(email: string) => handleLoginSuccess(email)}
                onShowOTP={(email: string) => handleLoginSuccess(email)}
              />
            ) : (
              <OTPVerification
                email={userEmail}
                onVerify={handleVerifyOTP}
                onResendCode={handleResendCode}
                onBack={handleOTPBack}
              />
            )}
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-dark-border">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Trang chủ
              </Button>
              
              <div className="text-sm text-gray-400">
                Phiên bản 1.0.0 • Bảo mật cấp doanh nghiệp
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-r from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl" />
    </div>
  )
}