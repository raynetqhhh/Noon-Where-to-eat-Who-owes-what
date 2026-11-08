const TONES = {
  neutral: 'bg-surface-2 text-muted',
  brand: 'bg-brand-soft text-brand',
  good: 'bg-ok-soft text-ok',
  bad: 'bg-bad-soft text-bad',
  info: 'bg-info-soft text-ink',
  sun: 'bg-sun/15 text-ink',
};

export function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

/** Toggle chip (aria-pressed), used for dietary/mood filters and pickers. */
export function Chip({ pressed, onClick, children, className = '', disabled }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition disabled:opacity-50 ${
        pressed
          ? 'border-brand bg-brand-soft font-semibold text-brand'
          : 'border-line bg-surface text-ink hover:bg-surface-2'
      } ${className}`}
    >
      {children}
    </button>
  );
}

const STATUS = {
  voting: { tone: 'info', label: 'Voting' },
  decided: { tone: 'brand', label: 'Decided' },
  settled: { tone: 'good', label: 'Settled' },
  closed: { tone: 'neutral', label: 'Closed' },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] ?? STATUS.closed;
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
