import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const baseUrl = (process.env.RAG_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
  try {
    const response = await fetch(`${baseUrl}/health`, { cache: 'no-store' })
    return NextResponse.json({ status: response.ok ? 'ok' : 'error' }, { status: response.ok ? 200 : 503 })
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 503 })
  }
}
