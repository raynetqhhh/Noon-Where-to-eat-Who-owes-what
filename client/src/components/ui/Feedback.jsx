import { AlertTriangle, Loader2 } from 'lucide-react';

export function Spinner({ label = 'Loading' }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-muted">
      <Loader2 size={18} className="animate-spin" aria-hidden />
      {label}…
    </span>
  );
}

export function PageLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <Spinner />
    </div>
  );
}

export function ErrorMessage({ error, onRetry }) {
  if (!error) return null;
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl bg-bad-soft p-4 text-sm text-bad">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
      <div className="flex-1">
        <p className="font-medium">{error.message ?? String(error)}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="mt-1 font-semibold underline">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

/** Placeholder block while content loads. */
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-surface-2 ${className}`} aria-hidden />;
}
