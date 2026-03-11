import { NextResponse } from "next/server"

export const runtime = "nodejs"

interface WikiPage {
  title?: string
  extract?: string
}

interface WikiApiResponse {
  query?: {
    pages?: Record<string, WikiPage>
  }
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function cleanText(input: string): string {
  return input
    .replace(/\[\d+\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/==+[^=]+==+/g, " ")
    .replace(/["'`~^_*#<>|{}\\[\\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

function buildBigramMap(tokens: string[]): Map<string, string[]> {
  const transitions = new Map<string, string[]>()

  for (let i = 0; i < tokens.length - 1; i += 1) {
    const current = tokens[i]
    const next = tokens[i + 1]

    if (!transitions.has(current)) {
      transitions.set(current, [])
    }

    transitions.get(current)?.push(next)
  }

  return transitions
}

function selectStartTokens(tokens: string[]): string[] {
  return tokens.filter((token) => /^[A-Za-z0-9가-힣]/.test(token))
}

function finalizeSentence(raw: string): string {
  const normalized = raw
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim()

  if (!normalized) return ""

  if (/[.!?]$/.test(normalized)) {
    return normalized
  }

  return `${normalized}.`
}

function generateByRandomWalk(tokens: string[]): string {
  if (tokens.length < 30) {
    throw new Error("토큰 수 부족")
  }

  const starts = selectStartTokens(tokens)
  if (starts.length === 0) {
    throw new Error("시작 토큰 없음")
  }

  const transitions = buildBigramMap(tokens)
  const length = 10 + Math.floor(Math.random() * 9)

  const generated: string[] = []
  let current = pickRandom(starts)

  generated.push(current)

  for (let i = 1; i < length; i += 1) {
    const candidates = transitions.get(current)
    if (!candidates || candidates.length === 0) {
      current = pickRandom(starts)
      generated.push(current)
      continue
    }

    current = pickRandom(candidates)
    generated.push(current)

    if (/[.!?]$/.test(current) && i >= 6) {
      break
    }
  }

  return finalizeSentence(generated.join(" "))
}

async function fetchRandomWikiText(): Promise<{ title: string; text: string }> {
  const endpoint = new URL("https://ko.wikipedia.org/w/api.php")
  endpoint.searchParams.set("action", "query")
  endpoint.searchParams.set("format", "json")
  endpoint.searchParams.set("generator", "random")
  endpoint.searchParams.set("grnnamespace", "0")
  endpoint.searchParams.set("grnlimit", "1")
  endpoint.searchParams.set("prop", "extracts")
  endpoint.searchParams.set("explaintext", "1")
  endpoint.searchParams.set("exsectionformat", "plain")

  const response = await fetch(endpoint, {
    method: "GET",
    cache: "no-store",
    headers: {
      "User-Agent": "personal-dictionary-random-gen/1.0",
    },
  })

  if (!response.ok) {
    throw new Error(`Wikipedia API 호출 실패 (${response.status})`)
  }

  const payload = (await response.json()) as WikiApiResponse
  const pages = payload.query?.pages

  if (!pages) {
    throw new Error("위키백과 응답에 페이지가 없습니다.")
  }

  const page = Object.values(pages).find((item) => Boolean(item.extract?.trim()))

  if (!page?.title || !page.extract) {
    throw new Error("유효한 문서 본문을 찾지 못했습니다.")
  }

  return {
    title: page.title,
    text: cleanText(page.extract),
  }
}

export async function GET() {
  try {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const wiki = await fetchRandomWikiText()
        const tokens = tokenize(wiki.text)
        const sentence = generateByRandomWalk(tokens)

        if (sentence.length >= 12) {
          return NextResponse.json({
            sentence,
            sourceTitle: wiki.title,
          })
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("알 수 없는 오류")
      }
    }

    const message = lastError?.message ?? "랜덤 문장을 생성하지 못했습니다."
    return NextResponse.json({ message }, { status: 500 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "랜덤 문장을 생성하지 못했습니다."
    return NextResponse.json({ message }, { status: 500 })
  }
}
