'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react'
import theme from '@/components/tuan/ui/theme.module.css'
import styles from './auth-form.module.css'

interface LoginFormProps {
  initialEmail: string
  onLoginSuccess: (email: string, password: string) => Promise<void>
}

export default function LoginForm({ initialEmail, onLoginSuccess }: LoginFormProps) {
  const emailInput = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialEmail) emailInput.current?.focus()
  }, [initialEmail])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
      await onLoginSuccess(email.trim(), password)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể gửi mã OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={submit} aria-labelledby="authentication-title">
      <div className={styles.heading}>
        <h1 id="authentication-title">Đăng nhập</h1>
        <p>Dùng email công ty để vào không gian tra cứu.</p>
      </div>
      <div className={styles.field}>
        <label htmlFor="login-email">Email công ty</label>
        <div className={styles.control}>
          <Mail size={18} aria-hidden="true" />
          <input ref={emailInput} id="login-email" type="email" autoComplete="username" placeholder="ten@congty.vn" value={email}
            onChange={event => { setEmail(event.target.value); setError('') }} disabled={loading} required />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="login-password">Mật khẩu</label>
        <div className={styles.control}>
          <LockKeyhole size={18} aria-hidden="true" />
          <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password}
            onChange={event => { setPassword(event.target.value); setError('') }} disabled={loading} required />
          <button type="button" className={theme.iconButton} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <Link href="/forgot-password" className={styles.forgot}>Quên mật khẩu?</Link>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" className={`${theme.primaryButton} ${styles.submit}`} disabled={loading} aria-busy={loading}>
        {loading ? <><Loader2 className={styles.spinner} size={18} aria-hidden="true" /> Đang gửi mã…</>
          : <>Đăng nhập <span className={styles.submitGlyph}><ArrowRight size={17} aria-hidden="true" /></span></>}
      </button>
    </form>
  )
}
