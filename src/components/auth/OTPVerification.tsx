'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Key, Mail, RotateCcw, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

interface OTPVerificationProps {
  email: string
  onVerify: (otp: string) => Promise<void>
  onResendCode: () => Promise<void>
  onBack?: () => void
}

export default function OTPVerification({
  email,
  onVerify,
  onResendCode,
  onBack,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [error, setError] = useState('')
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [activeInput, setActiveInput] = useState(0)

  // Focus first input on mount
  useEffect(() => {
    const firstInput = document.getElementById('otp-input-0')
    if (firstInput) {
      (firstInput as HTMLInputElement).focus()
    }
  }, [])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return

    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Paste handling
      const pastedValue = value.slice(0, 6)
      const newOtp = [...otp]
      
      for (let i = 0; i < pastedValue.length; i++) {
        if (index + i < 6) {
          newOtp[index + i] = pastedValue[i]
        }
      }
      
      setOtp(newOtp)
      
      // Focus next input
      const nextIndex = Math.min(index + pastedValue.length, 5)
      const nextInput = document.getElementById(`otp-input-${nextIndex}`)
      if (nextInput) {
        (nextInput as HTMLInputElement).focus()
      }
      return
    }

    // Single digit input
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`)
      if (nextInput) {
        (nextInput as HTMLInputElement).focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      const prevInput = document.getElementById(`otp-input-${index - 1}`)
      if (prevInput) {
        (prevInput as HTMLInputElement).focus()
      }
    }
  }

  const handleVerify = async () => {
    const otpString = otp.join('')
    
    if (otpString.length !== 6) {
      setError('Vui lòng nhập đủ 6 số OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onVerify(otpString)
      setVerificationComplete(true)
      
      // Show success for 2 seconds then continue
      setTimeout(() => {
        setVerificationComplete(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mã OTP không chính xác. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (countdown > 0) return

    setResendLoading(true)
    try {
      await onResendCode()
      setCountdown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi lại mã. Vui lòng thử lại sau.')
    } finally {
      setResendLoading(false)
    }
  }

  const maskEmail = (email: string) => {
    const [localPart, domain] = email.split('@')
    if (!localPart || !domain) return email
    
    const maskedLocal = localPart.charAt(0) + '*'.repeat(Math.max(1, localPart.length - 2)) + (localPart.length > 1 ? localPart.charAt(localPart.length - 1) : '')
    return `${maskedLocal}@${domain}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-500 to-neon-cyan flex items-center justify-center">
          <Key className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-3xl font-bold gradient-text mb-2">
          Xác thực 2 bước
        </h2>
        
        <p className="text-gray-300 mb-1">
          Chúng tôi đã gửi mã xác thực đến
        </p>
        <div className="flex items-center justify-center gap-2 text-accent-400 font-medium">
          <Mail className="w-4 h-4" />
          {maskEmail(email)}
        </div>
      </div>

      {/* OTP Input */}
      <div className="space-y-4">
        <p className="text-center text-gray-300 text-sm">
          Nhập mã 6 số bạn nhận được
        </p>
        
        <div className="flex justify-center gap-2 sm:gap-3">
          {otp.map((digit, index) => (
            <motion.input
              key={index}
              id={`otp-input-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 sm:w-14 sm:h-14 glass-effect text-center text-xl sm:text-2xl font-bold rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       transition-all duration-300"
              whileFocus={{ scale: 1.1 }}
            />
          ))}
        </div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-red-400 text-sm"
        >
          {error}
        </motion.p>
      )}

      {/* Resend Code */}
      <div className="text-center">
        <button
          onClick={handleResendCode}
          disabled={countdown > 0 || resendLoading}
          className={`
            text-sm flex items-center justify-center gap-2 mx-auto
            ${countdown > 0 || resendLoading ? 'text-gray-500' : 'text-accent-400 hover:text-accent-300'}
            transition-colors
          `}
        >
          <RotateCcw className="w-4 h-4" />
          {resendLoading ? 'Đang gửi lại...' : countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4 pt-4">
        <Button
          onClick={handleVerify}
          loading={loading}
          variant="primary"
          size="lg"
          className="w-full"
          disabled={verificationComplete}
        >
          {verificationComplete ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Xác thực thành công!
            </>
          ) : (
            'Xác thực'
          )}
        </Button>

        {onBack && (
          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full"
            disabled={loading}
          >
            Quay lại đăng nhập
          </Button>
        )}
      </div>

      {/* Security Note */}
      <div className="glass-effect p-4 rounded-xl mt-6">
        <p className="text-sm text-gray-300 text-center">
          🔒 Mã OTP có hiệu lực trong 5 phút. 
          Không chia sẻ mã này với bất kỳ ai.
        </p>
      </div>
    </motion.div>
  )
}
