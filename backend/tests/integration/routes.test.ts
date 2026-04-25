import request from 'supertest';
import app from '../../src/app';

// Mock services so integration tests don't hit YouTube
jest.mock('../../src/services/transcriptService', () => ({
  fetchTranscript: jest.fn(),
}));
jest.mock('../../src/services/playlistService', () => ({
  processPlaylist: jest.fn(),
}));

import { fetchTranscript } from '../../src/services/transcriptService';
import { processPlaylist } from '../../src/services/playlistService';

const mockFetchTranscript = fetchTranscript as jest.MockedFunction<typeof fetchTranscript>;
const mockProcessPlaylist = processPlaylist as jest.MockedFunction<typeof processPlaylist>;

const GOOD_VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const GOOD_PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PLrEnWoR732-BHrPp_Pm8_VleD68f9s14-';

const MOCK_SUCCESS_RESULT = {
  success: true as const,
  videoId: 'dQw4w9WgXcQ',
  title: 'Test Video',
  url: GOOD_VIDEO_URL,
  transcript: [{ text: 'Hello', offset: 0, duration: 1000 }],
  language: 'en',
};

const MOCK_PLAYLIST_RESPONSE = {
  playlistTitle: 'Test Playlist',
  playlistUrl: GOOD_PLAYLIST_URL,
  total: 1,
  succeeded: 1,
  failed: 0,
  results: [MOCK_SUCCESS_RESULT],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /api/transcript/single', () => {
  it('returns transcript for valid video URL', async () => {
    mockFetchTranscript.mockResolvedValueOnce(MOCK_SUCCESS_RESULT);

    const res = await request(app)
      .post('/api/transcript/single')
      .send({ url: GOOD_VIDEO_URL });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.videoId).toBe('dQw4w9WgXcQ');
    expect(res.body.transcript).toHaveLength(1);
  });

  it('returns 400 for missing URL', async () => {
    const res = await request(app).post('/api/transcript/single').send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for non-YouTube URL', async () => {
    const res = await request(app)
      .post('/api/transcript/single')
      .send({ url: 'https://vimeo.com/123' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_URL');
  });

  it('returns 400 for YouTube URL with no video ID', async () => {
    const res = await request(app)
      .post('/api/transcript/single')
      .send({ url: 'https://www.youtube.com/channel/UC123' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_VIDEO_URL');
  });

  it('forwards failure result from service', async () => {
    mockFetchTranscript.mockResolvedValueOnce({
      success: false,
      videoId: 'dQw4w9WgXcQ',
      title: '',
      url: GOOD_VIDEO_URL,
      error: 'No transcript available for this video.',
    });

    const res = await request(app)
      .post('/api/transcript/single')
      .send({ url: GOOD_VIDEO_URL });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/no transcript/i);
  });
});

describe('POST /api/transcript/playlist', () => {
  it('returns playlist results for valid playlist URL', async () => {
    mockProcessPlaylist.mockResolvedValueOnce(MOCK_PLAYLIST_RESPONSE);

    const res = await request(app)
      .post('/api/transcript/playlist')
      .send({ url: GOOD_PLAYLIST_URL });

    expect(res.status).toBe(200);
    expect(res.body.playlistTitle).toBe('Test Playlist');
    expect(res.body.total).toBe(1);
  });

  it('returns 400 for URL without list param', async () => {
    const res = await request(app)
      .post('/api/transcript/playlist')
      .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PLAYLIST_URL');
  });

  it('returns 422 when playlist service throws', async () => {
    mockProcessPlaylist.mockRejectedValueOnce(new Error('Playlist not found.'));

    const res = await request(app)
      .post('/api/transcript/playlist')
      .send({ url: GOOD_PLAYLIST_URL });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('PLAYLIST_ERROR');
  });

  it('respects limit param', async () => {
    mockProcessPlaylist.mockResolvedValueOnce(MOCK_PLAYLIST_RESPONSE);

    await request(app)
      .post('/api/transcript/playlist')
      .send({ url: GOOD_PLAYLIST_URL, limit: 5 });

    expect(mockProcessPlaylist).toHaveBeenCalledWith(GOOD_PLAYLIST_URL, 5, undefined);
  });
});
