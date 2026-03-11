import { pool } from '@/lib/mysql'

export interface VisitLog {
  id: number
  path: string
  ip: string | null
  method: string
  userAgent: string | null
  deviceType: string | null
  browser: string | null
  os: string | null
  language: string | null
  timezone: string | null
  screenWidth: number | null
  screenHeight: number | null
  referrer: string | null
  estimatedBytes: number
  createdAt: string
}

export interface VisitPayload {
  path?: string
  referrer?: string
  userAgent?: string
  language?: string
  timezone?: string
  screenWidth?: number
  screenHeight?: number
}

let tableReady = false

export async function ensureMonitorTable(): Promise<void> {
  if (tableReady) return

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS visitor_log (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      path VARCHAR(512) NOT NULL,
      ip VARCHAR(128) NULL,
      method VARCHAR(16) NOT NULL,
      user_agent TEXT NULL,
      device_type VARCHAR(32) NULL,
      browser VARCHAR(64) NULL,
      os VARCHAR(64) NULL,
      language VARCHAR(32) NULL,
      timezone VARCHAR(64) NULL,
      screen_width INT NULL,
      screen_height INT NULL,
      referrer TEXT NULL,
      estimated_bytes INT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_visitor_log_created_at (created_at),
      INDEX idx_visitor_log_path (path),
      INDEX idx_visitor_log_ip (ip)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  tableReady = true
}

export function getClientIp(headers: Headers): string | null {
  const xForwardedFor = headers.get('x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0]?.trim() ?? null
  }

  const xRealIp = headers.get('x-real-ip')
  if (xRealIp) {
    return xRealIp.trim()
  }

  return null
}

export function parseBrowser(userAgent: string): string {
  if (/edg\//i.test(userAgent)) return 'Edge'
  if (/chrome\//i.test(userAgent)) return 'Chrome'
  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) return 'Safari'
  if (/firefox\//i.test(userAgent)) return 'Firefox'
  if (/opr\//i.test(userAgent)) return 'Opera'
  if (/msie|trident/i.test(userAgent)) return 'Internet Explorer'
  return 'Unknown'
}

export function parseOs(userAgent: string): string {
  if (/windows nt/i.test(userAgent)) return 'Windows'
  if (/mac os x/i.test(userAgent) && !/iphone|ipad/i.test(userAgent)) return 'macOS'
  if (/android/i.test(userAgent)) return 'Android'
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS'
  if (/linux/i.test(userAgent)) return 'Linux'
  return 'Unknown'
}

export function parseDeviceType(userAgent: string): string {
  if (/ipad|tablet/i.test(userAgent)) return 'Tablet'
  if (/mobi|iphone|android/i.test(userAgent)) return 'Mobile'
  return 'Desktop'
}

export function estimateTrafficBytes(payload: VisitPayload): number {
  const json = JSON.stringify(payload)
  return Buffer.byteLength(json, 'utf8')
}
