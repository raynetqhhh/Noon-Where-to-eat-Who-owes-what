import { ArrowDownLeft, ArrowUpRight, Check, Download, HandCoins, MessageCircle, Undo2, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { getPayments } from '../../api/me.js';
import { setSettlementPaid } from '../../api/sessions.js';
import Avatar from '../../components/ui/Avatar.jsx';
import { Chip } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card, CardHeader, EmptyState, PageHeader, Stat } from '../../components/ui/Card.jsx';
import { ErrorMessage, Skeleton } from '../../components/ui/Feedback.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { formatDate } from '../../utils/date.js';
import { formatCents } from '../../utils/money.js';
import { downloadCsv, whatsappUrl } from '../../utils/share.js';

export default function PaymentsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { data, error, loading, reload } = useAsync(getPayments, []);
  const [filter, setFilter] = useState('open');
  const [busy, setBusy] = useState(null);

  const records = (data?.records ?? []).filter((r) => (filter === 'all' ? true : filter === 'open' ? !r.isPaid : r.isPaid));

  const toggle = async (r) => {
    setBusy(r.id);
    try {
      await setSettlementPaid(r.session.code, r.id, !r.isPaid);
      await reload();
      toast(r.isPaid ? 'Marked as unpaid' : 'Marked as paid');
    } catch (err) {
      toast(err.message, { tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const reminder = (entry) =>
    `Hi ${entry.name}! Friendly Noon reminder: you owe me ${formatCents(entry.netCents)} from our lunches.${
      profile?.paynowId ? ` PayNow: ${profile.paynowId}.` : ''
    } Thanks! 🙏`;

  const exportCsv = () =>
    downloadCsv(
      'noon-payments.csv',
      (data?.records ?? []).map((r) => ({
        date: r.session?.date?.slice(0, 10) ?? '',
        lunch: r.session?.title ?? '',
        direction: r.direction === 'you_owe' ? 'you owe' : 'owed to you',
        person: r.counterpartName,
        amount: (r.amountCents / 100).toFixed(2),
        status: r.isPaid ? 'paid' : 'open',
        paid_at: r.paidAt?.slice(0, 10) ?? '',
      }))
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        subtitle="Who owes you, who you owe, netted across every lunch."
        action={
          <Button variant="secondary" onClick={exportCsv} disabled={!data?.records.length}>
            <Download size={16} /> Export
          </Button>
        }
      />
      <ErrorMessage error={error} onRetry={reload} />

      <div className="grid grid-cols-2 gap-3">
        {loading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <Stat icon={HandCoins} label="Owed to you" value={formatCents(data?.summary.owedToYouCents)} tone="good" />
            <Stat icon={Wallet} label="You owe" value={formatCents(data?.summary.youOweCents)} tone={data?.summary.youOweCents ? 'bad' : 'default'} />
          </>
        )}
      </div>

      <Card>
        <CardHeader title="Running ledger" subtitle="Debts in both directions with the same person cancel out." />
        {loading ? (
          <Skeleton className="h-20" />
        ) : !data?.ledger.length ? (
          <p className="text-sm text-muted">Everyone is square. 🎉</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.ledger.map((e) => (
              <li key={e.key} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar name={e.name} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{e.netCents > 0 ? `${e.name} owes you` : `You owe ${e.name}`}</p>
                  <p className="text-xs text-muted">{e.openCount} open payment{e.openCount === 1 ? '' : 's'}</p>
                </div>
                <span className={`font-display text-lg font-bold tabular-nums ${e.netCents > 0 ? 'text-ok' : 'text-bad'}`}>
                  {formatCents(Math.abs(e.netCents))}
                </span>
                {e.netCents > 0 && (
                  <Button size="sm" variant="secondary" href={whatsappUrl(reminder(e))}>
                    <MessageCircle size={14} /> Remind
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {!profile?.paynowId && data?.summary.owedToYouCents > 0 && (
          <p className="mt-3 text-xs text-muted">
            Tip: add your PayNow number in <Link to="/app/settings" className="font-semibold text-brand">Settings</Link> so reminders include it.
          </p>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Payment records"
          action={
            <div className="flex gap-1.5" role="group" aria-label="Filter payments">
              {[['open', 'Open'], ['paid', 'Paid'], ['all', 'All']].map(([id, label]) => (
                <Chip key={id} pressed={filter === id} onClick={() => setFilter(id)}>{label}</Chip>
              ))}
            </div>
          }
        />
        {loading ? (
          <Skeleton className="h-32" />
        ) : records.length === 0 ? (
          <EmptyState icon={Wallet} title={filter === 'open' ? 'No open payments' : 'No records yet'}>
            Payments appear here once a bill is split in one of your lunches.
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {records.map((r) => {
              const owe = r.direction === 'you_owe';
              return (
                <li key={r.id} className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${r.isPaid ? 'border-line opacity-70' : 'border-line'}`}>
                  <span className={`grid h-9 w-9 place-items-center rounded-full ${owe ? 'bg-bad-soft text-bad' : 'bg-ok-soft text-ok'}`} aria-hidden>
                    {owe ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{owe ? `You → ${r.counterpartName}` : `${r.counterpartName} → you`}</p>
                    <p className="truncate text-xs text-muted">
                      {r.session ? (
                        <Link to={`/s/${r.session.code}/bill`} className="hover:underline">
                          {r.session.title} · {formatDate(r.session.date)}
                        </Link>
                      ) : '—'}
                      {r.isPaid && r.paidAt && ` · paid ${formatDate(r.paidAt)}`}
                    </p>
                  </div>
                  <span className={`font-semibold tabular-nums ${r.isPaid ? 'line-through' : owe ? 'text-bad' : 'text-ok'}`}>{formatCents(r.amountCents)}</span>
                  {r.session && (
                    <Button size="sm" variant={r.isPaid ? 'ghost' : 'success'} loading={busy === r.id} onClick={() => toggle(r)}>
                      {r.isPaid ? <Undo2 size={14} /> : <Check size={14} />} {r.isPaid ? 'Undo' : 'Paid'}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
