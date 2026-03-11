import { NextResponse } from 'next/server'
import type { RowDataPacket } from 'mysql2'
import { pool } from '@/lib/mysql'
import { ensureMonitorTable } from '@/lib/monitor'
import { isMonitorAuthorized } from '@/lib/monitor-auth'

export const runtime = 'nodejs'

interface VisitorLogRow extends RowDataPacket {
  id: number
  path: string
  ip: string | null
  method: string
  user_agent: string | null
  device_type: string | null
  browser: string | null
  os: string | null
  language: string | null
  timezone: string | null
  screen_width: number | null
  screen_height: number | null
  referrer: string | null
  estimated_bytes: number
  created_at: Date
}

export async function GET(request: Request) {
  try {
    if (!isMonitorAuthorized(request)) {
      return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
    }

    await ensureMonitorTable()

    const url = new URL(request.url)
    const limitRaw = Number(url.searchParams.get('limit') ?? '200')
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 1000) : 200

    const [rows] = await pool.query<VisitorLogRow[]>(
      `
      SELECT
        id,
        path,
        ip,
        method,
        user_agent,
        device_type,
        browser,
        os,
        language,
        timezone,
        screen_width,
        screen_height,
        referrer,
        estimated_bytes,
        created_at
      FROM visitor_log
      ORDER BY created_at DESC, id DESC
      LIMIT ?
      `,
      [limit],
    )

    const logs = rows.map((row) => ({
      id: row.id,
      path: row.path,
      ip: row.ip,
      method: row.method,
      userAgent: row.user_agent,
      deviceType: row.device_type,
      browser: row.browser,
      os: row.os,
      language: row.language,
      timezone: row.timezone,
      screenWidth: row.screen_width,
      screenHeight: row.screen_height,
      referrer: row.referrer,
      estimatedBytes: row.estimated_bytes,
      createdAt: new Date(row.created_at).toISOString(),
    }))

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Failed to load monitor logs:', error)
    return NextResponse.json({ message: 'failed to load monitor logs' }, { status: 500 })
  }
}
