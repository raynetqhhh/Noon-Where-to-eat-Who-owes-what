import { Loader2 } from 'lucide-react';
import { Link } from 'react-router';

const VARIANTS = {
  primary: 'bg-brand text-on-brand hover:bg-brand-strong shadow-sm',
  secondary: 'bg-surface text-ink border border-line hover:bg-surface-2',
  ghost: 'text-ink hover:bg-surface-2',
  danger: 'bg-bad-soft text-bad hover:brightness-95',
  success: 'bg-ok-soft text-ok hover:brightness-95',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
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
  const classes = `inline-flex items-center justify-center font-semibold transition-colors select-none disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
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
