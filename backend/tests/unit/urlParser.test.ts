import { extractVideoId, extractPlaylistId, isValidYouTubeUrl, buildVideoUrl } from '../../src/utils/urlParser';

describe('extractVideoId', () => {
  const VALID_ID = 'dQw4w9WgXcQ';

  it('extracts from standard watch URL', () => {
    expect(extractVideoId(`https://www.youtube.com/watch?v=${VALID_ID}`)).toBe(VALID_ID);
  });

  it('extracts from URL with extra query params', () => {
    expect(extractVideoId(`https://www.youtube.com/watch?v=${VALID_ID}&t=30s&list=PLxxx`)).toBe(VALID_ID);
  });

  it('extracts from youtu.be short URL', () => {
    expect(extractVideoId(`https://youtu.be/${VALID_ID}`)).toBe(VALID_ID);
  });

  it('extracts from embed URL', () => {
    expect(extractVideoId(`https://www.youtube.com/embed/${VALID_ID}`)).toBe(VALID_ID);
  });

  it('extracts from shorts URL', () => {
    expect(extractVideoId(`https://www.youtube.com/shorts/${VALID_ID}`)).toBe(VALID_ID);
  });

  it('accepts a bare 11-char video ID', () => {
    expect(extractVideoId(VALID_ID)).toBe(VALID_ID);
  });

  it('returns null for invalid URL', () => {
    expect(extractVideoId('https://example.com/video')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractVideoId('')).toBeNull();
  });

  it('returns null for playlist-only URL', () => {
    expect(extractVideoId('https://www.youtube.com/playlist?list=PLxxxyyy')).toBeNull();
  });
});

describe('extractPlaylistId', () => {
  it('extracts from playlist URL', () => {
    expect(extractPlaylistId('https://www.youtube.com/playlist?list=PLabc123')).toBe('PLabc123');
  });

  it('extracts from video URL with list param', () => {
    expect(extractPlaylistId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc123')).toBe('PLabc123');
  });

  it('returns null when no list param', () => {
    expect(extractPlaylistId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
  });
});

describe('isValidYouTubeUrl', () => {
  it('accepts youtube.com URLs', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=abc')).toBe(true);
  });

  it('accepts youtu.be URLs', () => {
    expect(isValidYouTubeUrl('https://youtu.be/abc')).toBe(true);
  });

  it('accepts mobile m.youtube.com', () => {
    expect(isValidYouTubeUrl('https://m.youtube.com/watch?v=abc')).toBe(true);
  });

  it('rejects non-YouTube URLs', () => {
    expect(isValidYouTubeUrl('https://vimeo.com/123')).toBe(false);
  });

  it('rejects plain strings', () => {
    expect(isValidYouTubeUrl('not a url')).toBe(false);
  });
});

describe('buildVideoUrl', () => {
  it('returns correct YouTube watch URL', () => {
    expect(buildVideoUrl('dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });
});
