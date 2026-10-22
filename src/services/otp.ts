export async function requestOtp(action: 'send' | 'verify', email: string, options: { otp?: string; password?: string } = {}) {
  const response = await fetch('/api/auth/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, email, ...options }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Không thể xử lý OTP. Vui lòng thử lại.')
  return data
}
