'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const LAST_TRACK_KEY = 'monitor_last_track_key'
const LAST_TRACK_TIME = 'monitor_last_track_time'

function shouldSkipTrack(key: string): boolean {
  if (typeof window === 'undefined') return false

  const lastKey = sessionStorage.getItem(LAST_TRACK_KEY)
  const lastTimeRaw = sessionStorage.getItem(LAST_TRACK_TIME)
  const lastTime = lastTimeRaw ? Number(lastTimeRaw) : 0

  const now = Date.now()
  if (lastKey === key && now - lastTime < 2000) {
    return true
  }

  sessionStorage.setItem(LAST_TRACK_KEY, key)
  sessionStorage.setItem(LAST_TRACK_TIME, String(now))
  return false
}

export function VisitTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return

    const query = searchParams?.toString()
    const path = query ? `${pathname}?${query}` : pathname

    if (shouldSkipTrack(path)) {
      return
    }

    const payload = {
      path,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenWidth: window.screen?.width ?? null,
      screenHeight: window.screen?.height ?? null,
    }

    void fetch('/api/monitor/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  }, [pathname, searchParams])

  return null
}
