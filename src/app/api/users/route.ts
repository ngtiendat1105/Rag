import { NextRequest, NextResponse } from 'next/server'
import { createUser, deleteUser, listUsers, updateUser } from '@/lib/supabaseUsers'
import { readSession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'nodejs'

function admin(request: NextRequest) {
  return readSession(request.cookies.get(SESSION_COOKIE)?.value)?.role === 'admin'
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Không thể xử lý người dùng.'
  const status = /duplicate key|unique/i.test(message) ? 409 : 400
  return NextResponse.json({ message }, { status })
}

export async function GET(request: NextRequest) {
  if (!admin(request)) return NextResponse.json({ message: 'Bạn không có quyền truy cập.' }, { status: 403 })
  try { return NextResponse.json({ users: await listUsers() }) } catch (error) { return errorResponse(error) }
}

export async function POST(request: NextRequest) {
  if (!admin(request)) return NextResponse.json({ message: 'Bạn không có quyền truy cập.' }, { status: 403 })
  try {
    const body = await request.json()
    if (!body.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email || '')) return NextResponse.json({ message: 'Họ tên hoặc email không hợp lệ.' }, { status: 400 })
    if (typeof body.password !== 'string' || body.password.length < 8) return NextResponse.json({ message: 'Mật khẩu tạm phải có ít nhất 8 ký tự.' }, { status: 400 })
    if (!['admin', 'moderator', 'user'].includes(body.role)) return NextResponse.json({ message: 'Vai trò không hợp lệ.' }, { status: 400 })
    return NextResponse.json({ user: await createUser({ name: body.name.trim(), email: body.email.trim(), role: body.role, department: body.department, password: body.password }) }, { status: 201 })
  } catch (error) { return errorResponse(error) }
}

export async function PATCH(request: NextRequest) {
  if (!admin(request)) return NextResponse.json({ message: 'Bạn không có quyền truy cập.' }, { status: 403 })
  try {
    const body = await request.json()
    const input = body.user || {}
    const safeUser = { name: input.name, email: input.email, role: input.role, department: input.department, status: input.status }
    if (!body.id || !safeUser.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeUser.email || '')) return NextResponse.json({ message: 'Thông tin người dùng không hợp lệ.' }, { status: 400 })
    if (!['admin', 'moderator', 'user'].includes(safeUser.role) || !['active', 'inactive', 'pending'].includes(safeUser.status)) return NextResponse.json({ message: 'Vai trò hoặc trạng thái không hợp lệ.' }, { status: 400 })
    return NextResponse.json({ user: await updateUser(body.id, safeUser) })
  } catch (error) { return errorResponse(error) }
}

export async function DELETE(request: NextRequest) {
  if (!admin(request)) return NextResponse.json({ message: 'Bạn không có quyền truy cập.' }, { status: 403 })
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ message: 'Thiếu ID người dùng.' }, { status: 400 })
    const session = readSession(request.cookies.get(SESSION_COOKIE)?.value)
    if (session?.id === id) return NextResponse.json({ message: 'Không thể xóa tài khoản đang đăng nhập.' }, { status: 400 })
    await deleteUser(id)
    return new NextResponse(null, { status: 204 })
  } catch (error) { return errorResponse(error) }
}

