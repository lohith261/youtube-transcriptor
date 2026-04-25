import { useState, FormEvent } from 'react';
import type { Mode } from '../types';

interface InputSectionProps {
  onSubmit: (url: string, mode: Mode) => void;
  loading: boolean;
}

const PLACEHOLDERS: Record<Mode, string> = {
  single: 'https://www.youtube.com/watch?v=...',
  playlist: 'https://www.youtube.com/playlist?list=...',
};

export default function InputSection({ onSubmit, loading }: InputSectionProps) {
  const [mode, setMode] = useState<Mode>('single');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    onSubmit(trimmed, mode);
  };

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setUrl('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Mode toggle */}
      <div className="flex">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1" role="group">
          {(['single', 'playlist'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                mode === m
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'single' ? 'Single Video' : 'Playlist'}
            </button>
          ))}
        </div>
      </div>

      {/* URL input + button inline */}
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={PLACEHOLDERS[mode]}
          required
          disabled={loading}
          className="input-field flex-1 text-sm"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="btn-primary shrink-0 px-5"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Extracting…
            </>
          ) : (
            'Extract'
          )}
        </button>
      </div>

      {mode === 'playlist' && (
        <p className="text-xs text-gray-400">Processes up to the first 20 videos.</p>
      )}
    </form>
  );
}
