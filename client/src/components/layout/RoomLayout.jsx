import { ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';
import { Link, Outlet } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../ui/Button.jsx';
import { PageLoader } from '../ui/Feedback.jsx';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';

/** Minimal chrome for a lunch room (works for guests and signed-in users). */
export default function RoomLayout() {
  const { user } = useAuth();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          {user ? (
            <Link to="/app" className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink">
              <ArrowLeft size={16} /> Portal
            </Link>
          ) : (
            <Logo />
          )}
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            {!user && (
              <Button to="/signup" variant="secondary" size="sm">
                Save my history
              </Button>
            )}
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-4 pb-24 pt-5">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
