import { useState } from 'react';
import type { VideoResult, VideoResultSuccess, TranscriptSegment } from '../types';
import StatusBadge from './StatusBadge';
import { SingleExportButtons } from './ExportButtons';
import TrainingExportPanel from './TrainingExportPanel';

// ─── Transcript tab ──────────────────────────────────────────────────────────

function TranscriptView({ segments }: { segments: TranscriptSegment[] }) {
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? segments.filter((s) => s.text.toLowerCase().includes(query.toLowerCase()))
    : segments;

  function formatTime(ms: number): string {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function highlight(text: string) {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="rounded bg-yellow-200 px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search transcript..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field pl-9 py-2 text-xs"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={showTimestamps}
            onChange={(e) => setShowTimestamps(e.target.checked)}
            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          Timestamps
        </label>
      </div>

      {query && (
        <p className="text-xs text-gray-500">
          {filtered.length} / {segments.length} lines match
        </p>
      )}

      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
        {showTimestamps ? (
          <div className="space-y-1.5">
            {filtered.map((seg, i) => (
              <div key={i} className="flex gap-3">
                <span className="shrink-0 font-mono text-xs text-gray-400 pt-0.5">
                  {formatTime(seg.offset)}
                </span>
                <span>{highlight(seg.text)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>
            {filtered
              .map((s) => highlight(s.text))
              .reduce<React.ReactNode[]>((acc, node, i) => [...acc, i > 0 ? ' ' : '', node], [])}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

type Tab = 'transcript' | 'training';

const TABS: { id: Tab; label: string }[] = [
  { id: 'transcript', label: 'Transcript' },
  { id: 'training', label: 'Training Data' },
];

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 w-fit">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            active === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Success body ─────────────────────────────────────────────────────────────

function SuccessBody({ result }: { result: VideoResultSuccess }) {
  const [tab, setTab] = useState<Tab>('transcript');

  return (
    <div className="space-y-4">
      <TabBar active={tab} onChange={setTab} />

      {tab === 'transcript' && <TranscriptView segments={result.transcript} />}

      {tab === 'training' && <TrainingExportPanel result={result} />}

      {tab !== 'training' && (
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {result.transcript.length} segments · lang: {result.language}
          </span>
          <SingleExportButtons result={result} />
        </div>
      )}
    </div>
  );
}

// ─── Main accordion ───────────────────────────────────────────────────────────

interface VideoAccordionProps {
  result: VideoResult;
  defaultOpen?: boolean;
}

export default function VideoAccordion({ result, defaultOpen = false }: VideoAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <StatusBadge status={result.success ? 'success' : 'error'} />
          <span className="truncate text-sm font-medium text-gray-900">
            {result.title || result.videoId}
          </span>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-red-600 hover:underline"
          >
            {result.url}
          </a>

          {result.success ? (
            <SuccessBody result={result} />
          ) : (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
