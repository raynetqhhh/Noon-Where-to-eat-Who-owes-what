import { Loader2 } from 'lucide-react';
import { Link } from 'react-router';

// Primary is ink-on-paper and warms to the accent on hover: the accent is kept
// for moments that matter, not every button.
const VARIANTS = {
  primary: 'bg-ink text-bg hover:bg-brand hover:text-on-brand',
  accent: 'bg-brand text-on-brand hover:bg-brand-strong',
  secondary: 'bg-transparent text-ink border border-ink/80 hover:bg-ink hover:text-bg',
  ghost: 'text-ink hover:bg-surface-2',
  danger: 'bg-bad-soft text-bad hover:brightness-95',
  success: 'bg-ok-soft text-ok hover:brightness-95',
};

const SIZES = {
  sm: 'h-8 px-3.5 text-sm gap-1.5 rounded-full',
  md: 'h-10 px-5 text-sm gap-2 rounded-full',
  lg: 'h-12 px-7 text-base gap-2 rounded-full',
  icon: 'h-10 w-10 rounded-full',
};

/**
 * <Button>Save</Button>
 * <Button to="/app" variant="secondary">Open app</Button>   (renders a Link)
 * <Button loading>Saving</Button>
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  to,
  href,
  loading = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}) {
  const classes = `inline-flex items-center justify-center font-medium transition-[color,background-color,transform] duration-150 select-none active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  const content = (
    <>
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer" {...props}>
        {content}
      </a>
    );
  }
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
}
