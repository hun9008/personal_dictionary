"use client"

import { ExternalLink, Star, Trash2 } from "lucide-react"
import type { KoreanWord } from "@/lib/korean-data"
import { getNaverDictUrl } from "@/lib/korean-data"
import { Badge } from "@/components/ui/badge"

interface WordCardProps {
  word: KoreanWord
  onDelete: (word: KoreanWord) => void
  onToggleFavorite: (word: KoreanWord) => void
  isFavorite?: boolean
  deleting?: boolean
}

export function WordCard({
  word,
  onDelete,
  onToggleFavorite,
  isFavorite = false,
  deleting = false,
}: WordCardProps) {
  const naverUrl = getNaverDictUrl(word.word)

  return (
    <div
      className={`group relative flex flex-col gap-2 rounded-lg border bg-card p-4 transition-all hover:shadow-md ${
        word.isMultiMeaning ? "border-l-4 border-l-accent" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <a
          href={naverUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-lg font-bold text-foreground transition-colors hover:text-primary"
          title="네이버 국어사전에서 검색"
        >
          {word.word}
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </a>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleFavorite(word)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
              isFavorite
                ? "border-amber-300 bg-amber-100 text-amber-600 hover:bg-amber-200"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
            aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          >
            <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {word.isMultiMeaning && (
          <Badge className="bg-accent text-xs font-normal text-accent-foreground">다의어</Badge>
        )}
        {isFavorite && (
          <Badge className="bg-amber-100 text-xs font-normal text-amber-700">즐겨찾기</Badge>
        )}
      </div>

      {word.rawWord && (
        <p className="text-sm leading-relaxed text-muted-foreground">원문: {word.rawWord}</p>
      )}

      <button
        onClick={() => onDelete(word)}
        disabled={deleting}
        className="absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="단어 삭제"
        title="삭제"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
