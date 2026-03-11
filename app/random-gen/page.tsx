import { WandSparkles } from "lucide-react"
import { ExplorerHeader } from "@/components/explorer-header"
import { RandomGen } from "@/components/random-gen"

export default function RandomGenPage() {
  return (
    <div className="min-h-screen bg-background">
      <ExplorerHeader />

      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <WandSparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Random Gen</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                단어집합 랜덤 2단어 추출과 위키백과 랜덤 워크 문장 생성을 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-16">
        <RandomGen />
      </main>
    </div>
  )
}
