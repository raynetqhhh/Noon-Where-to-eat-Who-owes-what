import { CalendarDays, Crown, Flame, PiggyBank, Trophy, Utensils } from 'lucide-react';
import { getInsights } from '../../api/me.js';
import Avatar from '../../components/ui/Avatar.jsx';
import { BarList, ColumnChart } from '../../components/ui/Bars.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card, CardHeader, EmptyState, PageHeader, Stat } from '../../components/ui/Card.jsx';
import { ErrorMessage, Skeleton } from '../../components/ui/Feedback.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { formatMonth } from '../../utils/date.js';
import { formatCents } from '../../utils/money.js';

const hourLabel = (h) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;

export default function InsightsPage() {
  const { data, error, loading, reload } = useAsync(getInsights, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Insights" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }
  if (error) return <ErrorMessage error={error} onRetry={reload} />;

  const { totals } = data;
  if (totals.lunches === 0) {
    return (
      <div>
        <PageHeader title="Insights" />
        <EmptyState icon={Utensils} title="No data yet" action={<Button to="/app/new">Start a lunch</Button>}>
          After a few lunches you’ll see your spending, favourite cuisines, streaks and the fairness board here.
        </EmptyState>
      </div>
    );
  }

  const busiestHours = data.decisionHours.filter((h) => h.count > 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Insights" subtitle="Your lunch habits at a glance." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={CalendarDays} label="Lunches" value={totals.lunches} hint={`${totals.hosted} hosted`} />
        <Stat icon={PiggyBank} label="Spent" value={formatCents(totals.spentCents)} hint={`avg ${formatCents(totals.avgSpendCents)}`} />
        <Stat icon={Crown} label="Pick won" value={totals.winRate === null ? '–' : `${Math.round(totals.winRate * 100)}%`} hint={`${totals.picksWon} of ${totals.decided}`} tone="brand" />
        <Stat icon={Flame} label="Streak" value={`${totals.streakWeeks} wk`} hint="weeks in a row" tone={totals.streakWeeks ? 'brand' : 'default'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Spending by month" subtitle="Your share, last 6 months" />
          <ColumnChart
            caption="Spending by month"
            rows={data.spendByMonth.map((m) => ({ label: formatMonth(m.month), value: m.cents, display: formatCents(m.cents) }))}
          />
        </Card>
        <Card>
          <CardHeader title="Favourite cuisines" />
          <BarList rows={data.cuisines.map((c) => ({ label: c.label, value: c.count }))} emptyText="Decide a few lunches first." />
        </Card>
        <Card>
          <CardHeader title="Top places" />
          <BarList rows={data.topPlaces.map((p) => ({ label: p.label, value: p.count, display: `${p.count}×` }))} emptyText="No places yet." />
        </Card>
        <Card>
          <CardHeader title="When you decide" subtitle="Time the group locked in a place" />
          {busiestHours.length ? (
            <ColumnChart caption="Decisions by hour" rows={data.decisionHours.slice(3, 12).map((h) => ({ label: hourLabel(h.hour), value: h.count }))} />
          ) : (
            <p className="text-sm text-muted">No decisions yet.</p>
          )}
        </Card>
      </div>

      {data.fairness.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-semibold">Fairness boards</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {data.fairness.map((board) => (
              <Card key={board.crewId}>
                <CardHeader title={board.crewName} subtitle="Whose pick wins" />
                {board.rows.length === 0 ? (
                  <p className="text-sm text-muted">No decided lunches yet.</p>
                ) : (
                  <ol className="space-y-2.5">
                    {board.rows.slice(0, 8).map((r, i) => (
                      <li key={r.key} className="flex items-center gap-3 text-sm">
                        <span className="w-5 text-center font-bold text-muted">{i === 0 ? <Trophy size={15} className="text-sun" /> : i + 1}</span>
                        <Avatar name={r.name} size="sm" />
                        <span className="flex-1">{r.name}</span>
                        <span className="tabular-nums text-muted">{r.wins}/{r.lunches}</span>
                        <span className="w-12 text-right font-semibold tabular-nums">{Math.round(r.winRate * 100)}%</span>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
