import { NextRequest } from 'next/server'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

export function isAllowedRequestOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  if (origin === request.nextUrl.origin) return true
  if (process.env.NODE_ENV === 'production') return false

  try {
    const originUrl = new URL(origin)
    const requestUrl = request.nextUrl
    return (
      LOCAL_HOSTS.has(originUrl.hostname) &&
      LOCAL_HOSTS.has(requestUrl.hostname) &&
      originUrl.port === requestUrl.port &&
      originUrl.protocol === requestUrl.protocol
    )
  } catch {
    return false
  }
}
