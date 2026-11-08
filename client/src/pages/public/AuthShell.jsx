import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

/** Shared frame for sign-in / sign-up pages. */
export default function AuthShell({ title, subtitle, children, footer }) {
  const { isConfigured } = useAuth();
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="animate-rise rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        {!isConfigured && (
          <div className="mt-5 flex gap-2 rounded-xl bg-sun/15 p-3 text-xs">
            <AlertTriangle size={16} className="shrink-0 text-brand" aria-hidden />
            <span>
              Sign-in isn’t connected yet. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to{' '}
              <code>client/.env</code>, then restart the dev server. You can still join lunches as a guest.
            </span>
          </div>
        )}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
    </div>
  );
}
