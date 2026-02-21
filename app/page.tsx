import { BookOpen } from "lucide-react"
import { ExplorerHeader } from "@/components/explorer-header"
import { WordList } from "@/components/word-list"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <ExplorerHeader />

      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">어휘탐색</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                ㄱㄴㄷ 순 분류, 다의어 강조, 단어 클릭 시 네이버 사전 연결
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-16">
        <WordList />
      </main>

      <footer className="border-t border-border bg-muted/50">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <p className="text-center text-xs text-muted-foreground">
            단어를 클릭하면 네이버 국어사전에서 해당 단어를 검색합니다.
          </p>
        </div>
      </footer>
    </div>
  )
}
