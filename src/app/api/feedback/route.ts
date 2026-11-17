import { NextRequest, NextResponse } from 'next/server'
import { createChatFeedback, listChatFeedback } from '@/lib/supabaseFeedback'
import { readSession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'nodejs'

function session(request: NextRequest) {
  return readSession(request.cookies.get(SESSION_COOKIE)?.value)
}

export async function POST(request: NextRequest) {
  const current = session(request)
  if (!current) return NextResponse.json({ message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
  try {
    const body = await request.json()
    const rating = body.rating === 'like' || body.rating === 'dislike' ? body.rating : null
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    const detail = typeof body.detail === 'string' ? body.detail.trim() : ''
    const messageId = typeof body.messageId === 'string' ? body.messageId.trim() : ''
    const messageContent = typeof body.messageContent === 'string' ? body.messageContent.trim() : ''
    if (!rating || !reason || !messageId || !messageContent) {
      return NextResponse.json({ message: 'Feedback chưa đầy đủ thông tin.' }, { status: 400 })
    }
    if (reason.length > 200 || detail.length > 2_000 || messageContent.length > 20_000) {
      return NextResponse.json({ message: 'Feedback vượt quá giới hạn cho phép.' }, { status: 400 })
    }
    return NextResponse.json({ feedback: await createChatFeedback({ userId: current.id, messageId, rating, reason, detail, messageContent }) }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Không thể lưu feedback.' }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  if (session(request)?.role !== 'admin') return NextResponse.json({ message: 'Bạn không có quyền truy cập.' }, { status: 403 })
  try {
    return NextResponse.json({ feedback: await listChatFeedback() })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Không thể tải feedback.' }, { status: 400 })
  }
}
