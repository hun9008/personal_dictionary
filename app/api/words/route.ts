import { NextResponse } from 'next/server'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { pool } from '@/lib/mysql'
import { syncWordTableFromWordLine } from '@/lib/word-sync'

export const runtime = 'nodejs'

interface WordRow extends RowDataPacket {
  id: number
  word: string
  raw_word: string | null
  multi_meaning: number
}

interface PostBody {
  word?: string
  isMultiMeaning?: boolean
}

export async function GET() {
  try {
    await syncWordTableFromWordLine()

    const [rows] = await pool.query<WordRow[]>(
      `
      SELECT id, word, raw_word, multi_meaning
      FROM word
      ORDER BY word ASC
      `,
    )

    const words = rows.map((row) => ({
      id: row.id,
      word: row.word,
      rawWord: row.raw_word,
      isMultiMeaning: row.multi_meaning === 1,
    }))

    return NextResponse.json({ words })
  } catch (error) {
    console.error('Failed to load words from MySQL:', error)
    return NextResponse.json(
      { message: '단어 데이터를 불러오지 못했습니다.' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const connection = await pool.getConnection()

  try {
    const body = (await request.json()) as PostBody

    const inputWord = (body.word ?? '').trim()
    if (!inputWord) {
      return NextResponse.json(
        { message: '단어를 입력해 주세요.' },
        { status: 400 },
      )
    }

    const dotted = body.isMultiMeaning ? 1 : 0
    const baseWord = inputWord.replace(/\.+$/, '').trim()
    const rawWord = dotted === 1 ? `${baseWord}.` : inputWord
    const wordNorm = dotted === 1 ? baseWord : inputWord

    if (!wordNorm) {
      return NextResponse.json(
        { message: '정규화된 단어가 비어 있습니다.' },
        { status: 400 },
      )
    }

    await connection.beginTransaction()

    await connection.execute(
      `
      INSERT INTO word_line (raw_word, word_norm, dotted)
      VALUES (?, ?, ?)
      `,
      [rawWord, wordNorm, dotted],
    )

    const [wordResult] = await connection.execute<ResultSetHeader>(
      `
      INSERT INTO word (word, multi_meaning, raw_word)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        id = LAST_INSERT_ID(id),
        multi_meaning = VALUES(multi_meaning),
        raw_word = VALUES(raw_word)
      `,
      [wordNorm, dotted, rawWord],
    )

    const wordId = wordResult.insertId
    if (!wordId) {
      throw new Error('Failed to resolve word id')
    }

    await connection.commit()

    return NextResponse.json({
      word: {
        id: wordId,
        word: wordNorm,
        rawWord,
        isMultiMeaning: dotted === 1,
      },
    })
  } catch (error) {
    await connection.rollback()
    console.error('Failed to insert word into MySQL:', error)
    const message = error instanceof Error
      ? `단어를 추가하지 못했습니다. (${error.message})`
      : '단어를 추가하지 못했습니다.'
    return NextResponse.json(
      { message },
      { status: 500 },
    )
  } finally {
    connection.release()
  }
}
