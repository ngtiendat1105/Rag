export type AppUserRole = 'admin' | 'moderator' | 'user'
export type AppUserStatus = 'active' | 'inactive' | 'pending'

export interface AppUser {
  id: string
  name: string
  email: string
  role: AppUserRole
  department: string
  phone: string | null
  avatarUrl: string | null
  status: AppUserStatus
  lastActive: string | null
}

interface SupabaseUserRow {
  id: string
  name: string
  email: string
  role: AppUserRole
  department: string
  phone: string | null
  avatar_url: string | null
  status: AppUserStatus
  last_active: string | null
}

function config() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Chưa cấu hình SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY.')
  return { baseUrl: `${url.replace(/\/$/, '')}/rest/v1`, key }
}

async function request(path: string, init: RequestInit = {}) {
  const { baseUrl, key } = config()
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const message = typeof error.message === 'string' ? error.message : `Supabase HTTP ${response.status}`
    if (message.includes('create_app_user') && message.includes('schema cache')) {
      throw new Error('Supabase chưa có hàm create_app_user. Hãy chạy file supabase/migrations/20261022_create_app_user.sql trong SQL Editor.')
    }
    if (message.includes('reset_app_user_password') && message.includes('schema cache')) {
      throw new Error('Supabase chưa có hàm đặt lại mật khẩu. Hãy chạy file supabase/migrations/20261022_reset_password.sql trong SQL Editor.')
    }
    throw new Error(message)
  }
  if (response.status === 204) return null
  return response.json()
}

const mapUser = (row: SupabaseUserRow): AppUser => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  department: row.department,
  phone: row.phone,
  avatarUrl: row.avatar_url,
  status: row.status,
  lastActive: row.last_active,
})

export async function authenticateUser(email: string, password: string): Promise<AppUser | null> {
  const rows = await request('/rpc/authenticate_app_user', {
    method: 'POST',
    body: JSON.stringify({ p_email: email, p_password: password }),
  }) as SupabaseUserRow[]
  return rows[0] ? mapUser(rows[0]) : null
}

export async function findUserByEmail(email: string): Promise<AppUser | null> {
  const rows = await request(`/app_users?select=id,name,email,role,department,phone,avatar_url,status,last_active&email=eq.${encodeURIComponent(email.toLowerCase())}&limit=1`) as SupabaseUserRow[]
  return rows[0] ? mapUser(rows[0]) : null
}

export async function listUsers(): Promise<AppUser[]> {
  const rows = await request('/app_users?select=id,name,email,role,department,status,last_active&order=created_at.desc') as SupabaseUserRow[]
  return rows.map(mapUser)
}

export async function createUser(input: Pick<AppUser, 'name' | 'email' | 'role' | 'department'> & { password: string }): Promise<AppUser> {
  const rows = await request('/rpc/create_app_user', {
    method: 'POST',
    body: JSON.stringify({ p_name: input.name, p_email: input.email, p_role: input.role, p_department: input.department, p_password: input.password }),
  }) as SupabaseUserRow[]
  return mapUser(rows[0])
}

export async function updateUser(id: string, input: Partial<Pick<AppUser, 'name' | 'email' | 'role' | 'department' | 'status'>>): Promise<AppUser> {
  const rows = await request(`/app_users?id=eq.${encodeURIComponent(id)}&select=id,name,email,role,department,phone,avatar_url,status,last_active`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(input.email ? { ...input, email: input.email.toLowerCase() } : input),
  }) as SupabaseUserRow[]
  if (!rows[0]) throw new Error('Không tìm thấy người dùng.')
  return mapUser(rows[0])
}

export async function getUserById(id: string): Promise<AppUser | null> {
  const rows = await request(`/app_users?select=id,name,email,role,department,phone,avatar_url,status,last_active&id=eq.${encodeURIComponent(id)}&limit=1`) as SupabaseUserRow[]
  return rows[0] ? mapUser(rows[0]) : null
}

export async function updateProfile(
  id: string,
  input: Pick<AppUser, 'name' | 'phone' | 'avatarUrl'>
): Promise<AppUser> {
  const rows = await request(`/app_users?id=eq.${encodeURIComponent(id)}&select=id,name,email,role,department,phone,avatar_url,status,last_active`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      avatar_url: input.avatarUrl || null,
    }),
  }) as SupabaseUserRow[]
  if (!rows[0]) throw new Error('Không tìm thấy người dùng.')
  return mapUser(rows[0])
}

export async function deleteUser(id: string) {
  await request(`/app_users?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function resetUserPassword(email: string, password: string) {
  const updated = await request('/rpc/reset_app_user_password', {
    method: 'POST',
    body: JSON.stringify({ p_email: email, p_password: password }),
  }) as boolean
  if (!updated) throw new Error('Không thể đặt lại mật khẩu cho tài khoản này.')
}
