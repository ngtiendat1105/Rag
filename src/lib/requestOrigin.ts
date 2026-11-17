import { NextRequest } from 'next/server'

const BUILT_IN_ORIGINS = [
  'https://legalai.id.vn',
  'https://www.legalai.id.vn',
  'https://dev.dyflmpm9fr5i3.amplifyapp.com',
  'http://localhost:3000',
  'http://localhost:3001',
]

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return ''
  try {
    return new URL(value).origin.toLowerCase()
  } catch {
    return ''
  }
}

function configuredOrigins() {
  return (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter(Boolean)
}

/**
 * Verify browser requests without relying on Amplify's internal host.
 * Amplify may keep the public custom domain in Origin while forwarding an
 * internal host to Next.js, so both configured and forwarded origins are used.
 */
export function isSameOrigin(request: NextRequest) {
  const origin = normalizeOrigin(request.headers.get('origin'))
  if (!origin) return false

  const allowed = new Set([
    ...BUILT_IN_ORIGINS.map(normalizeOrigin),
    ...configuredOrigins(),
    normalizeOrigin(request.nextUrl.origin),
  ])

  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https'
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = request.headers.get('host')?.split(',')[0]?.trim()
  if (host) allowed.add(normalizeOrigin(`${forwardedProto}://${host}`))
  if (forwardedHost) allowed.add(normalizeOrigin(`${forwardedProto}://${forwardedHost}`))

  return allowed.has(origin)
}
