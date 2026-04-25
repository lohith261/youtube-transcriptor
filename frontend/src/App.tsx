import { useTranscript } from './hooks/useTranscript';
import InputSection from './components/InputSection';
import LoadingSpinner from './components/LoadingSpinner';
import { SingleResult, PlaylistResult } from './components/ResultsSection';
import type { Mode } from './types';

const FEATURES = [
  { icon: '📋', label: 'Copy to clipboard' },
  { icon: '📥', label: 'Export .txt / .json' },
  { icon: '🤖', label: 'AI training data' },
];

const EXAMPLES = [
  { label: 'Tech talk', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { label: 'Try a playlist', url: 'https://www.youtube.com/playlist?list=PLbpi6ZahtOH6Ar_3GPy3worksFGiQMgxk' },
];

function EmptyState({ onTry }: { onTry: (url: string, mode: Mode) => void }) {
  return (
    <div className="mt-10 text-center space-y-4">
      <p className="text-sm text-gray-400">Try an example</p>
      <div className="flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.url}
            onClick={() => onTry(ex.url, ex.url.includes('playlist') ? 'playlist' : 'single')}
            className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs text-gray-600 shadow-sm transition hover:border-red-300 hover:text-red-600"
          >
            {ex.label} ↗
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const { loading, error, singleResult, playlistResult, submit } = useTranscript();
  const hasResults = !!(singleResult || playlistResult);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 flex flex-col items-center px-4 pt-16 pb-16">

        {/* Hero */}
        <div className="w-full max-w-2xl space-y-6 text-center">
          {/* Logo + name */}
          <div className="flex items-center justify-center gap-2.5">
            <svg className="h-8 w-8 text-red-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span className="text-lg font-semibold text-gray-700 tracking-tight">YouTube Transcriptor</span>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              Extract YouTube Transcripts
            </h1>
            <p className="text-base text-gray-500">
              Paste a video or playlist URL. Get the full transcript in seconds —<br className="hidden sm:block" />
              copy it, export it, or turn it into AI training data.
            </p>
          </div>

          {/* Feature chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {FEATURES.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 shadow-sm"
              >
                <span>{f.icon}</span>
                {f.label}
              </span>
            ))}
          </div>

          {/* Form card */}
          <div className="card p-5 text-left">
            <InputSection onSubmit={submit} loading={loading} />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2 text-left">
              <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && <LoadingSpinner message="Extracting transcript…" />}

          {/* Results */}
          {!loading && singleResult && <SingleResult result={singleResult} />}
          {!loading && playlistResult && <PlaylistResult data={playlistResult} />}

          {/* Empty state */}
          {!loading && !hasResults && !error && (
            <EmptyState onTry={(url, mode) => submit(url, mode)} />
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 py-5 text-center text-xs text-gray-400">
        Transcripts sourced from YouTube's caption system · Supports videos &amp; playlists
      </footer>
    </div>
  );
}
