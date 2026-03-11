"use client"

import { useEffect, useMemo, useState } from "react"
import { Shuffle, Sparkles } from "lucide-react"
import type { KoreanWord } from "@/lib/korean-data"

const WORDS_CACHE_KEY = "vocab_words_cache_v1"

interface WikiSentenceResponse {
  sentence: string
  sourceTitle: string
}

function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max)
}

function pickTwoDistinctWords(words: KoreanWord[]): [KoreanWord, KoreanWord] | null {
  if (words.length < 2) return null

  const firstIndex = getRandomInt(words.length)
  let secondIndex = getRandomInt(words.length)

  while (secondIndex === firstIndex) {
    secondIndex = getRandomInt(words.length)
  }

  return [words[firstIndex], words[secondIndex]]
}

export function RandomGen() {
  const [words, setWords] = useState<KoreanWord[]>([])
  const [loadingWords, setLoadingWords] = useState(true)
  const [wordError, setWordError] = useState<string | null>(null)

  const [pair, setPair] = useState<[KoreanWord, KoreanWord] | null>(null)

  const [randomSentence, setRandomSentence] = useState("")
  const [sentenceSource, setSentenceSource] = useState("")
  const [sentenceError, setSentenceError] = useState<string | null>(null)
  const [generatingSentence, setGeneratingSentence] = useState(false)

  useEffect(() => {
    let mounted = true

    const fetchWords = async () => {
      try {
        setLoadingWords(true)
        setWordError(null)

        const cached = localStorage.getItem(WORDS_CACHE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached) as KoreanWord[]
          if (mounted) {
            setWords(parsed)
            setLoadingWords(false)
          }
          return
        }

        const response = await fetch("/api/words", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("단어 목록을 가져오지 못했습니다.")
        }

        const data = (await response.json()) as { words: KoreanWord[] }
        const nextWords = data.words ?? []

        if (mounted) {
          setWords(nextWords)
          localStorage.setItem(WORDS_CACHE_KEY, JSON.stringify(nextWords))
        }
      } catch (error) {
        if (mounted) {
          setWordError(error instanceof Error ? error.message : "단어를 불러오는 중 오류가 발생했습니다.")
        }
      } finally {
        if (mounted) {
          setLoadingWords(false)
        }
      }
    }

    void fetchWords()

    return () => {
      mounted = false
    }
  }, [])

  const availableWordCount = useMemo(() => words.length, [words])

  const handleGeneratePair = () => {
    const nextPair = pickTwoDistinctWords(words)
    if (!nextPair) {
      setWordError("랜덤 2단어 추출에는 최소 2개 단어가 필요합니다.")
      return
    }

    setWordError(null)
    setPair(nextPair)
  }

  const handleGenerateSentence = async () => {
    try {
      setGeneratingSentence(true)
      setSentenceError(null)

      const response = await fetch("/api/random-gen/sentence", { cache: "no-store" })
      const data = (await response.json()) as Partial<WikiSentenceResponse> & { message?: string }

      if (!response.ok || !data.sentence) {
        throw new Error(data.message ?? "랜덤 문장을 생성하지 못했습니다.")
      }

      setRandomSentence(data.sentence)
      setSentenceSource(data.sourceTitle ?? "")
    } catch (error) {
      setSentenceError(error instanceof Error ? error.message : "문장 생성 중 오류가 발생했습니다.")
    } finally {
      setGeneratingSentence(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Shuffle className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">1) 랜덤 2단어 추출</h3>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          현재 단어집합에서 랜덤으로 서로 다른 2개 단어를 뽑습니다. (보유 단어 수: {availableWordCount})
        </p>

        <button
          onClick={handleGeneratePair}
          disabled={loadingWords || availableWordCount < 2}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          랜덤 2단어 추출
        </button>

        {pair && (
          <div className="mt-4 rounded-md bg-muted p-4">
            <p className="text-sm text-muted-foreground">결과</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {pair[0].word} / {pair[1].word}
            </p>
          </div>
        )}

        {wordError && <p className="mt-3 text-sm text-destructive">{wordError}</p>}
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">2) 완전 랜덤 문장 생성</h3>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          위키백과 랜덤 문서 본문에서 단어 전이(bigram) 랜덤 워크로 문장을 생성합니다. (MVP버전으로 문장 구조가 정확하지 않을 수 있으며 필요 시 원하는 데이터셋을 요청)
        </p>

        <button
          onClick={handleGenerateSentence}
          disabled={generatingSentence}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generatingSentence ? "생성 중..." : "랜덤 문장 생성"}
        </button>

        {randomSentence && (
          <div className="mt-4 rounded-md bg-muted p-4">
            <p className="text-sm text-muted-foreground">생성 결과</p>
            <p className="mt-1 text-base leading-relaxed text-foreground">{randomSentence}</p>
            {sentenceSource && (
              <p className="mt-2 text-xs text-muted-foreground">출처 문서: {sentenceSource}</p>
            )}
          </div>
        )}

        {sentenceError && <p className="mt-3 text-sm text-destructive">{sentenceError}</p>}
      </section>
    </div>
  )
}
