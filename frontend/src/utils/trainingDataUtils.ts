import type { TranscriptSegment, VideoResultSuccess } from '../types';
import { groupIntoSpeakerTurns, formatTimestamp } from './speakerUtils';

// ─── helpers ────────────────────────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeName(title: string, videoId: string) {
  return (title || videoId).replace(/[^a-z0-9]/gi, '_').slice(0, 50);
}

// ─── 1. JSONL  ───────────────────────────────────────────────────────────────
// One JSON object per segment — standard fine-tuning input for OpenAI / Mistral / LLaMA.
// Schema: { text, metadata: { video_id, title, url, offset_ms, duration_ms, index } }

export function toJSONL(result: VideoResultSuccess): string {
  return result.transcript
    .map((seg, i) =>
      JSON.stringify({
        text: seg.text.trim(),
        metadata: {
          video_id: result.videoId,
          title: result.title,
          url: result.url,
          offset_ms: seg.offset,
          duration_ms: seg.duration,
          index: i,
        },
      })
    )
    .join('\n');
}

export function downloadJSONL(result: VideoResultSuccess) {
  triggerDownload(toJSONL(result), `${safeName(result.title, result.videoId)}.jsonl`, 'application/jsonl');
}

// ─── 2. Conversation / ChatML  ───────────────────────────────────────────────
// Groups turns into {messages: [{role, content}]} — ready for instruction fine-tuning.
// SPEAKER 1 → "assistant", SPEAKER 2 → "user" (covers typical interview / tutorial layout).
// Each consecutive speaker-pair becomes one training example.

export function toConversationFormat(result: VideoResultSuccess): string {
  const turns = groupIntoSpeakerTurns(result.transcript);

  // Pair up turns into (user, assistant) examples
  const lines: string[] = [];
  for (let i = 0; i < turns.length - 1; i += 2) {
    const userTurn = turns[i];
    const assistantTurn = turns[i + 1];
    const example = {
      messages: [
        { role: 'user', content: userTurn.text },
        { role: 'assistant', content: assistantTurn.text },
      ],
      metadata: { video_id: result.videoId, title: result.title, url: result.url },
    };
    lines.push(JSON.stringify(example));
  }
  return lines.join('\n');
}

export function downloadConversationFormat(result: VideoResultSuccess) {
  triggerDownload(
    toConversationFormat(result),
    `${safeName(result.title, result.videoId)}_chat.jsonl`,
    'application/jsonl'
  );
}

// ─── 3. Q&A Pairs  ──────────────────────────────────────────────────────────
// Adjacent turns treated as instruction → response pairs.
// Format: { instruction, input, output } — Alpaca-style, works with most fine-tuning frameworks.

export function toQAPairs(result: VideoResultSuccess): string {
  const turns = groupIntoSpeakerTurns(result.transcript);

  const lines: string[] = [];
  for (let i = 0; i < turns.length - 1; i += 2) {
    const q = turns[i];
    const a = turns[i + 1];
    const example = {
      instruction: q.text,
      input: '',
      output: a.text,
      metadata: {
        video_id: result.videoId,
        title: result.title,
        url: result.url,
        q_offset_ms: q.startOffset,
        a_offset_ms: a.startOffset,
      },
    };
    lines.push(JSON.stringify(example));
  }
  return lines.join('\n');
}

export function downloadQAPairs(result: VideoResultSuccess) {
  triggerDownload(
    toQAPairs(result),
    `${safeName(result.title, result.videoId)}_qa.jsonl`,
    'application/jsonl'
  );
}

// ─── 4. Plain Segmented Text  ────────────────────────────────────────────────
// ~500-word chunks with timestamps — ideal for embedding models / RAG chunking.
// Each chunk is separated by a blank line.

const TARGET_WORDS_PER_CHUNK = 500;

export function toPlainSegmented(result: VideoResultSuccess): string {
  const segments = result.transcript;
  const header = `# ${result.title}\n# ${result.url}\n\n`;

  const chunks: string[] = [];
  let chunkLines: string[] = [];
  let wordCount = 0;
  let chunkStart: TranscriptSegment | null = null;

  const flushChunk = () => {
    if (chunkLines.length === 0) return;
    const ts = chunkStart ? `[${formatTimestamp(chunkStart.offset)}] ` : '';
    chunks.push(ts + chunkLines.join(' '));
    chunkLines = [];
    wordCount = 0;
    chunkStart = null;
  };

  for (const seg of segments) {
    if (!chunkStart) chunkStart = seg;
    const words = seg.text.trim().split(/\s+/).length;
    chunkLines.push(seg.text.trim());
    wordCount += words;
    if (wordCount >= TARGET_WORDS_PER_CHUNK) flushChunk();
  }
  flushChunk();

  return header + chunks.join('\n\n');
}

export function downloadPlainSegmented(result: VideoResultSuccess) {
  triggerDownload(
    toPlainSegmented(result),
    `${safeName(result.title, result.videoId)}_segmented.txt`,
    'text/plain;charset=utf-8'
  );
}
