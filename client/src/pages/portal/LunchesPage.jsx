import { Crown, Download, History, Search, Utensils } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { getLunches } from '../../api/me.js';
import { Badge, Chip, StatusBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card, EmptyState, PageHeader } from '../../components/ui/Card.jsx';
import { ErrorMessage, Skeleton } from '../../components/ui/Feedback.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { formatDate } from '../../utils/date.js';
import { formatCents } from '../../utils/money.js';
import { downloadCsv } from '../../utils/share.js';

const FILTERS = [
  ['all', 'All'],
  ['voting', 'Voting'],
  ['decided', 'Decided'],
  ['settled', 'Settled'],
];

export default function LunchesPage() {
  const { data: lunches, error, loading, reload } = useAsync(getLunches, []);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (lunches ?? []).filter(
      (l) =>
        (status === 'all' || l.status === status) &&
        (!q || [l.title, l.restaurant?.name, l.restaurant?.cuisine, l.crew?.name].some((v) => v?.toLowerCase().includes(q)))
    );
  }, [lunches, query, status]);

  // Group by month for a scannable timeline.
  const groups = useMemo(() => {
    const map = new Map();
    for (const l of filtered) {
      const key = new Date(l.date).toLocaleDateString('en-SG', { month: 'long', year: 'numeric' });
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(l);
    }
    return [...map.entries()];
  }, [filtered]);

  const exportCsv = () =>
    downloadCsv(
      'noon-meal-history.csv',
      filtered.map((l) => ({
        date: l.date.slice(0, 10),
        lunch: l.title,
        restaurant: l.restaurant?.name ?? '',
        cuisine: l.restaurant?.cuisine ?? '',
        crew: l.crew?.name ?? '',
        status: l.status,
        bill_total: l.totalCents != null ? (l.totalCents / 100).toFixed(2) : '',
        my_share: l.myShareCents != null ? (l.myShareCents / 100).toFixed(2) : '',
        my_pick_won: l.wonPick ? 'yes' : 'no',
      }))
    );

  return (
    <div>
      <PageHeader
        title="Meal history"
        subtitle="Every lunch you’ve been part of."
        action={
          <Button variant="secondary" onClick={exportCsv} disabled={!filtered.length}>
            <Download size={16} /> Export
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <label htmlFor="lunch-search" className="sr-only">Search lunches</label>
          <input
            id="lunch-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search restaurant, cuisine, crew…"
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Status filter">
          {FILTERS.map(([id, label]) => (
            <Chip key={id} pressed={status === id} onClick={() => setStatus(id)}>{label}</Chip>
          ))}
        </div>
      </div>

      <ErrorMessage error={error} onRetry={reload} />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : !lunches?.length ? (
        <EmptyState icon={History} title="No lunches yet" action={<Button to="/app/new">Start your first lunch</Button>}>
          Lunches you start or join while signed in are saved here.
        </EmptyState>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted">No lunches match your search.</p>
      ) : (
        <div className="space-y-8">
          {groups.map(([month, items]) => (
            <section key={month}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{month}</h2>
              <ul className="space-y-3">
                {items.map((l) => (
                  <li key={l.code}>
                    <Card as={Link} to={l.restaurant ? `/s/${l.code}/bill` : `/s/${l.code}`} className="flex items-center gap-4 p-4 transition hover:border-brand/50">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                        <Utensils size={20} aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold">{l.restaurant?.name ?? l.title}</p>
                          {l.wonPick && <Badge tone="sun"><Crown size={11} /> Your pick</Badge>}
                          {l.wasHost && <Badge>Host</Badge>}
                        </div>
                        <p className="truncate text-xs text-muted">
                          {formatDate(l.date)} · {l.title}
                          {l.crew && ` · ${l.crew.name}`}
                          {l.restaurant?.cuisine && ` · ${l.restaurant.cuisine}`}
                        </p>
                      </div>
                      <div className="text-right">
                        {l.myShareCents != null ? (
                          <>
                            <p className="font-semibold tabular-nums">{formatCents(l.myShareCents)}</p>
                            <p className="text-xs text-muted">of {formatCents(l.totalCents)}</p>
                          </>
                        ) : (
                          <StatusBadge status={l.status} />
                        )}
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
