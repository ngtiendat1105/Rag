'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Check, Loader2, Mail, RotateCcw } from 'lucide-react'
import theme from '@/components/tuan/ui/theme.module.css'
import styles from './auth-form.module.css'

interface OTPVerificationProps {
  email: string
  onVerify: (otp: string) => Promise<void>
  onResendCode: () => Promise<void>
  onBack: () => void
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  if (!name || !domain) return email
  return `${name[0]}${'*'.repeat(Math.max(1, name.length - 2))}${name.length > 1 ? name.slice(-1) : ''}@${domain}`
}

export default function OTPVerification({ email, onVerify, onResendCode, onBack }: OTPVerificationProps) {
  const input = useRef<HTMLInputElement>(null)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)

  useEffect(() => { input.current?.focus() }, [])

  useEffect(() => {
    if (countdown === 0) return
    const timer = setTimeout(() => setCountdown(value => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading || resending || complete) return
    if (!/^\d{6}$/.test(otp)) {
      setError('Vui lòng nhập đủ 6 số OTP.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onVerify(otp)
      setComplete(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể xác thực mã OTP.')
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    if (countdown > 0 || resending || loading || complete) return
    setResending(true)
    setError('')
    try {
      await onResendCode()
      setCountdown(60)
      setOtp('')
      input.current?.focus()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể gửi lại mã.')
    } finally {
      setResending(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={verify} aria-labelledby="authentication-title">
      <div className={styles.heading}>
        <h1 id="authentication-title">Xác thực email</h1>
        <p>Mã 6 số đã được gửi đến <strong>{maskEmail(email)}</strong>.</p>
      </div>
      <div className={styles.field}>
        <label htmlFor="login-otp">Mã xác thực</label>
        <div className={styles.control}>
          <Mail size={18} aria-hidden="true" />
          <input ref={input} id="login-otp" className={styles.otp} inputMode="numeric" autoComplete="one-time-code"
            value={otp} onChange={event => { setOtp(event.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
            aria-describedby="otp-validity" placeholder="000000" disabled={loading || complete} />
        </div>
        <p id="otp-validity" className={styles.hint}>Mã có hiệu lực trong 5 phút.</p>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" className={`${theme.primaryButton} ${styles.submit}`} disabled={loading || resending || complete} aria-busy={loading}>
        {loading ? <><Loader2 className={styles.spinner} size={18} aria-hidden="true" /> Đang xác thực…</>
          : complete ? <><Check size={18} aria-hidden="true" /> Đã xác thực</>
            : <>Xác thực <span className={styles.submitGlyph}><Check size={17} aria-hidden="true" /></span></>}
      </button>
      <div className={styles.otpActions}>
        <button type="button" className={theme.actionButton} disabled={loading || resending} onClick={onBack}><ArrowLeft size={16} aria-hidden="true" /> Quay lại đăng nhập</button>
        <button type="button" className={theme.actionButton} disabled={countdown > 0 || resending || loading || complete} onClick={() => void resend()}>
          <RotateCcw size={15} aria-hidden="true" /> {resending ? 'Đang gửi…' : countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
        </button>
      </div>
    </form>
  )
}
