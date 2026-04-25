import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';
import { TranscriptSegment } from '../types';

// Schema for AI-extracted transcript data
const transcriptSchema = z.object({
  title: z.string().describe('The title of the YouTube video'),
  segments: z
    .array(
      z.object({
        text: z.string().describe('The spoken text for this segment'),
        timestamp: z
          .string()
          .optional()
          .describe('Timestamp in M:SS or H:MM:SS format, if visible'),
      })
    )
    .describe('Transcript segments in chronological order'),
});

type TranscriptExtract = z.infer<typeof transcriptSchema>;

function parseTimestampToMs(ts: string): number {
  const parts = ts.split(':').map(Number);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return ((h * 3600) + (m * 60) + s) * 1000;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return ((m * 60) + s) * 1000;
  }
  return 0;
}

function toTranscriptSegments(segments: TranscriptExtract['segments']): TranscriptSegment[] {
  return segments.map((seg, i) => ({
    text: seg.text.trim(),
    offset: seg.timestamp ? parseTimestampToMs(seg.timestamp) : i * 5000,
    duration: 5000, // estimated — Firecrawl doesn't give precise durations
  }));
}

// JS injected into the YouTube page to click "Show transcript" before Firecrawl scrapes
const REVEAL_TRANSCRIPT_SCRIPT = `
(function() {
  // Try the direct "Show transcript" button first (appears in description area)
  const allButtons = Array.from(document.querySelectorAll('button, [role="button"]'));
  const transcriptBtn = allButtons.find(el => {
    const label = (el.getAttribute('aria-label') || el.textContent || '').toLowerCase();
    return label.includes('transcript');
  });
  if (transcriptBtn) {
    transcriptBtn.click();
    return 'clicked';
  }
  // Fallback: open the "More actions" (...) menu which contains "Open transcript"
  const moreBtn = document.querySelector('button[aria-label="More actions"]');
  if (moreBtn) { moreBtn.click(); return 'more-menu'; }
  return 'not-found';
})();
`;

export interface FirecrawlTranscriptResult {
  title: string;
  segments: TranscriptSegment[];
}

export async function fetchTranscriptViaFirecrawl(
  videoUrl: string
): Promise<FirecrawlTranscriptResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY is not configured.');
  }

  const app = new FirecrawlApp({ apiKey });

  const result = await app.scrape(videoUrl, {
    formats: [
      {
        type: 'json',
        schema: transcriptSchema,
        prompt:
          'Extract the complete video transcript from this YouTube page. ' +
          'The transcript panel may have been opened — look for the list of timestamped captions/subtitles on the right side of the page or in the description area. ' +
          'Return every spoken segment in order. If no transcript is visible, return an empty segments array.',
      },
    ],
    actions: [
      // Let YouTube load fully before interacting
      { type: 'wait', milliseconds: 3000 },
      // Inject JS to click the transcript button
      { type: 'executeJavascript', script: REVEAL_TRANSCRIPT_SCRIPT },
      // Wait for the transcript panel to animate open
      { type: 'wait', milliseconds: 2500 },
      // Final scrape with transcript panel open
      { type: 'scrape' },
    ],
    proxy: 'stealth',   // bypass bot-detection on YouTube
    timeout: 60_000,
    mobile: false,
  });

  const extracted = result.json as TranscriptExtract | undefined;

  if (!extracted || !extracted.segments || extracted.segments.length === 0) {
    throw new Error('Firecrawl could not find a transcript for this video.');
  }

  return {
    title: extracted.title ?? '',
    segments: toTranscriptSegments(extracted.segments),
  };
}
