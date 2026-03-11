import { CircleHelp, Repeat2 } from "lucide-react"
import { ExplorerHeader } from "@/components/explorer-header"
import { SentenceAnalyzer } from "@/components/sentence-analyzer"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

export default function AnalyzerPage() {
  return (
    <div className="min-h-screen bg-background">
      <ExplorerHeader />

      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Repeat2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">문장분석</h2>
                <HoverCard openDelay={120} closeDelay={120}>
                  <HoverCardTrigger asChild>
                    <span
                      aria-label="문장분석 알고리즘 설명 보기"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <CircleHelp className="h-5 w-5" />
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent align="start" className="w-[26rem]">
                    <p className="text-xs font-semibold text-foreground">문장분석 로직</p>
                    <ol className="mt-1 list-decimal space-y-1.5 pl-4 text-xs text-muted-foreground">
                      <li>단어 데이터(`api/words`)를 불러온 뒤 끝의 온점(`.`)을 제거해 정규화합니다.</li>
                      <li>품사는 규칙 기반으로 추정합니다: 형용사 사전에 있으면 형용사, `다`로 끝나면 동사, 관형사 사전에 있으면 관형사로 분류합니다.</li>
                      <li>데이터가 부족할 때를 대비해 기본 fallback 단어 목록을 합쳐 분석 대상 어휘 풀을 구성합니다.</li>
                      <li>후보 탐지는 문장 포함 검사로 수행합니다: 동사/형용사는 어간(`다` 제거) 또는 원형 포함 여부를, 관형사는 단어 자체 포함 여부를 확인합니다.</li>
                      <li>탐지된 각 후보에 대해 동일 품사만 필터링하고, 자기 자신은 제외하여 대체 단어를 추립니다.</li>
                      <li>대체 제안은 최대 5개까지 반환하며, 중복 후보는 제거한 뒤 화면에 표시합니다.</li>
                    </ol>
                  </HoverCardContent>
                </HoverCard>
              </div>
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
