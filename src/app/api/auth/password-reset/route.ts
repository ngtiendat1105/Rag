import { NextRequest, NextResponse } from 'next/server'
import { sendOtp, verifyOtp } from '@/lib/otp'
import { findUserByEmail, resetUserPassword } from '@/lib/supabaseUsers'

export const runtime = 'nodejs'

const COOKIE_NAME = 'legal-password-reset'
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ message: 'Yêu cầu không hợp lệ.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (email.length > 254 || !emailPattern.test(email)) {
      return NextResponse.json({ message: 'Email không hợp lệ.' }, { status: 400 })
    }

    if (body.action === 'send') {
      const user = await findUserByEmail(email)
      const response = NextResponse.json({
        success: true,
        message: 'Nếu email thuộc một tài khoản đang hoạt động, mã xác thực sẽ được gửi đến hộp thư.',
      })

      if (user?.status === 'active') {
        const id = await sendOtp(email, 'password-reset')
        response.cookies.set(COOKIE_NAME, id, {
          httpOnly: true,
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 300,
          path: '/api/auth/password-reset',
        })
      }
      return response
    }

    if (body.action === 'reset') {
      if (typeof body.otp !== 'string' || !/^\d{6}$/.test(body.otp)) {
        return NextResponse.json({ message: 'OTP phải gồm 6 chữ số.' }, { status: 400 })
      }
      if (typeof body.password !== 'string' || body.password.length < 8) {
        return NextResponse.json({ message: 'Mật khẩu mới phải có ít nhất 8 ký tự.' }, { status: 400 })
      }

      verifyOtp(request.cookies.get(COOKIE_NAME)?.value ?? '', email, body.otp, 'password-reset')
      await resetUserPassword(email, body.password)

      const response = NextResponse.json({ success: true })
      response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/api/auth/password-reset' })
      return response
    }

    return NextResponse.json({ message: 'Yêu cầu không hợp lệ.' }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Không thể đặt lại mật khẩu.' },
      { status: 400 },
    )
  }
}
