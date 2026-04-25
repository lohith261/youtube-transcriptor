import ytpl from 'ytpl';
import pLimit from 'p-limit';
import { PlaylistInfo, PlaylistVideoItem } from '../types';
import { fetchTranscript } from './transcriptService';
import { VideoResult, PlaylistTranscriptResponse } from '../types';

const DEFAULT_LIMIT = parseInt(process.env.PLAYLIST_LIMIT ?? '20', 10);
const CONCURRENCY = 3;

export async function fetchPlaylistInfo(playlistUrl: string, limit = DEFAULT_LIMIT): Promise<PlaylistInfo> {
  const cap = Math.min(limit, DEFAULT_LIMIT);

  try {
    const result = await ytpl(playlistUrl, { limit: cap });

    const items: PlaylistVideoItem[] = result.items.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.shortUrl,
    }));

    return {
      title: result.title,
      url: result.url,
      items,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('private') || message.includes('unavailable')) {
      throw new Error('This playlist is private or unavailable.');
    }
    if (message.includes('not found') || message.includes('invalid')) {
      throw new Error('Playlist not found. Check the URL and try again.');
    }
    throw new Error(`Could not fetch playlist: ${message}`);
  }
}

export async function processPlaylist(
  playlistUrl: string,
  limit = DEFAULT_LIMIT,
  language?: string
): Promise<PlaylistTranscriptResponse> {
  const playlist = await fetchPlaylistInfo(playlistUrl, limit);
  const throttle = pLimit(CONCURRENCY);

  const results: VideoResult[] = await Promise.all(
    playlist.items.map((item) =>
      throttle(() => fetchTranscript(item.id, item.title, item.url, { language }))
    )
  );

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    playlistTitle: playlist.title,
    playlistUrl: playlist.url,
    total: results.length,
    succeeded,
    failed,
    results,
  };
}
