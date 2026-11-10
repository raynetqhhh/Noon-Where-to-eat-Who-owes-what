export function Card({ className = '', as: Tag = 'div', children, ...props }) {
  return (
    <Tag className={`rounded-2xl border border-line bg-surface p-5 ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`mb-4 flex items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Big number with a label. tone: 'default' | 'good' | 'bad' | 'brand' */
export function Stat({ label, value, hint, tone = 'default', icon: Icon }) {
  const tones = { default: 'text-ink', good: 'text-ok', bad: 'text-bad', brand: 'text-brand' };
  return (
    <Card className="p-4">
      <div className="eyebrow flex items-center gap-1.5">
        {Icon && <Icon size={12} aria-hidden />}
        {label}
      </div>
      <div className={`mt-2 font-mono text-2xl font-medium tabular-nums tracking-tight ${tones[tone]}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      {Icon && (
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-full border border-line text-muted">
          <Icon size={20} aria-hidden />
        </div>
      )}
      <h3 className="font-display text-2xl">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action, eyebrow }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
