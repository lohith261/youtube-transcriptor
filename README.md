# YouTube Transcriptor

Extract transcripts from YouTube videos and playlists. Clean React + Tailwind frontend backed by a Node.js + Express API.

---

## Features

- **Single video** — paste any YouTube URL and get the full transcript
- **Playlist** — process up to 20 videos in one request with partial-failure handling
- **Search** — filter transcript lines in-browser
- **Timestamps** — toggle timestamped view per segment
- **Export** — copy to clipboard, download as `.txt` or `.json`
- **Per-video status** — success/failed badge for each video in a playlist

---

## Project Structure

```
YouTube Transcriptor/
├── backend/          Express + TypeScript API
├── frontend/         React + Vite + Tailwind UI
└── shared/           Canonical type definitions (reference)
```

---

## Setup

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### 1. Backend

```bash
cd backend

# Copy and edit env vars
cp .env.example .env

# Install dependencies
npm install

# Start dev server (port 3001, hot-reload)
npm run dev
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (port 5173)
npm run dev
```

Open **http://localhost:5173** in your browser. The Vite dev server proxies `/api` requests to the backend automatically.

---

## Environment Variables

All backend variables go in `backend/.env`.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port the API listens on |
| `NODE_ENV` | `development` | `development` or `production` |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated list of allowed CORS origins |
| `PLAYLIST_LIMIT` | `20` | Maximum videos fetched from a playlist |

---

## API Reference

### `POST /api/transcript/single`

Extract a transcript from a single YouTube video.

**Request**
```json
{ "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "language": "en" }
```

**Response (success)**
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "transcript": [{ "text": "We're no strangers to love", "offset": 18200, "duration": 2160 }],
  "language": "en"
}
```

**Response (failure)**
```json
{ "success": false, "videoId": "...", "title": "", "url": "...", "error": "No transcript available for this video." }
```

### `POST /api/transcript/playlist`

Extract transcripts for all videos in a playlist (up to 20).

**Request**
```json
{ "url": "https://www.youtube.com/playlist?list=PLxxx", "limit": 10 }
```

**Response**
```json
{
  "playlistTitle": "My Playlist",
  "playlistUrl": "...",
  "total": 10,
  "succeeded": 8,
  "failed": 2,
  "results": [ /* array of single-video results */ ]
}
```

### `GET /health`

Returns `{ "status": "ok", "timestamp": "..." }`.

---

## How Transcript Extraction Works

1. The frontend sends a video URL to the backend.
2. `urlParser.ts` extracts the 11-character video ID using regex patterns that cover all known YouTube URL formats.
3. `transcriptService.ts` calls `YoutubeTranscript.fetchTranscript(videoId)` from the [`youtube-transcript`](https://www.npmjs.com/package/youtube-transcript) package, which queries YouTube's internal timedtext/InnerTube API — the same endpoint the YouTube player uses to display captions.
4. The raw segments (`{ text, offset, duration }`) are returned as-is so the frontend can render them plain or timestamped.
5. Errors are classified into user-friendly messages (disabled captions, private video, rate limited, etc.) and returned as `success: false` results — never as HTTP 500s.

For playlists, [`ytpl`](https://www.npmjs.com/package/ytpl) scrapes the playlist page to get video IDs without requiring a YouTube Data API key. Transcript requests run concurrently with a concurrency cap of 3 (via `p-limit`) to avoid hitting YouTube's rate limits.

---

## Running Tests

```bash
cd backend
npm test                  # run all tests
npm run test:coverage     # with coverage report
```

| Suite | Tests |
|---|---|
| `unit/urlParser` | Video ID and playlist ID extraction across all URL formats |
| `unit/transcriptService` | Mocked transcript fetching + error classification |
| `integration/routes` | Supertest against the Express app with mocked services |

---

## Production Build

```bash
# Backend
cd backend && npm run build    # outputs to backend/dist/
node dist/server.js

# Frontend
cd frontend && npm run build   # outputs to frontend/dist/
```

Serve `frontend/dist/` from any static host (Vercel, Nginx, etc.) and point `ALLOWED_ORIGINS` at the deployed origin.

---

## Known Limitations

| Limitation | Detail |
|---|---|
| **Auto-generated captions** | The `youtube-transcript` package can only fetch captions that YouTube has already generated or that the creator uploaded. Videos with no captions at all will return a failure result. |
| **Age-restricted videos** | YouTube blocks unauthenticated transcript requests for age-restricted content. |
| **Private / unlisted videos** | These cannot be accessed without authentication. |
| **Playlist cap** | Playlist processing is hard-capped at 20 videos to avoid long request times and rate-limit issues. Adjust `PLAYLIST_LIMIT` to increase for self-hosted deployments. |
| **ytpl deprecation** | The `ytpl` package is deprecated. It continues to work but may break if YouTube changes its HTML structure. A drop-in replacement is [`@distube/ytpl`](https://www.npmjs.com/package/@distube/ytpl) if issues arise. |
| **Rate limiting** | YouTube may temporarily block the server IP after many rapid requests. The backend rate limiter (30 req/min single, 5 req/min playlist) reduces this risk but does not eliminate it. |
| **Language fallback** | If the requested language is not available, the library throws an error rather than falling back to an available language. |
