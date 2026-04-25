import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { fetchTranscript } from '../../backend/src/services/transcriptService';
import { extractVideoId, isValidYouTubeUrl } from '../../backend/src/utils/urlParser';
import { fetchVideoTitle } from '../../backend/src/utils/videoMeta';

const schema = z.object({
  url: z.string().min(1),
  language: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors.map((e) => e.message).join(', '),
      code: 'VALIDATION_ERROR',
    });
  }

  const { url, language } = parsed.data;

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL.', code: 'INVALID_URL' });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return res.status(400).json({ error: 'Could not extract video ID from URL.', code: 'INVALID_VIDEO_URL' });
  }

  try {
    const [title, result] = await Promise.all([
      fetchVideoTitle(url),
      fetchTranscript(videoId, '', url, { language }),
    ]);
    return res.json({ ...result, title: result.title || title });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message, code: 'INTERNAL_ERROR' });
  }
}
