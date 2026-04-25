import type { VideoResult, PlaylistTranscriptResponse, TranscriptSegment } from '../types';

function segmentsToText(segments: TranscriptSegment[]): string {
  return segments.map((s) => s.text.trim()).join(' ');
}

function formatVideoBlock(result: VideoResult): string {
  const divider = '─'.repeat(60);
  if (!result.success) {
    return [divider, `Title: ${result.title}`, `URL:   ${result.url}`, `Error: ${result.error}`, ''].join('\n');
  }
  const transcript = segmentsToText(result.transcript);
  return [divider, `Title: ${result.title}`, `URL:   ${result.url}`, '', transcript, ''].join('\n');
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSingleAsTxt(result: VideoResult): void {
  const content = formatVideoBlock(result);
  const safeName = result.title.replace(/[^a-z0-9]/gi, '_').slice(0, 50) || result.videoId;
  triggerDownload(content, `${safeName}.txt`, 'text/plain;charset=utf-8');
}

export function downloadSingleAsJson(result: VideoResult): void {
  triggerDownload(JSON.stringify(result, null, 2), `${result.videoId}.json`, 'application/json');
}

export function downloadPlaylistAsTxt(data: PlaylistTranscriptResponse): void {
  const header = [`Playlist: ${data.playlistTitle}`, `URL: ${data.playlistUrl}`, `Videos: ${data.total} (${data.succeeded} succeeded, ${data.failed} failed)`, ''].join('\n');
  const body = data.results.map(formatVideoBlock).join('\n');
  const safeName = data.playlistTitle.replace(/[^a-z0-9]/gi, '_').slice(0, 50) || 'playlist';
  triggerDownload(header + body, `${safeName}.txt`, 'text/plain;charset=utf-8');
}

export function downloadPlaylistAsJson(data: PlaylistTranscriptResponse): void {
  const safeName = data.playlistTitle.replace(/[^a-z0-9]/gi, '_').slice(0, 50) || 'playlist';
  triggerDownload(JSON.stringify(data, null, 2), `${safeName}.json`, 'application/json');
}

export function getVideoPlainText(result: VideoResult): string {
  if (!result.success) return `${result.title}\n${result.url}\n\nError: ${result.error}`;
  return `${result.title}\n${result.url}\n\n${segmentsToText(result.transcript)}`;
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
