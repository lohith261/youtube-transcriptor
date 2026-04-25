interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Processing...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
