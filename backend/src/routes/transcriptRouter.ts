import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { fetchTranscript } from '../services/transcriptService';
import { processPlaylist } from '../services/playlistService';
import { extractVideoId, extractPlaylistId, isValidYouTubeUrl } from '../utils/urlParser';
import { fetchVideoTitle } from '../utils/videoMeta';
import { singleVideoLimiter, playlistLimiter } from '../middleware/rateLimiter';

const router = Router();

const singleSchema = z.object({
  url: z.string().min(1, 'URL is required'),
  language: z.string().optional(),
});

const playlistSchema = z.object({
  url: z.string().min(1, 'URL is required'),
  limit: z.number().int().min(1).max(20).optional(),
  language: z.string().optional(),
});

router.post(
  '/single',
  singleVideoLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = singleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.errors.map((e) => e.message).join(', '),
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const { url, language } = parsed.data;

    if (!isValidYouTubeUrl(url)) {
      res.status(400).json({ error: 'Invalid YouTube URL.', code: 'INVALID_URL' });
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      res.status(400).json({
        error: 'Could not extract video ID from URL.',
        code: 'INVALID_VIDEO_URL',
      });
      return;
    }

    try {
      // Fetch title and transcript concurrently — oEmbed is fast and free
      const [title, result] = await Promise.all([
        fetchVideoTitle(url),
        fetchTranscript(videoId, '', url, { language }),
      ]);
      res.json({ ...result, title: result.title || title });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/playlist',
  playlistLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = playlistSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.errors.map((e) => e.message).join(', '),
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const { url, limit, language } = parsed.data;

    if (!isValidYouTubeUrl(url)) {
      res.status(400).json({ error: 'Invalid YouTube URL.', code: 'INVALID_URL' });
      return;
    }

    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
      res.status(400).json({
        error: 'Could not extract playlist ID from URL.',
        code: 'INVALID_PLAYLIST_URL',
      });
      return;
    }

    try {
      const result = await processPlaylist(url, limit, language);
      res.json(result);
    } catch (err) {
      if (err instanceof Error) {
        res.status(422).json({ error: err.message, code: 'PLAYLIST_ERROR' });
        return;
      }
      next(err);
    }
  }
);

export default router;
