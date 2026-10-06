import { NextRequest, NextResponse } from 'next/server'
import { sendOtp, verifyOtp } from '@/lib/otp'

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
      const id = await sendOtp(email)
      const response = NextResponse.json({ success: true })
      response.cookies.set('legal-otp', id, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 300, path: '/api/auth/otp' })
      return response
    }
    if (body.action === 'verify' && typeof body.otp === 'string') {
      verifyOtp(request.cookies.get('legal-otp')?.value ?? '', email, body.otp)
      const response = NextResponse.json({ success: true })
      response.cookies.set('legal-otp', '', { maxAge: 0, path: '/api/auth/otp' })
      return response
    }
    return NextResponse.json({ message: 'Yêu cầu không hợp lệ.' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Không thể xử lý OTP.' }, { status: 400 })
  }
}
