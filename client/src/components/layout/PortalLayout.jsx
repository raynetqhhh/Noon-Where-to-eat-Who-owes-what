import { BarChart3, History, Home, LogOut, Plus, Settings, Users, Wallet } from 'lucide-react';
import { Suspense } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import Avatar from '../ui/Avatar.jsx';
import { PageLoader } from '../ui/Feedback.jsx';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: Home, end: true },
  { to: '/app/lunches', label: 'Meal history', icon: History },
  { to: '/app/payments', label: 'Payments', icon: Wallet },
  { to: '/app/crews', label: 'Crews', icon: Users },
  { to: '/app/insights', label: 'Insights', icon: BarChart3 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

// Phones get a bottom tab bar (where lunch decisions really happen).
const MOBILE_TABS = [NAV[0], NAV[1], { to: '/app/new', label: 'New', icon: Plus, primary: true }, NAV[2], NAV[4]];

const sideLink = ({ isActive }) =>
  `group flex items-center gap-3 rounded-full px-3.5 py-2 text-sm transition-colors ${
    isActive ? 'bg-ink text-bg' : 'text-muted hover:bg-surface-2 hover:text-ink'
  }`;

export default function PortalLayout() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const name = profile?.displayName ?? user?.email ?? 'You';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line px-4 py-6 md:flex">
        <Logo to="/app" className="px-2" />
        <NavLink
          to="/app/new"
          className="mt-8 flex h-11 items-center justify-center gap-2 rounded-full bg-brand font-medium text-on-brand transition-colors hover:bg-brand-strong"
        >
          <Plus size={18} /> Start a lunch
        </NavLink>
        <p className="eyebrow mt-8 px-3.5">Menu</p>
        <nav className="mt-2 flex flex-col gap-0.5" aria-label="Portal">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={sideLink}>
              <Icon size={17} aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2 border-t border-line pt-4">
          <Link to="/app/profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-full p-1 pr-3 transition-colors hover:bg-surface-2" aria-label="Your profile">
            <Avatar name={name} src={profile?.avatarUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted">View profile</p>
            </div>
          </Link>
          <button type="button" onClick={handleSignOut} aria-label="Sign out" className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-line bg-bg/90 px-4 backdrop-blur md:hidden">
          <Logo to="/app" />
          <div className="ml-auto flex items-center">
            <ThemeToggle />
            <NavLink to="/app/crews" aria-label="Crews" className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2">
              <Users size={18} />
            </NavLink>
            <NavLink to="/app/profile" aria-label="Your profile" className="ml-1 grid h-10 w-10 place-items-center rounded-full">
              <Avatar name={name} src={profile?.avatarUrl} size="sm" />
            </NavLink>
          </div>
        </header>

        <div className="hidden justify-end px-8 pt-4 md:flex">
          <ThemeToggle />
        </div>

        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-4 md:px-10 md:pb-12">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>

        {/* Mobile bottom tabs */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] md:hidden"
          aria-label="Portal"
        >
          {MOBILE_TABS.map(({ to, label, icon: Icon, end, primary }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-ink' : 'text-muted'}`
              }
            >
              {primary ? (
                <span className="-mt-5 grid h-12 w-12 place-items-center rounded-full bg-brand text-on-brand ring-4 ring-bg">
                  <Icon size={22} aria-hidden />
                </span>
              ) : (
                <Icon size={20} aria-hidden />
              )}
              {label === 'Meal history' ? 'History' : label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
