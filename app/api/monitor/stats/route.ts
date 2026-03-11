import { NextResponse } from 'next/server'
import type { RowDataPacket } from 'mysql2'
import { pool } from '@/lib/mysql'
import { ensureMonitorTable } from '@/lib/monitor'
import { isMonitorAuthorized } from '@/lib/monitor-auth'

export const runtime = 'nodejs'

interface StatsRow extends RowDataPacket {
  totalVisits: number
  totalTrafficBytes: number
  uniqueIps: number
  visitsToday: number
  visitsLast24h: number
}

interface DailyVisitRow extends RowDataPacket {
  day: Date | string
  visits: number
}

export async function GET(request: Request) {
  try {
    if (!isMonitorAuthorized(request)) {
      return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
    }

    await ensureMonitorTable()

    const [rows] = await pool.query<StatsRow[]>(`
      SELECT
        COUNT(*) AS totalVisits,
        COALESCE(SUM(estimated_bytes), 0) AS totalTrafficBytes,
        COUNT(DISTINCT ip) AS uniqueIps,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS visitsToday,
        SUM(CASE WHEN created_at >= (NOW() - INTERVAL 1 DAY) THEN 1 ELSE 0 END) AS visitsLast24h
      FROM visitor_log
    `)

    const [dailyRows] = await pool.query<DailyVisitRow[]>(`
      SELECT
        DATE(created_at) AS day,
        COUNT(*) AS visits
      FROM visitor_log
      WHERE created_at >= (CURDATE() - INTERVAL 6 DAY)
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `)

    const stats = rows[0] ?? {
      totalVisits: 0,
      totalTrafficBytes: 0,
      uniqueIps: 0,
      visitsToday: 0,
      visitsLast24h: 0,
    }

    const countByDay = new Map<string, number>()
    for (const row of dailyRows) {
      const key = new Date(row.day).toISOString().slice(0, 10)
      countByDay.set(key, Number(row.visits) || 0)
    }

    const weeklyVisits = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (6 - i))
      const key = date.toISOString().slice(0, 10)
      return {
        date: key,
        visits: countByDay.get(key) ?? 0,
      }
    })

    return NextResponse.json({ stats: { ...stats, weeklyVisits } })
  } catch (error) {
    console.error('Failed to load monitor stats:', error)
    return NextResponse.json({ message: 'failed to load monitor stats' }, { status: 500 })
  }
}
