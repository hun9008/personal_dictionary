export interface KoreanWord {
  id: number
  word: string
  rawWord: string | null
  isMultiMeaning: boolean
}

// 초성 추출 함수
const CHOSUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]

export function getChosung(char: string): string {
  const code = char.charCodeAt(0) - 0xac00
  if (code < 0 || code > 11171) return ''
  return CHOSUNG[Math.floor(code / 588)]
}

export function getChosungGroup(word: string): string {
  if (!word || word.length === 0) return ''
  return getChosung(word[0])
}

// ㄱㄴㄷ 순으로 정렬
export function sortByKorean(words: KoreanWord[]): KoreanWord[] {
  return [...words].sort((a, b) => a.word.localeCompare(b.word, 'ko'))
}

// 초성별 그룹핑
export function groupByChosung(words: KoreanWord[]): Record<string, KoreanWord[]> {
  const groups: Record<string, KoreanWord[]> = {}
  const sorted = sortByKorean(words)

  for (const word of sorted) {
    const chosung = getChosungGroup(word.word)
    if (!chosung) continue

    if (!groups[chosung]) {
      groups[chosung] = []
    }
    groups[chosung].push(word)
  }

  return groups
}

// 다의어만 필터
export function getMultiMeaningWords(words: KoreanWord[]): KoreanWord[] {
  return words.filter((w) => w.isMultiMeaning)
}

// 네이버 사전 검색 URL
export function getNaverDictUrl(word: string): string {
  return `https://ko.dict.naver.com/#/search?query=${encodeURIComponent(word)}`
}
