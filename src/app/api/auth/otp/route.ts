import { NextRequest, NextResponse } from 'next/server'
import { sendOtp, verifyOtp } from '@/lib/otp'
import { authenticateUser, findUserByEmail } from '@/lib/supabaseUsers'
import { createSession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ message: 'Yêu cầu không hợp lệ.' }, { status: 403 })
  }
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'Email không hợp lệ.' }, { status: 400 })
    }
    if (body.action === 'send') {
      if (typeof body.password !== 'string') return NextResponse.json({ message: 'Thiếu mật khẩu.' }, { status: 400 })
      const user = await authenticateUser(email, body.password)
      if (!user) return NextResponse.json({ message: 'Email, mật khẩu không đúng hoặc tài khoản chưa được kích hoạt.' }, { status: 401 })
      const id = await sendOtp(email)
      const response = NextResponse.json({ success: true })
      response.cookies.set('legal-otp', id, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 300, path: '/api/auth/otp' })
      return response
    }
    if (body.action === 'verify' && typeof body.otp === 'string') {
      verifyOtp(request.cookies.get('legal-otp')?.value ?? '', email, body.otp)
      const user = await findUserByEmail(email)
      if (!user || user.status !== 'active') return NextResponse.json({ message: 'Tài khoản không còn hoạt động.' }, { status: 401 })
      const response = NextResponse.json({ success: true, user })
      response.cookies.set('legal-otp', '', { maxAge: 0, path: '/api/auth/otp' })
      response.cookies.set(SESSION_COOKIE, createSession(user), { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60, path: '/' })
      return response
    }
    return NextResponse.json({ message: 'Yêu cầu không hợp lệ.' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Không thể xử lý OTP.' }, { status: 400 })
  }
}
