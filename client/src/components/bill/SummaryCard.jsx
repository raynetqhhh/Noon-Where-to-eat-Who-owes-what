import { Share2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/date.js';
import { formatCents } from '../../utils/money.js';
import { sessionUrl, shareOrCopy } from '../../utils/share.js';
import { AvatarStack } from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';

/** A screenshot-friendly lunch summary card to post in a group chat. */
export default function SummaryCard({ session, restaurant }) {
  const { toast } = useToast();
  const { bill, participants } = session;
  const perHead = bill && participants.length ? Math.round(bill.totalCents / participants.length) : null;

  const share = async () => {
    const text = `We ate at ${restaurant.name} 🍽️ ${participants.length} of us${bill ? `, ${formatCents(bill.totalCents)} total` : ''}. Decided with Noon.`;
    const result = await shareOrCopy({ title: session.title, text, url: sessionUrl(session.code) });
    if (result === 'copied') toast('Summary copied');
  };

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-[#7c2d12] p-6 text-white shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{session.title} · {formatDate(session.decidedAt ?? session.createdAt)}</p>
      <p className="mt-2 font-display text-3xl font-extrabold leading-tight">{restaurant.name}</p>
      {restaurant.cuisine && <p className="text-sm opacity-80">{restaurant.cuisine}</p>}
      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <AvatarStack names={participants.map((p) => p.displayName)} max={6} />
          <p className="mt-2 text-sm opacity-90">{participants.length} people</p>
        </div>
        {bill && (
          <div className="text-right">
            <p className="font-display text-2xl font-bold tabular-nums">{formatCents(bill.totalCents)}</p>
            <p className="text-xs opacity-80">≈ {formatCents(perHead)} each</p>
          </div>
        )}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-4">
        <span className="font-display text-sm font-bold">Noon</span>
        <Button size="sm" variant="secondary" onClick={share}>
          <Share2 size={14} /> Share
        </Button>
      </div>
    </div>
  );
}
