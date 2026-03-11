import { NextResponse } from 'next/server'
import { pool } from '@/lib/mysql'
import {
  ensureMonitorTable,
  estimateTrafficBytes,
  getClientIp,
  parseBrowser,
  parseDeviceType,
  parseOs,
  type VisitPayload,
} from '@/lib/monitor'

export const runtime = 'nodejs'

const MAX_PATH_LENGTH = 512

export async function POST(request: Request) {
  try {
    await ensureMonitorTable()

    const body = (await request.json()) as VisitPayload
    const path = (body.path ?? '').trim()

    if (!path) {
      return NextResponse.json({ message: 'path is required' }, { status: 400 })
    }

    const clippedPath = path.slice(0, MAX_PATH_LENGTH)
    const ua = (body.userAgent ?? request.headers.get('user-agent') ?? '').trim()

    const deviceType = parseDeviceType(ua)
    const browser = parseBrowser(ua)
    const os = parseOs(ua)

    const payloadForSize: VisitPayload = {
      path: clippedPath,
      referrer: body.referrer,
      userAgent: ua,
      language: body.language,
      timezone: body.timezone,
      screenWidth: body.screenWidth,
      screenHeight: body.screenHeight,
    }

    const estimatedBytes = estimateTrafficBytes(payloadForSize)

    await pool.execute(
      `
      INSERT INTO visitor_log (
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
        estimated_bytes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        clippedPath,
        getClientIp(request.headers),
        'GET',
        ua || null,
        deviceType,
        browser,
        os,
        body.language ?? null,
        body.timezone ?? null,
        Number.isFinite(body.screenWidth) ? body.screenWidth : null,
        Number.isFinite(body.screenHeight) ? body.screenHeight : null,
        body.referrer ?? null,
        estimatedBytes,
      ],
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to track visitor log:', error)
    return NextResponse.json({ message: 'failed to track visitor log' }, { status: 500 })
  }
}
