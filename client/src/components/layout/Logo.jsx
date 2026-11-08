import { Link } from 'react-router';

export default function Logo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 ${className}`} aria-label="Noon home">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <circle cx="16" cy="16" r="14" fill="var(--sun)" />
        <path d="M16 7v9l6 4" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      <span className="font-display text-xl font-extrabold tracking-tight">noon</span>
    </Link>
  );
}
