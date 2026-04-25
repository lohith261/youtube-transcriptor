// YouTube's oEmbed endpoint — free, no API key, returns title + author
const OEMBED_URL = 'https://www.youtube.com/oembed';

interface OEmbedResponse {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
}

export async function fetchVideoTitle(videoUrl: string): Promise<string> {
  try {
    const params = new URLSearchParams({ url: videoUrl, format: 'json' });
    const res = await fetch(`${OEMBED_URL}?${params}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return '';
    const data = (await res.json()) as OEmbedResponse;
    return data.title ?? '';
  } catch {
    return '';
  }
}
