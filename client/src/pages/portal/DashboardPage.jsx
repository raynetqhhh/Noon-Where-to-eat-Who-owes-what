import { ArrowRight, CalendarDays, HandCoins, Plus, Ticket, Trophy, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { getLunches, getPayments } from '../../api/me.js';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card, CardHeader, EmptyState, Stat } from '../../components/ui/Card.jsx';
import { ErrorMessage, Skeleton } from '../../components/ui/Feedback.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { formatShortDate, greeting } from '../../utils/date.js';
import { formatCents } from '../../utils/money.js';

export default function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const { data, error, loading, reload } = useAsync(() => Promise.all([getLunches(), getPayments()]), []);
  const [lunches, payments] = data ?? [[], null];

  const active = lunches.filter((l) => ['voting', 'decided'].includes(l.status) && new Date(l.date) > Date.now() - 24 * 3600 * 1000);
  const thisMonth = lunches.filter((l) => l.date.slice(0, 7) === new Date().toISOString().slice(0, 7));
  const decided = lunches.filter((l) => l.restaurant);
  const winRate = decided.length ? Math.round((decided.filter((l) => l.wonPick).length / decided.length) * 100) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{greeting()}</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Hi {profile?.displayName ?? 'there'} 👋</h1>
        </div>
        <Button to="/app/new" size="lg">
          <Plus size={18} /> Start a lunch
        </Button>
      </div>

      <ErrorMessage error={error} onRetry={reload} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Stat icon={HandCoins} label="Owed to you" value={formatCents(payments?.summary.owedToYouCents)} tone="good" />
            <Stat icon={Wallet} label="You owe" value={formatCents(payments?.summary.youOweCents)} tone={payments?.summary.youOweCents ? 'bad' : 'default'} />
            <Stat icon={CalendarDays} label="Lunches this month" value={thisMonth.length} />
            <Stat icon={Trophy} label="Your pick won" value={winRate === null ? '–' : `${winRate}%`} hint={decided.length ? `of ${decided.length} lunches` : undefined} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Happening now" subtitle="Lunches still voting or waiting to settle" />
          {loading ? (
            <Skeleton className="h-20" />
          ) : active.length === 0 ? (
            <EmptyState icon={Plus} title="Nothing on right now" action={<Button to="/app/new">Start a lunch</Button>}>
              Start one and share the link with your group.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {active.map((l) => (
                <li key={l.code}>
                  <Link to={`/s/${l.code}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{l.title}</p>
                      <p className="text-xs text-muted">
                        {l.restaurant?.name ?? 'Still voting'} · {l.crew?.name ?? 'Ad-hoc'} · code {l.code}
                      </p>
                    </div>
                    <StatusBadge status={l.status} />
                    <ArrowRight size={16} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Join with a code" />
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const clean = code.trim().toUpperCase();
              if (/^[A-Z0-9]{6}$/.test(clean)) navigate(`/s/${clean}`);
            }}
          >
            <label htmlFor="dash-code" className="sr-only">Lunch code</label>
            <input
              id="dash-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              placeholder="Q7M2KX"
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 font-mono uppercase tracking-widest"
            />
            <Button type="submit" variant="secondary">
              <Ticket size={16} /> Join
            </Button>
          </form>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Open payments</h3>
              <Link to="/app/payments" className="text-sm font-medium text-brand hover:underline">All</Link>
            </div>
            {loading ? (
              <Skeleton className="h-16" />
            ) : payments?.ledger.length ? (
              <ul className="space-y-2">
                {payments.ledger.slice(0, 4).map((e) => (
                  <li key={e.key} className="flex justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                    <span>{e.netCents > 0 ? `${e.name} owes you` : `You owe ${e.name}`}</span>
                    <span className={`font-semibold tabular-nums ${e.netCents > 0 ? 'text-ok' : 'text-bad'}`}>{formatCents(Math.abs(e.netCents))}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">All square. Nice.</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent lunches" action={<Link to="/app/lunches" className="text-sm font-medium text-brand hover:underline">Meal history</Link>} />
        {loading ? (
          <Skeleton className="h-24" />
        ) : decided.length === 0 ? (
          <p className="text-sm text-muted">Your decided lunches will show up here.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {decided.slice(0, 6).map((l) => (
              <li key={l.code}>
                <Link to={`/s/${l.code}/bill`} className="block rounded-xl border border-line p-3 hover:bg-surface-2">
                  <p className="text-xs text-muted">{formatShortDate(l.date)}</p>
                  <p className="truncate font-semibold">{l.restaurant.name}</p>
                  <p className="text-xs text-muted">{l.myShareCents != null ? `You paid ${formatCents(l.myShareCents)}` : 'No bill yet'}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
