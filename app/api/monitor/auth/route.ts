import { NextResponse } from 'next/server'
import {
  getMonitorAuthClearCookieHeader,
  getMonitorAuthSetCookieHeader,
  getMonitorPassword,
} from '@/lib/monitor-auth'

export const runtime = 'nodejs'

interface AuthBody {
  password?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AuthBody
    const password = (body.password ?? '').trim()
    const expected = getMonitorPassword()

    if (!expected) {
      return NextResponse.json({ message: 'monitor password is not configured' }, { status: 500 })
    }

    if (password !== expected) {
      return NextResponse.json({ message: 'invalid password' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    response.headers.set('Set-Cookie', getMonitorAuthSetCookieHeader())
    return response
  } catch (error) {
    console.error('Failed to authenticate monitor:', error)
    return NextResponse.json({ message: 'failed to authenticate' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.headers.set('Set-Cookie', getMonitorAuthClearCookieHeader())
  return response
}
