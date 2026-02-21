"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Repeat2, Sparkles } from "lucide-react"
import { getNaverDictUrl } from "@/lib/korean-data"
import type { KoreanWord } from "@/lib/korean-data"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

const WORDS_CACHE_KEY = "vocab_words_cache_v1"

type PosType = "동사" | "형용사" | "관형사"

interface ExtendedWord extends KoreanWord {
  partOfSpeech: PosType
  meaning?: string
}

interface MatchedWord {
  original: string
  wordData: ExtendedWord
  replacements: ExtendedWord[]
}

const DETERMINERS = new Set([
  "새",
  "헌",
  "옛",
  "첫",
  "온",
  "한",
  "각",
  "모든",
  "어떤",
  "이",
  "그",
  "저",
])

const ADJECTIVES = new Set([
  "맑다",
  "고요하다",
  "아름답다",
  "곱다",
  "그윽하다",
  "날렵하다",
  "넉넉하다",
  "다르다",
  "드넓다",
  "부드럽다",
  "싱그럽다",
  "조용하다",
  "차갑다",
  "크다",
  "파랗다",
  "풍성하다",
  "희다",
])

const FALLBACK_WORDS: ExtendedWord[] = [
  { id: -1, word: "맑다", rawWord: null, isMultiMeaning: true, partOfSpeech: "형용사", meaning: "액체에 불순물이 없어 투명하다." },
  { id: -2, word: "고요하다", rawWord: null, isMultiMeaning: false, partOfSpeech: "형용사", meaning: "아무 소리도 들리지 않다." },
  { id: -3, word: "아름답다", rawWord: null, isMultiMeaning: false, partOfSpeech: "형용사", meaning: "보기에 좋을 만큼 생김새가 훌륭하다." },
  { id: -4, word: "곱다", rawWord: null, isMultiMeaning: true, partOfSpeech: "형용사", meaning: "생김새가 아름답고 예쁘다." },
  { id: -5, word: "그윽하다", rawWord: null, isMultiMeaning: false, partOfSpeech: "형용사", meaning: "깊고 아늑한 느낌이 있다." },
  { id: -6, word: "날렵하다", rawWord: null, isMultiMeaning: false, partOfSpeech: "형용사", meaning: "몸매나 모양이 날씬하고 빠르다." },
  { id: -7, word: "넉넉하다", rawWord: null, isMultiMeaning: false, partOfSpeech: "형용사", meaning: "모자람이 없이 충분하다." },
  { id: -8, word: "다르다", rawWord: null, isMultiMeaning: false, partOfSpeech: "형용사", meaning: "비교하는 두 대상이 서로 같지 않다." },
  { id: -9, word: "살다", rawWord: null, isMultiMeaning: true, partOfSpeech: "동사", meaning: "생명을 지니고 있다." },
  { id: -10, word: "가다", rawWord: null, isMultiMeaning: true, partOfSpeech: "동사", meaning: "한 곳에서 다른 곳으로 장소를 이동하다." },
  { id: -11, word: "걷다", rawWord: null, isMultiMeaning: true, partOfSpeech: "동사", meaning: "발을 번갈아 옮겨 놓으며 움직이다." },
  { id: -12, word: "나다", rawWord: null, isMultiMeaning: true, partOfSpeech: "동사", meaning: "없던 것이 새로 생기다." },
  { id: -13, word: "놓다", rawWord: null, isMultiMeaning: true, partOfSpeech: "동사", meaning: "손에 쥐었던 것을 내려 두다." },
  { id: -14, word: "듣다", rawWord: null, isMultiMeaning: true, partOfSpeech: "동사", meaning: "귀로 소리를 느끼다." },
  { id: -15, word: "보다", rawWord: null, isMultiMeaning: true, partOfSpeech: "동사", meaning: "눈으로 대상을 인식하다." },
  { id: -16, word: "새", rawWord: null, isMultiMeaning: true, partOfSpeech: "관형사", meaning: "지금까지 없던 처음의." },
  { id: -17, word: "첫", rawWord: null, isMultiMeaning: false, partOfSpeech: "관형사", meaning: "맨 처음의." },
  { id: -18, word: "옛", rawWord: null, isMultiMeaning: false, partOfSpeech: "관형사", meaning: "이전의, 예전의." },
  { id: -19, word: "온", rawWord: null, isMultiMeaning: true, partOfSpeech: "관형사", meaning: "전부의." },
  { id: -20, word: "한", rawWord: null, isMultiMeaning: true, partOfSpeech: "관형사", meaning: "하나의, 어떤." },
]

function normalizeWord(word: string): string {
  return word.replace(/\.+$/, "").trim()
}

function detectPartOfSpeech(word: string): PosType | null {
  if (ADJECTIVES.has(word)) return "형용사"
  if (word.endsWith("다")) return "동사"
  if (DETERMINERS.has(word)) return "관형사"
  return null
}

function appearsInSentence(sentence: string, word: string, pos: PosType): boolean {
  if (pos === "동사" || pos === "형용사") {
    const stem = word.replace(/다$/, "")
    return stem.length > 0 && (sentence.includes(stem) || sentence.includes(word))
  }
  return sentence.includes(word)
}

function findReplacements(
  word: ExtendedWord,
  allWords: ExtendedWord[],
  limit = 5,
): ExtendedWord[] {
  return allWords
    .filter((w) => w.id !== word.id && w.partOfSpeech === word.partOfSpeech)
    .slice(0, limit)
}

export function SentenceAnalyzer() {
  const [sentence, setSentence] = useState("")
  const [results, setResults] = useState<MatchedWord[]>([])
  const [analyzed, setAnalyzed] = useState(false)
  const [words, setWords] = useState<KoreanWord[]>([])

  useEffect(() => {
    let isMounted = true

    const fetchWords = async () => {
      const cached = localStorage.getItem(WORDS_CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached) as KoreanWord[]
        if (isMounted) setWords(parsed)
        return
      }

      const response = await fetch("/api/words", { cache: "no-store" })
      if (!response.ok) return

      const data = (await response.json()) as { words: KoreanWord[] }
      if (isMounted) {
        setWords(data.words ?? [])
      }
    }

    void fetchWords()

    return () => {
      isMounted = false
    }
  }, [])

  const analyzerWords = useMemo(() => {
    const dedup = new Map<string, ExtendedWord>()

    for (const word of words) {
      const normalized = normalizeWord(word.word)
      if (!normalized) continue

      const partOfSpeech = detectPartOfSpeech(normalized)
      if (!partOfSpeech) continue
      if (dedup.has(normalized)) continue

      dedup.set(normalized, {
        ...word,
        word: normalized,
        partOfSpeech,
      })
    }

    for (const fallback of FALLBACK_WORDS) {
      if (!dedup.has(fallback.word)) {
        dedup.set(fallback.word, fallback)
      }
    }

    return Array.from(dedup.values())
  }, [words])

  const analyzeSentence = () => {
    if (!sentence.trim()) return

    const matches: MatchedWord[] = []

    for (const wordData of analyzerWords) {
      if (!appearsInSentence(sentence, wordData.word, wordData.partOfSpeech)) continue

      const replacements = findReplacements(wordData, analyzerWords, 5)
      if (replacements.length > 0) {
        matches.push({
          original: wordData.word,
          wordData,
          replacements,
        })
      }
    }

    const uniqueMatches = matches.filter(
      (m, i, arr) => arr.findIndex((x) => x.original === m.original) === i,
    )

    setResults(uniqueMatches)
    setAnalyzed(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      analyzeSentence()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          문장을 입력하면, 문장 속 동사/형용사/관형사 중 데이터에서 대체 가능한 단어를 제안합니다.
        </label>
        <div className="flex gap-2">
          <Input
            placeholder="예: 새로운 길을 가다."
            value={sentence}
            onChange={(e) => {
              setSentence(e.target.value)
              setAnalyzed(false)
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-card"
          />
          <button
            onClick={analyzeSentence}
            className="flex items-center gap-2 rounded-lg bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <Sparkles className="h-4 w-4" />
            분석
          </button>
        </div>
      </div>

      {analyzed && results.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-muted-foreground">
            문장에서 대체 가능한 동사/형용사/관형사를 찾지 못했습니다.
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            다른 문장을 입력해 보세요. (예: 새로운 길을 가다)
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{results.length}</span>개의 대체 가능한 단어를 찾았습니다.
          </p>

          {results.map((match, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <a
                  href={getNaverDictUrl(match.original)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-foreground transition-colors hover:text-primary"
                >
                  {match.original}
                </a>
                <Badge variant="secondary" className="text-xs">
                  {match.wordData.partOfSpeech}
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">대체 가능한 단어</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {match.replacements.map((rep, j) => (
                  <a
                    key={j}
                    href={getNaverDictUrl(rep.word)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2.5 transition-all hover:border-primary hover:shadow-sm"
                  >
                    <Repeat2 className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-foreground transition-colors group-hover:text-primary">
                      {rep.word}
                    </span>
                    {rep.meaning && (
                      <span className="max-w-48 truncate text-xs text-muted-foreground">
                        {rep.meaning}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!analyzed && (
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-5">
          <p className="mb-3 text-sm font-medium text-foreground">예시 문장:</p>
          <div className="flex flex-col gap-2">
            {[
              "물이 맑고 고요한 곳에서 살다.",
              "새로운 길을 걸으며 하늘을 보다.",
            ].map((ex, i) => (
              <button
                key={i}
                onClick={() => {
                  setSentence(ex)
                  setAnalyzed(false)
                }}
                className="rounded-md px-3 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              >
                {`"${ex}"`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
