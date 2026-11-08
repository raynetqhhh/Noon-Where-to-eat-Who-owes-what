const COLORS = [
  'bg-orange-200 text-orange-900',
  'bg-amber-200 text-amber-900',
  'bg-emerald-200 text-emerald-900',
  'bg-sky-200 text-sky-900',
  'bg-violet-200 text-violet-900',
  'bg-rose-200 text-rose-900',
  'bg-teal-200 text-teal-900',
];

function colorFor(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

export default function Avatar({ name = '?', size = 'md', className = '' }) {
  const sizes = { sm: 'h-7 w-7 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' };
  return (
    <span
      aria-hidden
      className={`inline-grid shrink-0 place-items-center rounded-full font-bold ring-2 ring-surface ${sizes[size]} ${colorFor(name)} ${className}`}
    >
      {initials(name) || '?'}
    </span>
  );
}

export function AvatarStack({ names, max = 5 }) {
  const shown = names.slice(0, max);
  return (
    <div className="flex -space-x-2" aria-label={names.join(', ')}>
      {shown.map((n, i) => (
        <Avatar key={`${n}-${i}`} name={n} size="sm" />
      ))}
      {names.length > max && (
        <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-[11px] font-bold ring-2 ring-surface">
          +{names.length - max}
        </span>
      )}
    </div>
  );
}
