import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateProfile } from '@/lib/supabaseUsers'
import { readSession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'nodejs'

function currentUser(request: NextRequest) {
  return readSession(request.cookies.get(SESSION_COOKIE)?.value)
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ.'
  return NextResponse.json({ message }, { status: 400 })
}

export async function GET(request: NextRequest) {
  const session = currentUser(request)
  if (!session) return NextResponse.json({ message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
  try {
    const user = await getUserById(session.id)
    if (!user) return NextResponse.json({ message: 'Không tìm thấy hồ sơ.' }, { status: 404 })
    return NextResponse.json({ user })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  const session = currentUser(request)
  if (!session) return NextResponse.json({ message: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 })
  try {
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl : ''
    if (name.length < 2 || name.length > 120) {
      return NextResponse.json({ message: 'Họ tên phải có từ 2 đến 120 ký tự.' }, { status: 400 })
    }
    if (phone && !/^[+0-9][0-9 .()-]{7,19}$/.test(phone)) {
      return NextResponse.json({ message: 'Số điện thoại không hợp lệ.' }, { status: 400 })
    }
    if (avatarUrl && (!avatarUrl.startsWith('data:image/') || avatarUrl.length > 1_400_000)) {
      return NextResponse.json({ message: 'Ảnh đại diện không hợp lệ hoặc vượt quá 1 MB.' }, { status: 400 })
    }
    const user = await updateProfile(session.id, { name, phone, avatarUrl })
    return NextResponse.json({ user })
  } catch (error) {
    return errorResponse(error)
  }
}
