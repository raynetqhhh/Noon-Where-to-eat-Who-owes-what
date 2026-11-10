import { Share2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/date.js';
import { formatCents } from '../../utils/money.js';
import { sessionUrl, shareOrCopy } from '../../utils/share.js';
import { AvatarStack } from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';

/** A screenshot-friendly lunch summary, styled like a receipt, to post in a group chat. */
export default function SummaryCard({ session, restaurant }) {
  const { toast } = useToast();
  const { bill, participants } = session;
  const perHead = bill && participants.length ? Math.round(bill.totalCents / participants.length) : null;

  const share = async () => {
    const text = `We ate at ${restaurant.name}. ${participants.length} of us${bill ? `, ${formatCents(bill.totalCents)} total` : ''}. Decided with Noon.`;
    const result = await shareOrCopy({ title: session.title, text, url: sessionUrl(session.code) });
    if (result === 'copied') toast('Summary copied');
  };

  return (
    <div className="rounded-2xl border border-ink bg-surface p-6 shadow-lg">
      <p className="eyebrow">
        {session.title} · {formatDate(session.decidedAt ?? session.createdAt)}
      </p>
      <p className="mt-3 font-display text-4xl">{restaurant.name}</p>
      {restaurant.cuisine && <p className="mt-1 text-sm text-muted">{restaurant.cuisine}</p>}

      <div className="rule-dashed mt-5 flex items-end justify-between gap-4 pt-5">
        <div>
          <AvatarStack names={participants.map((p) => p.displayName)} max={6} />
          <p className="mt-2 font-mono text-xs text-muted">{participants.length} PEOPLE</p>
        </div>
        {bill && (
          <div className="text-right font-mono">
            <p className="text-2xl font-medium tabular-nums">{formatCents(bill.totalCents)}</p>
            <p className="text-xs text-muted">≈ {formatCents(perHead)} each</p>
          </div>
        )}
      </div>

      <div className="rule-dashed mt-5 flex items-center justify-between pt-4">
        <span className="font-display text-xl">Noon</span>
        <Button size="sm" variant="secondary" onClick={share}>
          <Share2 size={14} /> Share
        </Button>
      </div>
    </div>
  );
}
