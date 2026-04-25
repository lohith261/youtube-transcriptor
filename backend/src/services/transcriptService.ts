import { YoutubeTranscript, YoutubeTranscriptError } from 'youtube-transcript';
import { VideoResult, TranscriptSegment } from '../types';
import { buildVideoUrl } from '../utils/urlParser';
import { fetchTranscriptViaFirecrawl } from './firecrawlService';

export interface FetchTranscriptOptions {
  language?: string;
}

function classifyError(err: unknown): string {
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();

  if (message.includes('transcript is disabled') || message.includes('subtitles are disabled')) {
    return 'Transcripts are disabled for this video.';
  }
  if (message.includes('private') || message.includes('unavailable')) {
    return 'This video is private or unavailable.';
  }
  if (message.includes('no transcript') || message.includes('could not find')) {
    return 'No transcript available for this video.';
  }
  if (message.includes('too many requests') || message.includes('429')) {
    return 'Rate limited by YouTube. Please try again shortly.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error while fetching transcript. Check your connection.';
  }
  return `Failed to fetch transcript: ${err instanceof Error ? err.message : String(err)}`;
}

// Returns true for errors where Firecrawl might succeed where youtube-transcript failed
// (rate limits, regional blocks). Skips cases where no transcript exists at all.
function isFirecrawlWorthTrying(err: unknown): boolean {
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  // Private / no-transcript cases won't be helped by Firecrawl
  if (message.includes('private') || message.includes('no transcript') || message.includes('could not find')) {
    return false;
  }
  return true;
}

export async function fetchTranscript(
  videoId: string,
  title: string,
  url?: string,
  options: FetchTranscriptOptions = {}
): Promise<VideoResult> {
  const videoUrl = url ?? buildVideoUrl(videoId);

  // --- Primary: youtube-transcript (direct timedtext API) ---
  try {
    const config = options.language ? { lang: options.language } : undefined;
    const segments = await YoutubeTranscript.fetchTranscript(videoId, config);

    const transcript: TranscriptSegment[] = segments.map((seg) => ({
      text: seg.text,
      offset: seg.offset,
      duration: seg.duration,
    }));

    return {
      success: true,
      videoId,
      title,
      url: videoUrl,
      transcript,
      language: options.language ?? 'en',
      source: 'youtube-transcript',
    } as VideoResult & { source: string };
  } catch (primaryErr) {
    const primaryClassified = primaryErr instanceof YoutubeTranscriptError
      ? classifyError(primaryErr)
      : classifyError(primaryErr);

    // --- Fallback: Firecrawl (browser-rendered scrape + AI extraction) ---
    if (process.env.FIRECRAWL_API_KEY && isFirecrawlWorthTrying(primaryErr)) {
      try {
        const firecrawlResult = await fetchTranscriptViaFirecrawl(videoUrl);

        return {
          success: true,
          videoId,
          // Prefer the title from Firecrawl if the caller didn't supply one
          title: title || firecrawlResult.title,
          url: videoUrl,
          transcript: firecrawlResult.segments,
          language: options.language ?? 'en',
          source: 'firecrawl',
        } as VideoResult & { source: string };
      } catch {
        // Firecrawl also failed — fall through and report the original error
      }
    }

    return {
      success: false,
      videoId,
      title,
      url: videoUrl,
      error: primaryClassified,
    };
  }
}
