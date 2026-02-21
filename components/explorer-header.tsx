"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Database } from "lucide-react"

export function ExplorerHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Personal Dictionary</h1>
            <nav className="grid w-full max-w-sm grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              <Link
                href="/"
                replace
                className={`rounded-md px-4 py-2 text-center text-sm font-medium transition-colors ${
                  pathname === "/"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                어휘탐색
              </Link>
              <Link
                href="/analyzer"
                replace
                className={`rounded-md px-4 py-2 text-center text-sm font-medium transition-colors ${
                  pathname === "/analyzer"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                문장분석
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
            <Database className="h-4 w-4" />
            <span>데이터 소스: vocab.word</span>
          </div>
        </div>
      </div>
    </header>
  )
}
