import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../ui/Button.jsx';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const LINKS = [
  { href: '/#how', label: 'How it works' },
  { href: '/#features', label: 'Features' },
  { href: '/#eateries', label: 'For eateries' },
  { href: '/#pricing', label: 'Pricing' },
];

export default function PublicLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Logo />
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="rounded-full px-3 py-2 text-sm text-muted underline-offset-[6px] hover:text-ink hover:underline">
                {l.label}
              </a>
            ))}
            <Link to="/join" className="rounded-full px-3 py-2 text-sm text-muted underline-offset-[6px] hover:text-ink hover:underline">
              Join a lunch
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            {user ? (
              <Button to="/app" size="sm" className="hidden sm:inline-flex">
                Open my portal
              </Button>
            ) : (
              <div className="hidden items-center gap-1 sm:flex">
                <Button to="/signin" variant="ghost" size="sm">
                  Sign in
                </Button>
                <Button to="/signup" size="sm">
                  Get started
                </Button>
              </div>
            )}
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2 md:hidden"
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-line bg-bg px-4 py-3 md:hidden" aria-label="Mobile">
            <div className="flex flex-col">
              {LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm hover:bg-surface-2">
                  {l.label}
                </a>
              ))}
              <Link to="/join" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm hover:bg-surface-2">
                Join a lunch
              </Link>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {user ? (
                  <Button to="/app" className="col-span-2" onClick={() => setOpen(false)}>
                    Open my portal
                  </Button>
                ) : (
                  <>
                    <Button to="/signin" variant="secondary" onClick={() => setOpen(false)}>
                      Sign in
                    </Button>
                    <Button to="/signup" onClick={() => setOpen(false)}>
                      Get started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </header>

      <main id="main" key={location.pathname} className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-ink">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-sm text-muted sm:grid-cols-[2fr_1fr_1fr]">
          <p className="max-w-xs">One link to decide where to eat, and to settle who owes what afterwards.</p>
          <div className="flex flex-col gap-2">
            <span className="eyebrow mb-1">Product</span>
            <a href="/#features" className="hover:text-ink">Features</a>
            <a href="/#pricing" className="hover:text-ink">Pricing</a>
            <Link to="/join" className="hover:text-ink">Join with a code</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="eyebrow mb-1">Trust</span>
            <span>First names only. No ads in your lunch. Sponsored spots are always labelled.</span>
          </div>
        </div>
        <div className="mx-auto max-w-6xl overflow-hidden px-4">
          <p className="select-none font-display text-[clamp(6rem,26vw,22rem)] leading-[0.75] tracking-[-0.03em] text-ink" aria-hidden>
            Noon<span className="text-brand">.</span>
          </p>
        </div>
        <p className="mx-auto max-w-6xl px-4 py-6 font-mono text-xs text-muted">© {new Date().getFullYear()} Noon · A weekend venture experiment</p>
      </footer>
    </div>
  );
}
