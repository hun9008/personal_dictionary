const MONITOR_COOKIE_NAME = 'monitor_auth'
const MONITOR_COOKIE_VALUE = 'verified'

function parseCookie(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}

  const parsed: Record<string, string> = {}
  const parts = cookieHeader.split(';')

  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split('=')
    if (!rawKey || rest.length === 0) continue
    parsed[rawKey] = decodeURIComponent(rest.join('='))
  }

  return parsed
}

export function getMonitorPassword(): string {
  return (process.env.MONITOR_PASSWORD ?? '').trim()
}

export function isMonitorAuthorized(request: Request): boolean {
  const cookies = parseCookie(request.headers.get('cookie'))
  return cookies[MONITOR_COOKIE_NAME] === MONITOR_COOKIE_VALUE
}

export function getMonitorAuthSetCookieHeader(maxAgeSeconds = 60 * 60 * 8): string {
  return `${MONITOR_COOKIE_NAME}=${MONITOR_COOKIE_VALUE}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax`
}

export function getMonitorAuthClearCookieHeader(): string {
  return `${MONITOR_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
}
