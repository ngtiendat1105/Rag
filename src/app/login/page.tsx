'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthPageLayout from '@/components/auth/AuthPageLayout'
import LoginForm from '@/components/auth/LoginForm'
import OTPVerification from '@/components/auth/OTPVerification'
import { Check, LockKeyhole, MailCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { requestOtp } from '@/services/otp'
import styles from '../public-site.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [showOTP, setShowOTP] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')

  const handleLoginSuccess = async (email: string, password: string) => {
    await requestOtp('send', email, { password })
    setUserEmail(email)
    setUserPassword(password)
    setShowOTP(true)
  }

  const handleOTPBack = () => {
    setShowOTP(false)
  }

  const handleVerifyOTP = async (otp: string) => {
    if (!/^\d{6}$/.test(otp)) {
      throw new Error('OTP phải gồm 6 chữ số')
    }
    const result = await requestOtp('verify', userEmail, { otp })
    useAuthStore.getState().completeLogin(result.user)
    const user = result.user
    router.replace(user?.role === 'admin' ? '/admin' : '/chat')
  }

  const handleResendCode = async () => {
    await requestOtp('send', userEmail, { password: userPassword })
  }

  return (
    <AuthPageLayout titleId="authentication-title">
      <ol className={styles.loginProgress} role="list" aria-label="Các bước đăng nhập" data-step={showOTP ? 'email' : 'account'}>
        <li aria-current={showOTP ? undefined : 'step'} data-complete={showOTP || undefined}>
          {showOTP ? <Check size={16} aria-hidden="true" /> : <LockKeyhole size={15} aria-hidden="true" />} Tài khoản
        </li>
        <li aria-current={showOTP ? 'step' : undefined}><MailCheck size={16} aria-hidden="true" /> Mã xác thực</li>
      </ol>
      <div className={styles.loginStep} key={showOTP ? 'email' : 'account'} data-step={showOTP ? 'email' : 'account'}>
        {!showOTP ? (
          <LoginForm initialEmail={userEmail} onLoginSuccess={handleLoginSuccess} />
        ) : (
          <OTPVerification
            email={userEmail}
            onVerify={handleVerifyOTP}
            onResendCode={handleResendCode}
            onBack={handleOTPBack}
          />
        )}
        {!showOTP && <p className={styles.loginSupport}>Chưa có tài khoản? <Link href="/register">Xem cách đăng ký</Link></p>}
      </div>
    </AuthPageLayout>
  )
}
