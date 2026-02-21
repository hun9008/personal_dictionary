import { pool } from '@/lib/mysql'

export async function syncWordTableFromWordLine(): Promise<void> {
  await pool.execute(
    `
    INSERT INTO word (word, multi_meaning, raw_word)
    SELECT
      wl.word_norm AS word,
      MAX(wl.dotted) AS multi_meaning,
      MAX(wl.raw_word) AS raw_word
    FROM word_line wl
    GROUP BY wl.word_norm
    ON DUPLICATE KEY UPDATE
      multi_meaning = VALUES(multi_meaning),
      raw_word = VALUES(raw_word)
    `,
  )
}
