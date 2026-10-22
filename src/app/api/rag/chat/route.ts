import { NextRequest, NextResponse } from 'next/server'
import { readSession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'nodejs'

type RagApiError = { detail?: string; message?: string }

export async function POST(request: NextRequest) {
  const session = readSession(request.cookies.get(SESSION_COOKIE)?.value)
  if (!session) return NextResponse.json({ message: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 })

  let question = ''
  try {
    const body = await request.json()
    question = typeof body.question === 'string' ? body.question.trim() : ''
  } catch {
    return NextResponse.json({ message: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 })
  }
  if (question.length < 2 || question.length > 2000) return NextResponse.json({ message: 'Câu hỏi phải có từ 2 đến 2.000 ký tự.' }, { status: 400 })

  const apiKey = process.env.LEGALAI_API_KEY
  if (!apiKey) return NextResponse.json({ message: 'Máy chủ chưa cấu hình LEGALAI_API_KEY.' }, { status: 503 })

  const baseUrl = (process.env.RAG_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
  const controller = new AbortController()
  const configuredTimeout = Number(process.env.RAG_REQUEST_TIMEOUT_MS || 180_000)
  const timeoutMs = Number.isFinite(configuredTimeout)
    ? Math.min(Math.max(configuredTimeout, 30_000), 300_000)
    : 180_000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ question }),
      signal: controller.signal,
      cache: 'no-store',
    })
    const data = await response.json().catch(() => ({})) as RagApiError
    if (!response.ok) return NextResponse.json({ message: data.detail || data.message || 'Dịch vụ RAG không thể xử lý câu hỏi.' }, { status: response.status })
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'Dịch vụ RAG phản hồi quá lâu. Vui lòng thử lại.'
      : 'Không thể kết nối dịch vụ RAG. Hãy kiểm tra FastAPI, Ollama và Qdrant.'
    return NextResponse.json({ message }, { status: 503 })
  } finally {
    clearTimeout(timeout)
  }
}
