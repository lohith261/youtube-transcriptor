import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { processPlaylist } from '../../backend/src/services/playlistService';
import { extractPlaylistId, isValidYouTubeUrl } from '../../backend/src/utils/urlParser';

const schema = z.object({
  url: z.string().min(1),
  limit: z.number().int().min(1).max(20).optional(),
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

  const { url, limit, language } = parsed.data;

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL.', code: 'INVALID_URL' });
  }

  const playlistId = extractPlaylistId(url);
  if (!playlistId) {
    return res.status(400).json({ error: 'Could not extract playlist ID from URL.', code: 'INVALID_PLAYLIST_URL' });
  }

  try {
    const result = await processPlaylist(url, limit, language);
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(422).json({ error: message, code: 'PLAYLIST_ERROR' });
  }
}
