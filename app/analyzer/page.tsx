import { Repeat2 } from "lucide-react"
import { ExplorerHeader } from "@/components/explorer-header"
import { SentenceAnalyzer } from "@/components/sentence-analyzer"

export default function AnalyzerPage() {
  return (
    <div className="min-h-screen bg-background">
      <ExplorerHeader />

      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Repeat2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">문장분석</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                문장 속 동사/관형사를 찾아 데이터 내 대체 가능한 단어를 제안합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-16">
        <SentenceAnalyzer />
      </main>
    </div>
  )
}
