import axios, { AxiosError } from 'axios';
import type { VideoResult, PlaylistTranscriptResponse } from '../types';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 120_000, // playlists can take a while
});

function extractErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
    if (data?.error) return data.error;
    if (err.code === 'ECONNABORTED') return 'Request timed out. The server took too long to respond.';
    if (!err.response) return 'Could not connect to the server. Is the backend running?';
  }
  return err instanceof Error ? err.message : 'An unexpected error occurred.';
}

export async function fetchSingleTranscript(url: string, language?: string): Promise<VideoResult> {
  try {
    const res = await client.post<VideoResult>('/transcript/single', { url, language });
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

export async function fetchPlaylistTranscripts(
  url: string,
  limit = 20,
  language?: string
): Promise<PlaylistTranscriptResponse> {
  try {
    const res = await client.post<PlaylistTranscriptResponse>('/transcript/playlist', {
      url,
      limit,
      language,
    });
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}
