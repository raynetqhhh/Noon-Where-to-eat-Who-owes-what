import { ArrowRight, Check, Download, MessageCircle, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { setSettlementPaid } from '../../api/sessions.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCents } from '../../utils/money.js';
import { downloadCsv, sessionUrl, whatsappUrl } from '../../utils/share.js';
import Avatar from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';
import { Card, CardHeader } from '../ui/Card.jsx';

/** What everyone owes, who pays whom, reminders and export. */
export default function BillSummary({ session, restaurantName, onChanged }) {
  const { bill, me, participants } = session;
  const { toast } = useToast();
  const [busy, setBusy] = useState(null);
  const paynowOf = (id) => participants.find((p) => p.id === id)?.paynowId;

  const togglePaid = async (s) => {
    setBusy(s.id);
    try {
      await setSettlementPaid(session.code, s.id, !s.isPaid);
      await onChanged();
      toast(s.isPaid ? 'Marked as unpaid' : `${s.fromName} → ${s.toName} marked paid`, {
        action: { label: 'Undo', onClick: () => setSettlementPaid(session.code, s.id, s.isPaid).then(onChanged) },
      });
    } catch (err) {
      toast(err.message, { tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const reminder = (s) => {
    const paynow = paynowOf(s.toParticipantId);
    return `Hi ${s.fromName}! For ${restaurantName} (${session.title}) you owe ${s.toName} ${formatCents(s.amountCents)}.${
      paynow ? ` PayNow: ${paynow}.` : ''
    } Details: ${sessionUrl(session.code)}/bill 🙏`;
  };

  const summaryText = [
    `🍽️ ${session.title} at ${restaurantName}`,
    `Total ${formatCents(bill.totalCents)} (incl. service & GST)`,
    '',
    ...bill.settlements.map((s) => `${s.isPaid ? '✅' : '⏳'} ${s.fromName} → ${s.toName}: ${formatCents(s.amountCents)}`),
    '',
    `Details: ${sessionUrl(session.code)}/bill`,
  ].join('\n');

  const exportCsv = () =>
    downloadCsv(`noon-${session.code}-bill.csv`, [
      ...bill.items.map((i) => ({
        type: 'item',
        name: i.name,
        amount: (i.amountCents / 100).toFixed(2),
        people: i.participantIds.map((id) => participants.find((p) => p.id === id)?.displayName).join(' / '),
      })),
      ...bill.shares.map((s) => ({ type: 'share', name: s.name, amount: (s.owedCents / 100).toFixed(2), people: '' })),
      ...bill.settlements.map((s) => ({
        type: s.isPaid ? 'paid' : 'owes',
        name: `${s.fromName} -> ${s.toName}`,
        amount: (s.amountCents / 100).toFixed(2),
        people: '',
      })),
    ]);

  const settled = bill.settlements.filter((s) => s.isPaid).length;
  const progress = bill.settlements.length ? (settled / bill.settlements.length) * 100 : 100;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Who pays whom"
          subtitle={bill.settlements.length ? `${settled} of ${bill.settlements.length} settled` : 'Everyone is square already 🎉'}
        />
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <div className="h-full rounded-full bg-ok transition-all" style={{ width: `${progress}%` }} />
        </div>
        <ul className="space-y-2">
          {bill.settlements.map((s) => {
            const canMark = me && (me.id === s.fromParticipantId || me.id === s.toParticipantId || me.isHost);
            const iAmOwed = me?.id === s.toParticipantId;
            return (
              <li key={s.id} className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${s.isPaid ? 'border-ok/40 bg-ok-soft/40' : 'border-line'}`}>
                <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                  <Avatar name={s.fromName} size="sm" />
                  <span className="font-medium">{s.fromName}</span>
                  <ArrowRight size={14} className="text-muted" aria-label="pays" />
                  <Avatar name={s.toName} size="sm" />
                  <span className="font-medium">{s.toName}</span>
                </div>
                <span className={`font-display text-lg font-bold tabular-nums ${s.isPaid ? 'text-ok line-through' : ''}`}>
                  {formatCents(s.amountCents)}
                </span>
                <div className="flex w-full gap-2 sm:w-auto">
                  {iAmOwed && !s.isPaid && (
                    <Button size="sm" variant="secondary" href={whatsappUrl(reminder(s))}>
                      <MessageCircle size={14} /> Remind
                    </Button>
                  )}
                  {canMark && (
                    <Button size="sm" variant={s.isPaid ? 'ghost' : 'success'} loading={busy === s.id} onClick={() => togglePaid(s)}>
                      {s.isPaid ? <Undo2 size={14} /> : <Check size={14} />} {s.isPaid ? 'Undo' : 'Mark paid'}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {bill.payers.length > 0 && (
          <p className="mt-4 text-xs text-muted">
            Paid at the counter: {bill.payers.map((p) => `${p.name} ${formatCents(p.amountCents)}`).join(', ')}
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title="Each person’s share" />
        <ul className="grid gap-2 sm:grid-cols-2">
          {bill.shares.map((s) => (
            <li key={s.participantId} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${s.participantId === me?.id ? 'bg-brand-soft' : 'bg-surface-2'}`}>
              <Avatar name={s.name} size="sm" />
              <span className="flex-1 text-sm">{s.name}{s.participantId === me?.id && ' (you)'}</span>
              <span className="font-semibold tabular-nums">{formatCents(s.owedCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-1 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatCents(bill.subtotalCents)}</dd></div>
          {bill.discountCents > 0 && <div className="flex justify-between text-ok"><dt>Discount</dt><dd className="tabular-nums">−{formatCents(bill.discountCents)}</dd></div>}
          {bill.serviceCents > 0 && <div className="flex justify-between"><dt className="text-muted">Service charge ({bill.serviceChargePct}%)</dt><dd className="tabular-nums">{formatCents(bill.serviceCents)}</dd></div>}
          {bill.taxCents > 0 && <div className="flex justify-between"><dt className="text-muted">GST ({bill.taxPct}%)</dt><dd className="tabular-nums">{formatCents(bill.taxCents)}</dd></div>}
          <div className="flex justify-between font-display text-lg font-bold"><dt>Total</dt><dd className="tabular-nums">{formatCents(bill.totalCents)}</dd></div>
        </dl>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium text-brand">Items ({bill.items.length})</summary>
          <ul className="mt-2 divide-y divide-line">
            {bill.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 py-2">
                <span>
                  {i.name}
                  <span className="block text-xs text-muted">
                    {i.participantIds.length === participants.length ? 'Everyone' : i.participantIds.map((id) => participants.find((p) => p.id === id)?.displayName).join(', ')}
                  </span>
                </span>
                <span className="tabular-nums">{formatCents(i.amountCents)}</span>
              </li>
            ))}
          </ul>
        </details>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button href={whatsappUrl(summaryText)} className="!bg-[#1f8f4e] !text-white">
          <MessageCircle size={16} /> Send summary on WhatsApp
        </Button>
        <Button variant="secondary" onClick={exportCsv}>
          <Download size={16} /> Export CSV
        </Button>
      </div>
    </div>
  );
}
