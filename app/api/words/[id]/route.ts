import { NextResponse } from 'next/server'
import type { RowDataPacket } from 'mysql2'
import { pool } from '@/lib/mysql'

export const runtime = 'nodejs'

interface WordRow extends RowDataPacket {
  id: number
  word: string
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const connection = await pool.getConnection()

  try {
    const { id } = await params
    const wordId = Number(id)

    if (!Number.isFinite(wordId) || wordId <= 0) {
      return NextResponse.json({ message: '유효하지 않은 id입니다.' }, { status: 400 })
    }

    await connection.beginTransaction()

    const [rows] = await connection.query<WordRow[]>(
      `
      SELECT id, word
      FROM word
      WHERE id = ?
      LIMIT 1
      `,
      [wordId],
    )

    if (rows.length === 0) {
      await connection.rollback()
      return NextResponse.json({ message: '삭제할 단어를 찾지 못했습니다.' }, { status: 404 })
    }

    const targetWord = rows[0].word

    await connection.execute(
      `
      DELETE FROM word
      WHERE id = ?
      `,
      [wordId],
    )

    await connection.execute(
      `
      DELETE FROM word_line
      WHERE word_norm = ?
      `,
      [targetWord],
    )

    await connection.commit()

    return NextResponse.json({ ok: true })
  } catch (error) {
    await connection.rollback()
    console.error('Failed to delete word from MySQL:', error)
    return NextResponse.json({ message: '단어를 삭제하지 못했습니다.' }, { status: 500 })
  } finally {
    connection.release()
  }
}
