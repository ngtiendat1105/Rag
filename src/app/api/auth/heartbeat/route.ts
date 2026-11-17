import { NextRequest, NextResponse } from 'next/server'
import { readSession, SESSION_COOKIE } from '@/lib/session'
import { touchUserActivity } from '@/lib/supabaseUsers'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const session = readSession(request.cookies.get(SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.json({ message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
  }

  try {
    await touchUserActivity(session.id)
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ message: 'Không thể cập nhật trạng thái hoạt động.' }, { status: 503 })
  }
}
