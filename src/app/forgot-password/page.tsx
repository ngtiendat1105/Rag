'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock, Mail, RotateCcw, Shield } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SimpleBackground from '@/components/3d/SimpleBackground'

type Step = 'email' | 'otp' | 'password' | 'success'

async function resetRequest(action: 'send' | 'reset', email: string, options: { otp?: string; password?: string } = {}) {
  const response = await fetch('/api/auth/password-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, email, ...options }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Không thể đặt lại mật khẩu.')
  return data
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  return `${local.slice(0, 1)}${'*'.repeat(Math.max(2, local.length - 2))}${local.length > 1 ? local.slice(-1) : ''}@${domain}`
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = window.setTimeout(() => setCountdown(value => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  const sendCode = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Vui lòng nhập email hợp lệ.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await resetRequest('send', email.trim())
      setStep('otp')
      setCountdown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi mã xác thực.')
    } finally {
      setLoading(false)
    }
  }

  const continueToPassword = (event: FormEvent) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(otp)) {
      setError('OTP phải gồm 6 chữ số.')
      return
    }
    setError('')
    setStep('password')
  }

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault()
    if (password.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.')
      return
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await resetRequest('reset', email.trim(), { otp, password })
      setPassword('')
      setConfirmPassword('')
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu.')
    } finally {
      setLoading(false)
    }
  }

  const currentNumber = step === 'email' ? 1 : step === 'otp' ? 2 : 3

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-dark-bg via-dark-bg/90 to-dark-bg p-4 py-10">
      <SimpleBackground />
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-effect relative z-10 w-full max-w-xl overflow-hidden rounded-3xl">
        <div className="bg-gradient-to-r from-primary-800 to-secondary-800 p-6 sm:p-8">
          <div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20"><Shield className="h-6 w-6" /></span><div><h1 className="text-2xl font-bold">Khôi phục mật khẩu</h1><p className="mt-1 text-sm text-gray-200">Xác minh email để bảo vệ tài khoản</p></div></div>
        </div>

        {step !== 'success' && <div className="border-b border-dark-border px-6 py-5">
          <div className="flex items-center gap-3">
            {['Email', 'OTP', 'Mật khẩu mới'].map((label, index) => {
              const number = index + 1
              return <div key={label} className="contents"><div className={`flex items-center gap-2 ${currentNumber >= number ? 'text-primary-300' : 'text-gray-600'}`}><span className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm ${currentNumber >= number ? 'border-primary-500 bg-primary-500/20' : 'border-dark-border'}`}>{number}</span><span className="hidden text-xs font-medium sm:block">{label}</span></div>{number < 3 && <div className={`h-px flex-1 ${currentNumber > number ? 'bg-primary-500' : 'bg-dark-border'}`} />}</div>
            })}
          </div>
        </div>}

        <div className="p-6 sm:p-8">
          {step === 'email' && <form onSubmit={sendCode} className="space-y-6">
            <div className="text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/15 text-primary-300"><Mail className="h-8 w-8" /></span><h2 className="mt-4 text-2xl font-bold">Tìm tài khoản của bạn</h2><p className="mt-2 text-sm leading-6 text-gray-400">Nhập email đã được quản trị viên cấp. Chúng tôi sẽ gửi mã xác thực nếu tài khoản đang hoạt động.</p></div>
            <Input label="Email tài khoản" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="username@company.com" icon={<Mail className="h-5 w-5" />} autoComplete="email" required />
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <Button type="submit" size="lg" loading={loading} className="w-full">Gửi mã xác thực</Button>
          </form>}

          {step === 'otp' && <form onSubmit={continueToPassword} className="space-y-6">
            <div className="text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-500/15 text-accent-300"><KeyRound className="h-8 w-8" /></span><h2 className="mt-4 text-2xl font-bold">Nhập mã xác thực</h2><p className="mt-2 text-sm text-gray-400">Mã gồm 6 chữ số đã được gửi đến <span className="font-medium text-accent-300">{maskEmail(email)}</span></p></div>
            <Input label="Mã OTP" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" icon={<KeyRound className="h-5 w-5" />} className="text-center font-mono text-xl tracking-[0.45em]" autoComplete="one-time-code" required />
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <Button type="submit" size="lg" className="w-full">Tiếp tục</Button>
            <button type="button" disabled={countdown > 0 || loading} onClick={() => sendCode()} className="mx-auto flex items-center gap-2 text-sm text-accent-400 disabled:text-gray-600"><RotateCcw className="h-4 w-4" />{countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}</button>
          </form>}

          {step === 'password' && <form onSubmit={resetPassword} className="space-y-5">
            <div className="text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300"><Lock className="h-8 w-8" /></span><h2 className="mt-4 text-2xl font-bold">Tạo mật khẩu mới</h2><p className="mt-2 text-sm text-gray-400">Sử dụng ít nhất 8 ký tự và tránh dùng lại mật khẩu cũ.</p></div>
            <Input label="Mật khẩu mới" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} icon={<Lock className="h-5 w-5" />} autoComplete="new-password" minLength={8} required rightIcon={<button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>} />
            <Input label="Xác nhận mật khẩu mới" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} icon={<Lock className="h-5 w-5" />} autoComplete="new-password" minLength={8} required />
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <Button type="submit" size="lg" loading={loading} className="w-full">Đặt lại mật khẩu</Button>
            <button type="button" onClick={() => { setStep('otp'); setError('') }} className="w-full text-sm text-gray-400 hover:text-white">Quay lại nhập OTP</button>
          </form>}

          {step === 'success' && <div className="py-4 text-center"><span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300"><CheckCircle2 className="h-10 w-10" /></span><h2 className="mt-5 text-2xl font-bold">Đổi mật khẩu thành công</h2><p className="mt-3 text-sm leading-6 text-gray-400">Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p><Link href="/login" className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 px-6 font-semibold text-white">Quay lại đăng nhập</Link></div>}
        </div>

        {step !== 'success' && <div className="border-t border-dark-border px-6 py-5"><Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"><ArrowLeft className="h-4 w-4" />Quay lại đăng nhập</Link></div>}
      </motion.section>
    </main>
  )
}
