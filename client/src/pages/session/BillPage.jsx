import { ArrowLeft, Pencil, Receipt } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import BillEditor from '../../components/bill/BillEditor.jsx';
import BillSummary from '../../components/bill/BillSummary.jsx';
import SummaryCard from '../../components/bill/SummaryCard.jsx';
import JoinPanel from '../../components/session/JoinPanel.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/Card.jsx';
import { ErrorMessage, PageLoader } from '../../components/ui/Feedback.jsx';
import { useSession } from '../../hooks/useSession.js';
import { formatCents } from '../../utils/money.js';

export default function BillPage() {
  const code = useParams().code.toUpperCase();
  const { session, error, loading, notify } = useSession(code);
  const [editing, setEditing] = useState(false);

  if (loading) return <PageLoader />;
  if (error && !session) return <ErrorMessage error={error} />;

  const restaurant = session.suggestions.find((s) => s.id === session.decidedSuggestionId);
  const isHost = session.me?.isHost;
  const myShare = session.bill?.shares.find((s) => s.participantId === session.me?.id);
  const myDebts = session.bill?.settlements.filter((s) => s.fromParticipantId === session.me?.id && !s.isPaid) ?? [];

  return (
    <div className="space-y-5">
      <Link to={`/s/${code}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> Back to voting
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <StatusBadge status={session.status} />
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">The bill</h1>
          {restaurant && <p className="text-sm text-muted">{session.title} at {restaurant.name}</p>}
        </div>
        {isHost && session.bill && !editing && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil size={16} /> Edit bill
          </Button>
        )}
      </div>

      {!restaurant ? (
        <EmptyState icon={Receipt} title="No restaurant picked yet" action={<Button to={`/s/${code}`}>Go vote</Button>}>
          Once the group decides where to eat, the host can enter the bill here.
        </EmptyState>
      ) : isHost && (editing || !session.bill) ? (
        <BillEditor
          session={session}
          onSaved={async () => {
            setEditing(false);
            await notify();
          }}
          onCancel={session.bill ? () => setEditing(false) : null}
        />
      ) : !session.bill ? (
        <>
          {!session.me && <JoinPanel session={session} onJoined={notify} />}
          <EmptyState icon={Receipt} title="Waiting for the bill">
            The host will enter it after lunch. This page updates by itself.
          </EmptyState>
        </>
      ) : (
        <>
          {myShare && (
            <div className={`rounded-2xl p-4 ${myDebts.length ? 'bg-bad-soft' : 'bg-ok-soft'}`}>
              <p className="text-sm">
                Your share is <b className="tabular-nums">{formatCents(myShare.owedCents)}</b>.{' '}
                {myDebts.length
                  ? `You still owe ${myDebts.map((d) => `${d.toName} ${formatCents(d.amountCents)}`).join(' and ')}.`
                  : 'You’re all square. 🎉'}
              </p>
            </div>
          )}
          <BillSummary session={session} restaurantName={restaurant.name} onChanged={notify} />
          <SummaryCard session={session} restaurant={restaurant} />
        </>
      )}
    </div>
  );
}
