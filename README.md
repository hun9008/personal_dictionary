# Personal Dictionary

A Next.js (App Router) web application for a personal dictionary workflow.

## Project Purpose

This project was built at the request of an acquaintance as a **personalized dictionary service for writers**.  
The goal is to help writing tasks with faster word lookup, replacement suggestions, and random idea generation.

## Features

- Vocabulary Explorer
  - Browse and search words
  - Filter by Korean initial consonant groups (ㄱ, ㄴ, ㄷ, ...)
  - Highlight and filter polysemous words (marked with `.`)
  - Add and delete words
  - Open Naver Korean Dictionary directly from each word
- Sentence Analyzer
  - Detect candidate verbs/adjectives/determiners in an input sentence
  - Suggest replacement words from the same part of speech (up to 5)
- Random Gen
  - Pick 2 random words from the current word set
  - Generate a fully random sentence via bigram random walk from random Korean Wikipedia pages

## Tech Stack

- Next.js 16.1.6 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- MySQL (`mysql2`)

## Requirements

- Node.js `>= 20.9.0` (recommended: Node 20 LTS)
- npm
- MySQL 8+

## Getting Started

```bash
cd front
npm install
npm run dev
```

Default local server: `http://localhost:3000`

## Environment Variables

Create/update `front/.env` with:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=vocab
MONITOR_PASSWORD=231943
```

Notes:
- These five variables are required by `lib/mysql.ts`.
- Existing embedding-related variables (`EMBEDDING_*`, `KOBERT_*`, `FASTTEXT_*`) are currently not used directly in the active frontend API routes.

## Database

The app uses these tables:

- `word`
  - `id` (PK)
  - `word` (normalized word, UNIQUE recommended)
  - `multi_meaning` (0/1)
  - `raw_word` (original form)
- `word_line`
  - `raw_word`
  - `word_norm`
  - `dotted` (0/1)

`GET /api/words` triggers synchronization from `word_line` to `word`.

## Routes

Pages:
- `/` : Vocabulary Explorer
- `/analyzer` : Sentence Analyzer
- `/random-gen` : Random Gen

API:
- `GET /api/words` : fetch words
- `POST /api/words` : add a word
  - body: `{ "word": string, "isMultiMeaning": boolean }`
- `DELETE /api/words/:id` : delete a word
- `GET /api/random-gen/sentence` : generate a random sentence from Wikipedia-based random walk

## Sentence Analyzer Logic (Current)

1. Load word data and normalize entries (remove trailing `.`).
2. Infer part of speech with rule-based heuristics:
   - adjective lexicon match -> adjective
   - ends with `다` -> verb
   - determiner lexicon match -> determiner
3. Detect candidates in the input sentence by inclusion checks:
   - verbs/adjectives: stem (`다` removed) or base form
   - determiners: exact token inclusion
4. Suggest replacements from words with the same part of speech,
   excluding itself, up to 5 results.

## Troubleshooting

- `You are using Node.js 18 ... >=20.9.0 required`
  - Upgrade Node.js to 20+ and retry.
- Build fails while fetching Google Fonts
  - In restricted network environments, `next/font/google` downloads may fail.
- `next lint` path-related error
  - Make sure you run commands from the `front/` directory.

## Scripts

```bash
npm run dev    # start dev server
npm run build  # production build
npm run start  # run production server
npm run lint   # lint checks
```
