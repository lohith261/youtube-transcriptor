import type { TranscriptSegment } from '../types';

export interface SpeakerTurn {
  speakerId: number; // 1-based, alternates per gap
  label: string;     // "SPEAKER 1", "SPEAKER 2", ...
  segments: TranscriptSegment[];
  startOffset: number;
  endOffset: number;
  text: string;
}

// Minimum silence gap (ms) between segments that signals a new speaker turn.
// YouTube auto-captions have ~200ms gaps within a sentence and >800ms across turns.
const DEFAULT_GAP_MS = 1200;

// How many distinct "speaker" slots to cycle through (kept low — 2 works for most interviews)
const SPEAKER_POOL = 2;

export function groupIntoSpeakerTurns(
  segments: TranscriptSegment[],
  gapMs = DEFAULT_GAP_MS
): SpeakerTurn[] {
  if (segments.length === 0) return [];

  const turns: SpeakerTurn[] = [];
  let currentSegs: TranscriptSegment[] = [segments[0]];
  let speakerIndex = 0; // cycles through 0..SPEAKER_POOL-1

  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1];
    const curr = segments[i];
    const gap = curr.offset - (prev.offset + prev.duration);

    if (gap >= gapMs) {
      turns.push(buildTurn(currentSegs, speakerIndex));
      speakerIndex = (speakerIndex + 1) % SPEAKER_POOL;
      currentSegs = [curr];
    } else {
      currentSegs.push(curr);
    }
  }

  // Flush the last turn
  turns.push(buildTurn(currentSegs, speakerIndex));

  return turns;
}

function buildTurn(segs: TranscriptSegment[], speakerIndex: number): SpeakerTurn {
  const text = segs.map((s) => s.text.trim()).join(' ');
  const startOffset = segs[0].offset;
  const last = segs[segs.length - 1];
  const endOffset = last.offset + last.duration;
  return {
    speakerId: speakerIndex + 1,
    label: `SPEAKER ${speakerIndex + 1}`,
    segments: segs,
    startOffset,
    endOffset,
    text,
  };
}

export function formatTimestamp(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
