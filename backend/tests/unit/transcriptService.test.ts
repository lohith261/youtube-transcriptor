import { fetchTranscript } from '../../src/services/transcriptService';

// Mock the youtube-transcript package
jest.mock('youtube-transcript', () => ({
  YoutubeTranscript: {
    fetchTranscript: jest.fn(),
  },
  YoutubeTranscriptError: class YoutubeTranscriptError extends Error {},
}));

import { YoutubeTranscript } from 'youtube-transcript';

const mockFetch = YoutubeTranscript.fetchTranscript as jest.MockedFunction<
  typeof YoutubeTranscript.fetchTranscript
>;

const MOCK_SEGMENTS = [
  { text: 'Hello world', offset: 0, duration: 2000 },
  { text: 'This is a test', offset: 2000, duration: 1500 },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchTranscript', () => {
  it('returns success result with transcript segments', async () => {
    mockFetch.mockResolvedValueOnce(MOCK_SEGMENTS as any);

    const result = await fetchTranscript('dQw4w9WgXcQ', 'Test Video');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.videoId).toBe('dQw4w9WgXcQ');
      expect(result.title).toBe('Test Video');
      expect(result.transcript).toHaveLength(2);
      expect(result.transcript[0].text).toBe('Hello world');
    }
  });

  it('returns failure when transcript is disabled', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Transcript is disabled for this video'));

    const result = await fetchTranscript('abc123', 'Private Video');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/disabled/i);
    }
  });

  it('returns failure for private video', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Video is private'));

    const result = await fetchTranscript('xyz789', 'Private Video');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/private|unavailable/i);
    }
  });

  it('returns failure when no transcript available', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Could not find transcript for this video'));

    const result = await fetchTranscript('noSubs1234a', 'No Captions Video');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/no transcript/i);
    }
  });

  it('includes the video URL in failure result', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Some error'));

    const result = await fetchTranscript('vid123abc45', 'Some Video', 'https://youtu.be/vid123abc45');

    expect(result.url).toBe('https://youtu.be/vid123abc45');
  });

  it('passes language option to fetchTranscript', async () => {
    mockFetch.mockResolvedValueOnce(MOCK_SEGMENTS as any);

    await fetchTranscript('dQw4w9WgXcQ', 'Test', undefined, { language: 'es' });

    expect(mockFetch).toHaveBeenCalledWith('dQw4w9WgXcQ', { lang: 'es' });
  });

  it('calls fetchTranscript without lang config when no language specified', async () => {
    mockFetch.mockResolvedValueOnce(MOCK_SEGMENTS as any);

    await fetchTranscript('dQw4w9WgXcQ', 'Test');

    expect(mockFetch).toHaveBeenCalledWith('dQw4w9WgXcQ', undefined);
  });
});
