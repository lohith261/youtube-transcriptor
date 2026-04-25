type Status = 'success' | 'error' | 'loading';

interface StatusBadgeProps {
  status: Status;
}

const CONFIG: Record<Status, { label: string; classes: string }> = {
  success: { label: 'Success', classes: 'bg-green-100 text-green-700' },
  error: { label: 'Failed', classes: 'bg-red-100 text-red-700' },
  loading: { label: 'Processing', classes: 'bg-yellow-100 text-yellow-700' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, classes } = CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
