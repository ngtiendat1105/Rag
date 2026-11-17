import { NextRequest, NextResponse } from 'next/server'
import { listPopularQuestions } from '@/lib/supabaseQuestions'
import { readSession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!readSession(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
  }

  const requestedLimit = Number(request.nextUrl.searchParams.get('limit') || 5)
  try {
    return NextResponse.json({ questions: await listPopularQuestions(requestedLimit) })
  } catch (error) {
    return NextResponse.json({
      message: error instanceof Error ? error.message : 'Không thể tải câu hỏi phổ biến.',
    }, { status: 503 })
  }
}
