'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, Clock3, HardDriveDownload, MousePointerClick, Smartphone } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ExplorerHeader } from '@/components/explorer-header'
import { Input } from '@/components/ui/input'

interface MonitorLog {
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

interface MonitorStats {
  totalVisits: number
  totalTrafficBytes: number
  uniqueIps: number
  visitsToday: number
  visitsLast24h: number
  weeklyVisits: WeeklyVisitPoint[]
}

interface WeeklyVisitPoint {
  date: string
  visits: number
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

function formatTime(input: string): string {
  const date = new Date(input)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDayLabel(dateText: string): string {
  const date = new Date(dateText)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

export default function MonitorPage() {
  const [logs, setLogs] = useState<MonitorLog[]>([])
  const [stats, setStats] = useState<MonitorStats | null>(null)
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMonitorData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [logsRes, statsRes] = await Promise.all([
        fetch('/api/monitor/logs?limit=300', { cache: 'no-store' }),
        fetch('/api/monitor/stats', { cache: 'no-store' }),
      ])

      if (logsRes.status === 401 || statsRes.status === 401) {
        setIsAuthenticated(false)
        setLogs([])
        setStats(null)
        return
      }

      const logsData = await logsRes.json()
      const statsData = await statsRes.json()

      if (!logsRes.ok) {
        throw new Error(logsData.message ?? '로그를 불러오지 못했습니다.')
      }

      if (!statsRes.ok) {
        throw new Error(statsData.message ?? '통계를 불러오지 못했습니다.')
      }

      const nextLogs = (logsData.logs ?? []) as MonitorLog[]
      setLogs(nextLogs)
      setStats(statsData.stats as MonitorStats)
      setSelectedLogId(nextLogs[0]?.id ?? null)
      setIsAuthenticated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '모니터링 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMonitorData()
  }, [loadMonitorData])

  const selected = useMemo(
    () => logs.find((item) => item.id === selectedLogId) ?? null,
    [logs, selectedLogId],
  )

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault()

    try {
      setAuthError(null)
      const response = await fetch('/api/monitor/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message ?? '비밀번호 인증에 실패했습니다.')
      }

      setPassword('')
      setIsAuthenticated(true)
      await loadMonitorData()
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '비밀번호 인증 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <ExplorerHeader />

      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Activity className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Monitor</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                접속 로그를 시간순으로 확인하고, 선택한 로그의 상세 정보를 조회합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-16">
        {isAuthenticated === null && (
          <section className="mx-auto max-w-md rounded-lg border border-border bg-card p-5 text-center text-sm text-muted-foreground">
            인증 상태를 확인하는 중입니다...
          </section>
        )}

        {isAuthenticated === false && (
          <section className="mx-auto max-w-md rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">Monitor Access</h3>
            <p className="mt-1 text-sm text-muted-foreground">비밀번호를 입력해야 monitor 페이지에 접근할 수 있습니다.</p>

            <form onSubmit={handleAuthSubmit} className="mt-4 space-y-3">
              <Input
                type="password"
                placeholder="Monitor password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="bg-background"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                인증 후 접속
              </button>
            </form>

            {authError && <p className="mt-3 text-sm text-destructive">{authError}</p>}
          </section>
        )}

        {isAuthenticated === true && (
          <>
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <section className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-foreground">최근 7일 접속 횟수</h3>
            <p className="text-xs text-muted-foreground">일자별 방문 수 집계</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.weeklyVisits ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDayLabel}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`${value} visits`, 'count']}
                  labelFormatter={(label) => `date: ${label}`}
                />
                <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MousePointerClick className="h-4 w-4" />
              <span className="text-xs">총 접속 횟수</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{stats?.totalVisits ?? 0}</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              <span className="text-xs">오늘 접속</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{stats?.visitsToday ?? 0}</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              <span className="text-xs">최근 24시간</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{stats?.visitsLast24h ?? 0}</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Smartphone className="h-4 w-4" />
              <span className="text-xs">고유 IP 수</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{stats?.uniqueIps ?? 0}</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HardDriveDownload className="h-4 w-4" />
              <span className="text-xs">누적 트래픽(추정)</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{formatBytes(stats?.totalTrafficBytes ?? 0)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">접속 로그 (최신순)</h3>
            </div>

            <div className="max-h-[560px] overflow-y-auto">
              {loading ? (
                <p className="p-4 text-sm text-muted-foreground">로딩 중...</p>
              ) : logs.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">로그가 없습니다.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {logs.map((log) => (
                    <li key={log.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedLogId(log.id)}
                        className={`w-full px-4 py-3 text-left transition-colors ${
                          selectedLogId === log.id ? 'bg-muted' : 'hover:bg-muted/60'
                        }`}
                      >
                        <p className="truncate text-sm font-medium text-foreground">{log.path}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatTime(log.createdAt)} | {log.ip ?? 'unknown ip'} | {log.deviceType ?? 'unknown device'}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">선택 로그 상세</h3>
            </div>

            <div className="space-y-2 p-4 text-sm">
              {!selected ? (
                <p className="text-muted-foreground">로그를 선택하면 상세 정보가 표시됩니다.</p>
              ) : (
                <>
                  <div><span className="font-medium text-foreground">시간:</span> <span className="text-muted-foreground">{formatTime(selected.createdAt)}</span></div>
                  <div><span className="font-medium text-foreground">경로:</span> <span className="text-muted-foreground">{selected.path}</span></div>
                  <div><span className="font-medium text-foreground">IP:</span> <span className="text-muted-foreground">{selected.ip ?? '-'}</span></div>
                  <div><span className="font-medium text-foreground">기기:</span> <span className="text-muted-foreground">{selected.deviceType ?? '-'}</span></div>
                  <div><span className="font-medium text-foreground">브라우저:</span> <span className="text-muted-foreground">{selected.browser ?? '-'}</span></div>
                  <div><span className="font-medium text-foreground">OS:</span> <span className="text-muted-foreground">{selected.os ?? '-'}</span></div>
                  <div><span className="font-medium text-foreground">언어:</span> <span className="text-muted-foreground">{selected.language ?? '-'}</span></div>
                  <div><span className="font-medium text-foreground">타임존:</span> <span className="text-muted-foreground">{selected.timezone ?? '-'}</span></div>
                  <div><span className="font-medium text-foreground">화면:</span> <span className="text-muted-foreground">{selected.screenWidth ?? '-'} x {selected.screenHeight ?? '-'}</span></div>
                  <div><span className="font-medium text-foreground">Referrer:</span> <span className="break-all text-muted-foreground">{selected.referrer || '-'}</span></div>
                  <div><span className="font-medium text-foreground">User-Agent:</span> <span className="break-all text-muted-foreground">{selected.userAgent || '-'}</span></div>
                  <div><span className="font-medium text-foreground">트래픽(추정):</span> <span className="text-muted-foreground">{formatBytes(selected.estimatedBytes)}</span></div>
                </>
              )}
            </div>
          </section>
        </div>
          </>
        )}
      </main>
    </div>
  )
}
