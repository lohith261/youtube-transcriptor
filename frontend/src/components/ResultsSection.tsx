import type { VideoResult, PlaylistTranscriptResponse } from '../types';
import VideoAccordion from './VideoAccordion';
import { PlaylistExportButtons, SingleExportButtons } from './ExportButtons';

interface SingleResultProps {
  result: VideoResult;
}

interface PlaylistResultProps {
  data: PlaylistTranscriptResponse;
}

export function SingleResult({ result }: SingleResultProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Result</h2>
        {result.success && <SingleExportButtons result={result} />}
      </div>
      <VideoAccordion result={result} defaultOpen />
    </div>
  );
}

export function PlaylistResult({ data }: PlaylistResultProps) {
  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{data.playlistTitle}</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {data.total} videos · {data.succeeded} succeeded · {data.failed} failed
          </p>
        </div>
        <PlaylistExportButtons data={data} />
      </div>

      {/* Summary bar */}
      {data.total > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${(data.succeeded / data.total) * 100}%` }}
          />
        </div>
      )}

      <div className="space-y-2">
        {data.results.map((result, i) => (
          <VideoAccordion key={`${result.videoId}-${i}`} result={result} />
        ))}
      </div>
    </div>
  );
}
