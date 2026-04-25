export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface VideoResultSuccess {
  success: true;
  videoId: string;
  title: string;
  url: string;
  transcript: TranscriptSegment[];
  language: string;
}

export interface VideoResultFailure {
  success: false;
  videoId: string;
  title: string;
  url: string;
  error: string;
}

export type VideoResult = VideoResultSuccess | VideoResultFailure;

export interface SingleTranscriptRequest {
  url: string;
}

export interface PlaylistTranscriptRequest {
  url: string;
  limit?: number;
}

export interface PlaylistTranscriptResponse {
  playlistTitle: string;
  playlistUrl: string;
  total: number;
  succeeded: number;
  failed: number;
  results: VideoResult[];
}

export interface ApiError {
  error: string;
  code: string;
  details?: string;
}
