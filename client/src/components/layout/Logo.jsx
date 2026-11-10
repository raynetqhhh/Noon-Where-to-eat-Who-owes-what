import { Link } from 'react-router';

/** Wordmark: "Noon" in the display serif, the sun sitting at 12 o'clock. */
export default function Logo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={`group inline-flex items-center gap-1.5 ${className}`} aria-label="Noon home">
      <svg viewBox="0 0 32 32" className="h-6 w-6 transition-transform duration-500 group-hover:rotate-90" aria-hidden>
        <circle cx="16" cy="16" r="13" fill="var(--sun)" />
        <path d="M16 6.5V16" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="font-display text-[1.7rem] leading-none">Noon</span>
    </Link>
  );
}
