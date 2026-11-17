import { NextRequest, NextResponse } from 'next/server'
import { deleteStorageDocument, listStorageDocuments, uploadStorageDocument } from '@/lib/supabaseStorage'
import { readSession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'nodejs'

function isAdmin(request: NextRequest) {
  return readSession(request.cookies.get(SESSION_COOKIE)?.value)?.role === 'admin'
}

async function indexInRag(file: File) {
  const baseUrl = process.env.RAG_API_URL || 'http://127.0.0.1:8000'
  const apiKey = process.env.LEGALAI_API_KEY
  if (!apiKey) throw new Error('Thiếu LEGALAI_API_KEY để lập chỉ mục RAG.')
  const form = new FormData()
  form.append('file', new Blob([await file.arrayBuffer()], { type: file.type || 'application/octet-stream' }), file.name)
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/documents/ingest`, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
    body: form,
    cache: 'no-store',
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || 'Không thể lập chỉ mục tài liệu trong RAG.')
  }
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ message: 'Bạn không có quyền truy cập.' }, { status: 403 })
  try {
    return NextResponse.json({ documents: await listStorageDocuments() })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Không thể tải tài liệu.' }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ message: 'Bạn không có quyền truy cập.' }, { status: 403 })
  try {
    const form = await request.formData()
    const files = form.getAll('files').filter((value): value is File => value instanceof File)
    if (!files.length) return NextResponse.json({ message: 'Vui lòng chọn ít nhất một tài liệu.' }, { status: 400 })
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) return NextResponse.json({ message: `${file.name} vượt quá giới hạn 10 MB.` }, { status: 400 })
      await uploadStorageDocument(file)
      await indexInRag(file)
    }
    return NextResponse.json({ documents: await listStorageDocuments() }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Không thể tải tài liệu lên Storage.' }, { status: 503 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ message: 'Bạn không có quyền truy cập.' }, { status: 403 })
  try {
    const path = request.nextUrl.searchParams.get('path')?.trim()
    if (!path) return NextResponse.json({ message: 'Thiếu đường dẫn tài liệu.' }, { status: 400 })
    await deleteStorageDocument(path)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Không thể xóa tài liệu.' }, { status: 503 })
  }
}
