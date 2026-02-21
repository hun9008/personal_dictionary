"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Filter, ArrowUp } from "lucide-react"
import { getChosungGroup, groupByChosung, getMultiMeaningWords, sortByKorean } from "@/lib/korean-data"
import type { KoreanWord } from "@/lib/korean-data"
import { WordCard } from "@/components/word-card"
import { Input } from "@/components/ui/input"

const CHOSUNG_LIST = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
const WORDS_CACHE_KEY = "vocab_words_cache_v1"
const INITIAL_VISIBLE_COUNT = 100
const VISIBLE_STEP = 100

type FilterMode = 'all' | 'multiMeaning'

export function WordList() {
  const [words, setWords] = useState<KoreanWord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [activeChosung, setActiveChosung] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newWord, setNewWord] = useState('')
  const [newWordMultiMeaning, setNewWordMultiMeaning] = useState(false)
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const syncWords = (nextWords: KoreanWord[]) => {
    setWords(nextWords)
    localStorage.setItem(WORDS_CACHE_KEY, JSON.stringify(nextWords))
  }

  useEffect(() => {
    let isMounted = true

    const fetchWords = async () => {
      try {
        setLoading(true)
        setError(null)

        const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
        if (navigationEntry?.type === "reload") {
          localStorage.removeItem(WORDS_CACHE_KEY)
        }

        const cached = localStorage.getItem(WORDS_CACHE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached) as KoreanWord[]
          if (isMounted) {
            setWords(parsed)
            setLoading(false)
          }
          return
        }

        const response = await fetch('/api/words', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('단어 목록 조회 실패')
        }

        const data = (await response.json()) as { words: KoreanWord[] }
        if (isMounted) {
          syncWords(data.words ?? [])
        }
      } catch (e) {
        localStorage.removeItem(WORDS_CACHE_KEY)
        if (isMounted) {
          setError(e instanceof Error ? e.message : '알 수 없는 오류')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchWords()

    return () => {
      isMounted = false
    }
  }, [])

  const sortedWords = useMemo(() => sortByKorean(words), [words])
  const multiMeaningWords = useMemo(() => getMultiMeaningWords(sortedWords), [sortedWords])

  const filteredWords = useMemo(() => {
    let filtered = filterMode === 'multiMeaning' ? multiMeaningWords : sortedWords

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter((w) => {
        const raw = (w.rawWord ?? '').toLowerCase()
        return w.word.toLowerCase().includes(q) || raw.includes(q)
      })
    }

    return filtered
  }, [filterMode, multiMeaningWords, searchQuery, sortedWords])

  const groupedAll = useMemo(() => groupByChosung(filteredWords), [filteredWords])

  const availableChosung = useMemo(() => {
    return CHOSUNG_LIST.filter((c) => groupedAll[c] && groupedAll[c].length > 0)
  }, [groupedAll])

  const scopedWords = useMemo(() => {
    if (!activeChosung) return filteredWords
    return filteredWords.filter((w) => getChosungGroup(w.word) === activeChosung)
  }, [activeChosung, filteredWords])

  const visibleWords = useMemo(
    () => scopedWords.slice(0, visibleCount),
    [scopedWords, visibleCount],
  )

  const groupedVisible = useMemo(() => groupByChosung(visibleWords), [visibleWords])

  const displayGroups = activeChosung
    ? { [activeChosung]: groupedVisible[activeChosung] || [] }
    : groupedVisible

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT)
  }, [activeChosung, filterMode, searchQuery])

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 240)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleAddWord = async () => {
    const word = newWord.trim()
    if (!word || adding) return

    try {
      setAdding(true)
      setMutationError(null)

      const response = await fetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, isMultiMeaning: newWordMultiMeaning }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message ?? '단어 추가 실패')
      }

      const inserted = data.word as KoreanWord
      syncWords([...words, inserted])
      setNewWord('')
      setNewWordMultiMeaning(false)
      setIsAddModalOpen(false)
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : '단어 추가 중 오류가 발생했습니다.')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteWord = async (word: KoreanWord) => {
    if (deletingId !== null) return
    const ok = window.confirm(`정말 삭제하시겠습니까?\n삭제 단어: ${word.word}`)
    if (!ok) return

    try {
      setDeletingId(word.id)
      setMutationError(null)

      const response = await fetch(`/api/words/${word.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message ?? '단어 삭제 실패')
      }

      syncWords(words.filter((w) => w.id !== word.id))
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : '단어 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="단어 또는 원문 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-card pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => setFilterMode('all')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filterMode === 'all'
                ? 'bg-foreground text-background'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            전체 ({words.length})
          </button>
          <button
            onClick={() => setFilterMode('multiMeaning')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filterMode === 'multiMeaning'
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            다의어 ({multiMeaningWords.length})
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="ml-auto rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            새 단어 추가
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveChosung(null)}
            className={`h-9 w-9 rounded-md text-sm font-medium transition-colors ${
              activeChosung === null
                ? 'bg-foreground text-background'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            ALL
          </button>
          {CHOSUNG_LIST.map((c) => {
            const hasWords = availableChosung.includes(c)
            return (
              <button
                key={c}
                onClick={() => hasWords && setActiveChosung(activeChosung === c ? null : c)}
                disabled={!hasWords}
                className={`h-9 w-9 rounded-md text-sm font-medium transition-colors ${
                  activeChosung === c
                    ? 'bg-foreground text-background'
                    : hasWords
                      ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      : 'cursor-not-allowed bg-muted text-muted-foreground/40'
                }`}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>

      {loading && (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          단어 데이터를 불러오는 중입니다...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {mutationError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
          {mutationError}
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="text-sm text-muted-foreground">
            총 <span className="font-semibold text-foreground">{filteredWords.length}</span>개의 단어
            <span className="ml-2 text-muted-foreground/70">
              (표시: {Math.min(visibleCount, scopedWords.length)} / {scopedWords.length})
            </span>
          </p>

          <div className="flex flex-col gap-8">
            {Object.entries(displayGroups).map(([chosung, groupWords]) => {
              if (!groupWords || groupWords.length === 0) return null
              return (
                <section key={chosung} id={`chosung-${chosung}`}>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-lg font-bold text-background">
                      {chosung}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">{groupWords.length}개</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {groupWords.map((word) => (
                      <WordCard
                        key={word.id}
                        word={word}
                        onDelete={handleDeleteWord}
                        deleting={deletingId === word.id}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>

          {filteredWords.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium text-muted-foreground">검색 결과가 없습니다</p>
              <p className="mt-1 text-sm text-muted-foreground/70">다른 키워드로 검색해 보세요.</p>
            </div>
          )}

          {scopedWords.length > visibleCount && (
            <div className="flex justify-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + VISIBLE_STEP)}
                className="rounded-lg border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                더 보기 (+{VISIBLE_STEP})
              </button>
            </div>
          )}

          {showScrollTop && (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="fixed bottom-6 right-6 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:bg-muted"
              aria-label="최상단으로 이동"
              title="최상단으로 이동"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          )}
        </>
      )}

      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !adding && setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-foreground">새 단어 추가</h3>
            <p className="mt-1 text-sm text-muted-foreground">단어와 다의어 여부를 입력해 추가합니다.</p>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">단어</label>
                <Input
                  placeholder="추가할 단어 입력"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleAddWord()
                    }
                  }}
                  className="bg-background"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">다의어 여부</label>
                <select
                  value={newWordMultiMeaning ? 'true' : 'false'}
                  onChange={(e) => setNewWordMultiMeaning(e.target.value === 'true')}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="false">아니오</option>
                  <option value="true">예</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                disabled={adding}
                className="h-10 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={() => void handleAddWord()}
                disabled={adding || !newWord.trim()}
                className="h-10 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
