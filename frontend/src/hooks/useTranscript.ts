import { useState, useCallback } from 'react';
import { fetchSingleTranscript, fetchPlaylistTranscripts } from '../services/api';
import type { VideoResult, PlaylistTranscriptResponse, Mode } from '../types';

interface UseTranscriptReturn {
  loading: boolean;
  error: string | null;
  singleResult: VideoResult | null;
  playlistResult: PlaylistTranscriptResponse | null;
  submit: (url: string, mode: Mode, language?: string) => Promise<void>;
  reset: () => void;
}

export function useTranscript(): UseTranscriptReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [singleResult, setSingleResult] = useState<VideoResult | null>(null);
  const [playlistResult, setPlaylistResult] = useState<PlaylistTranscriptResponse | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setSingleResult(null);
    setPlaylistResult(null);
  }, []);

  const submit = useCallback(async (url: string, mode: Mode, language?: string) => {
    setLoading(true);
    setError(null);
    setSingleResult(null);
    setPlaylistResult(null);

    try {
      if (mode === 'single') {
        const result = await fetchSingleTranscript(url, language);
        setSingleResult(result);
      } else {
        const result = await fetchPlaylistTranscripts(url, 20, language);
        setPlaylistResult(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, singleResult, playlistResult, submit, reset };
}
