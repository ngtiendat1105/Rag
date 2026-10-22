import { createHmac, timingSafeEqual } from 'node:crypto'
import type { AppUser } from './supabaseUsers'

export const SESSION_COOKIE = 'legal-ai-session'

type SessionPayload = Pick<AppUser, 'id' | 'email' | 'name' | 'role' | 'department'> & { exp: number }

function secret() {
  const value = process.env.AUTH_SESSION_SECRET
  if (!value || value.length < 32) throw new Error('AUTH_SESSION_SECRET phải có ít nhất 32 ký tự.')
  return value
}

export function createSession(user: AppUser) {
  const payload: SessionPayload = { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department, exp: Date.now() + 8 * 60 * 60 * 1000 }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${signature}`
}

export function readSession(value?: string): SessionPayload | null {
  if (!value) return null
  try {
    const [body, signature] = value.split('.')
    if (!body || !signature) return null
    const expected = createHmac('sha256', secret()).update(body).digest()
    const provided = Buffer.from(signature, 'base64url')
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload
    return payload.exp > Date.now() ? payload : null
  } catch {
    return null
  }
}

