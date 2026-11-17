import { NextRequest, NextResponse } from 'next/server'
import { readSession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!readSession(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
  }
  const name = request.nextUrl.searchParams.get('name')?.trim()
  if (!name) return NextResponse.json({ message: 'Thiếu tên tài liệu.' }, { status: 400 })
  const apiKey = process.env.LEGALAI_API_KEY
  if (!apiKey) return NextResponse.json({ message: 'Máy chủ chưa cấu hình LEGALAI_API_KEY.' }, { status: 503 })
  const baseUrl = (process.env.RAG_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
  const response = await fetch(`${baseUrl}/api/documents/preview?name=${encodeURIComponent(name)}`, {
    headers: { 'X-API-Key': apiKey },
    cache: 'no-store',
  })
  if (!response.ok) return NextResponse.json({ message: 'Không thể tải tài liệu nguồn.' }, { status: response.status })
  return new NextResponse(await response.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/pdf',
      'Content-Disposition': response.headers.get('content-disposition') || 'inline',
      'Cache-Control': 'private, no-store',
    },
  })
}
