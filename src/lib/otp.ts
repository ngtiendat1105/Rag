import { createHash, randomInt, randomUUID, timingSafeEqual } from 'node:crypto'

type Challenge = { email: string; hash: Buffer; expires: number; attempts: number }
const state = globalThis as typeof globalThis & { legalOtp?: { challenges: Map<string, Challenge>; sends: Map<string, number> } }
const storage = state.legalOtp ??= { challenges: new Map(), sends: new Map() }
const digest = (id: string, code: string) => createHash('sha256').update(`${id}:${code}`).digest()

export async function sendOtp(email: string) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!key || !from) throw new Error('Chưa cấu hình RESEND_API_KEY và RESEND_FROM_EMAIL trên máy chủ.')
  const now = Date.now()
  storage.challenges.forEach((value, id) => { if (value.expires <= now) storage.challenges.delete(id) })
  storage.sends.forEach((time, address) => { if (now - time >= 60_000) storage.sends.delete(address) })
  if (storage.sends.has(email)) throw new Error('Vui lòng chờ 60 giây trước khi gửi lại mã.')
  storage.sends.set(email, now)
  const id = randomUUID()
  const code = randomInt(100000, 1000000).toString()
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': id },
      body: JSON.stringify({ from, to: [email], subject: 'Mã xác thực Legal AI', text: `Mã xác thực của bạn là: ${code}. Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.` }),
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const message = typeof error.message === 'string' ? error.message.toLowerCase() : ''
      if (message.includes('only send testing emails')) {
        throw new Error('Resend chỉ cho phép gửi thử đến email đăng ký tài khoản Resend. Hãy dùng email đó hoặc xác minh domain gửi thư.')
      }
      if (message.includes('not verified')) {
        throw new Error('Domain gửi thư chưa được xác minh trên Resend. Kiểm tra RESEND_FROM_EMAIL.')
      }
      if (response.status === 401 || message.includes('api key')) {
        throw new Error('API key Resend không hợp lệ hoặc không có quyền gửi thư. Kiểm tra RESEND_API_KEY.')
      }
      if (response.status === 429) {
        throw new Error('Resend đang giới hạn số lần gửi. Vui lòng thử lại sau.')
      }
      throw new Error(`Không thể gửi email OTP (Resend HTTP ${response.status}). Vui lòng kiểm tra cấu hình Resend hoặc thử lại sau.`)
    }
    const result = await response.json()
    if (!result.id) throw new Error('Resend chưa xác nhận gửi email. Vui lòng thử lại.')
    // A successful resend invalidates all previous codes for this address.
    storage.challenges.forEach((value, oldId) => { if (value.email === email) storage.challenges.delete(oldId) })
    storage.challenges.set(id, { email, hash: digest(id, code), expires: Date.now() + 300000, attempts: 0 })
    return id
  } catch (error) {
    storage.sends.delete(email)
    throw error
  }
}

export function verifyOtp(id: string, email: string, code: string) {
  const challenge = storage.challenges.get(id)
  if (!challenge || challenge.email !== email || challenge.expires <= Date.now() || challenge.attempts >= 5) {
    throw new Error('Mã OTP đã hết hạn hoặc không còn hợp lệ. Vui lòng gửi lại mã.')
  }
  challenge.attempts++
  if (!/^\d{6}$/.test(code) || !timingSafeEqual(challenge.hash, digest(id, code))) {
    throw new Error('Mã OTP không chính xác. Vui lòng thử lại.')
  }
  storage.challenges.delete(id)
}
