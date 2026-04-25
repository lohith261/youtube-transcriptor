import type { VideoResultSuccess } from '../types';
import {
  downloadJSONL,
  downloadConversationFormat,
  downloadQAPairs,
  downloadPlainSegmented,
  toJSONL,
  toConversationFormat,
  toQAPairs,
  toPlainSegmented,
} from '../utils/trainingDataUtils';
import { copyToClipboard } from '../utils/exportUtils';
import { useState } from 'react';

interface FormatCardProps {
  label: string;
  description: string;
  badge: string;
  badgeColor: string;
  onDownload: () => void;
  onCopy: () => void;
}

function FormatCard({ label, description, badge, badgeColor, onDownload, onCopy }: FormatCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{label}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeColor}`}>{badge}</span>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button onClick={handleCopy} className="btn-secondary text-xs py-1.5">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <button onClick={onDownload} className="btn-secondary text-xs py-1.5">
          ↓ Download
        </button>
      </div>
    </div>
  );
}

interface TrainingExportPanelProps {
  result: VideoResultSuccess;
}

export default function TrainingExportPanel({ result }: TrainingExportPanelProps) {
  const formats: FormatCardProps[] = [
    {
      label: 'JSONL',
      description: 'One segment per line with metadata — OpenAI, Mistral, LLaMA fine-tuning',
      badge: '.jsonl',
      badgeColor: 'bg-blue-100 text-blue-700',
      onDownload: () => downloadJSONL(result),
      onCopy: () => copyToClipboard(toJSONL(result)),
    },
    {
      label: 'Conversation / ChatML',
      description: 'Speaker turns as {role: user/assistant} pairs — instruction fine-tuning',
      badge: 'chat.jsonl',
      badgeColor: 'bg-purple-100 text-purple-700',
      onDownload: () => downloadConversationFormat(result),
      onCopy: () => copyToClipboard(toConversationFormat(result)),
    },
    {
      label: 'Q&A Pairs',
      description: 'Alpaca-style {instruction, output} pairs from alternating turns',
      badge: 'qa.jsonl',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      onDownload: () => downloadQAPairs(result),
      onCopy: () => copyToClipboard(toQAPairs(result)),
    },
    {
      label: 'Plain Segmented',
      description: '~500-word timestamped chunks — ideal for embedding / RAG pipelines',
      badge: '.txt',
      badgeColor: 'bg-amber-100 text-amber-700',
      onDownload: () => downloadPlainSegmented(result),
      onCopy: () => copyToClipboard(toPlainSegmented(result)),
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Training Data Export</p>
      <div className="space-y-2">
        {formats.map((f) => (
          <FormatCard key={f.label} {...f} />
        ))}
      </div>
    </div>
  );
}
