import { useState } from 'react';
import type { VideoResult, PlaylistTranscriptResponse } from '../types';
import {
  downloadSingleAsTxt,
  downloadSingleAsJson,
  downloadPlaylistAsTxt,
  downloadPlaylistAsJson,
  getVideoPlainText,
  copyToClipboard,
} from '../utils/exportUtils';

interface SingleExportProps {
  result: VideoResult;
}

interface PlaylistExportProps {
  data: PlaylistTranscriptResponse;
}

function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API may be unavailable in non-secure contexts
    }
  };

  return (
    <button onClick={handleCopy} className="btn-secondary text-xs">
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

export function SingleExportButtons({ result }: SingleExportProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <CopyButton getText={() => getVideoPlainText(result)} />
      <button onClick={() => downloadSingleAsTxt(result)} className="btn-secondary text-xs">
        ↓ .txt
      </button>
      <button onClick={() => downloadSingleAsJson(result)} className="btn-secondary text-xs">
        ↓ .json
      </button>
    </div>
  );
}

export function PlaylistExportButtons({ data }: PlaylistExportProps) {
  const allText = data.results.map(getVideoPlainText).join('\n\n' + '─'.repeat(60) + '\n\n');
  return (
    <div className="flex flex-wrap gap-2">
      <CopyButton getText={() => allText} />
      <button onClick={() => downloadPlaylistAsTxt(data)} className="btn-secondary text-xs">
        ↓ All .txt
      </button>
      <button onClick={() => downloadPlaylistAsJson(data)} className="btn-secondary text-xs">
        ↓ All .json
      </button>
    </div>
  );
}
