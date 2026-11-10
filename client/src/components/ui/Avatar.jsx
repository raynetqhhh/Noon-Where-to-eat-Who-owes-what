import { useState } from 'react';

// Muted, print-like swatches (work in light and dark).
const COLORS = [
  'bg-[#f2c9b3] text-[#5a1f08]',
  'bg-[#f1dd9b] text-[#4d3b05]',
  'bg-[#c9dfc2] text-[#1d3d17]',
  'bg-[#c4d8e2] text-[#173342]',
  'bg-[#dccbe3] text-[#3a2045]',
  'bg-[#ecc4c4] text-[#4e1717]',
  'bg-[#c2dcd6] text-[#123a33]',
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

const SIZES = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-20 w-20 text-xl',
  '2xl': 'h-32 w-32 text-3xl',
};

/** A profile photo when there is one, otherwise coloured initials. */
export default function Avatar({ name = '?', src, size = 'md', className = '' }) {
  const [failed, setFailed] = useState(null);
  const base = `inline-grid shrink-0 place-items-center overflow-hidden rounded-full ring-2 ring-surface ${SIZES[size]} ${className}`;

  if (src && failed !== src) {
    return (
      <span className={`${base} bg-surface-2`}>
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(src)} />
      </span>
    );
  }
  return (
    <span aria-hidden className={`${base} font-mono font-medium ${colorFor(name)}`}>
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
        <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-surface-2 font-mono text-[11px] ring-2 ring-surface">
          +{names.length - max}
        </span>
      )}
    </div>
  );
}
