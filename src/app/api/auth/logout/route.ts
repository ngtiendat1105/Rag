import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
  return response
}
