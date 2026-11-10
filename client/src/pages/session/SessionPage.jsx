import { Keyboard, MapPin, Plus, Radio, Receipt, Share2, Sparkles, Users } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { castVote, decide, removeSuggestion, retractVote } from '../../api/sessions.js';
import AddSuggestionModal from '../../components/session/AddSuggestionModal.jsx';
import HostControls from '../../components/session/HostControls.jsx';
import JoinPanel from '../../components/session/JoinPanel.jsx';
import LunchClock from '../../components/session/LunchClock.jsx';
import ShareInviteModal from '../../components/session/ShareInviteModal.jsx';
import ShortcutHelp from '../../components/session/ShortcutHelp.jsx';
import SuggestionCard from '../../components/session/SuggestionCard.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { Badge, Chip, StatusBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card, EmptyState } from '../../components/ui/Card.jsx';
import { ErrorMessage, PageLoader } from '../../components/ui/Feedback.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useHotkeys } from '../../hooks/useHotkeys.js';
import { useSession } from '../../hooks/useSession.js';
import { MOODS, peopleNotCovered, tagEmoji } from '../../utils/dietary.js';
import { formatCents } from '../../utils/money.js';
import { cuisineLabel, tableFavourites } from '../../utils/taste.js';

const SHORTCUTS = [
  ['1–9', 'Vote for a place'],
  ['N', 'Suggest a place'],
  ['S', 'Share invite'],
  ['Ctrl/⌘ + Z', 'Undo last vote'],
  ['?', 'Show shortcuts'],
];

export default function SessionPage() {
  const code = useParams().code.toUpperCase();
  const [params, setParams] = useSearchParams();
  const { session, error, loading, notify, isLive } = useSession(code);
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(params.get('share') === '1');
  const [helpOpen, setHelpOpen] = useState(false);
  const [filters, setFilters] = useState({ fitsEveryone: false, withinBudget: false, moods: [] });
  const undoRef = useRef(null);

  const visible = useMemo(() => {
    if (!session) return [];
    return session.suggestions.filter((s) => {
      if (filters.fitsEveryone && peopleNotCovered(s.tags, session.participants).length) return false;
      if (filters.withinBudget && session.budgetPerHeadCents && s.pricePerHeadCents > session.budgetPerHeadCents) return false;
      if (filters.moods.length && !filters.moods.some((m) => s.tags.includes(m))) return false;
      return true;
    });
  }, [session, filters]);

  const me = session?.me;
  const canVote = Boolean(me && session?.votingOpen);

  const act = async (fn, message, undo) => {
    try {
      await fn();
      await notify();
      undoRef.current = undo ?? null;
      if (message) toast(message, undo ? { action: { label: 'Undo', onClick: runUndo } } : undefined);
    } catch (err) {
      toast(err.message, { tone: 'error' });
    }
  };

  async function runUndo() {
    const undo = undoRef.current;
    undoRef.current = null;
    if (!undo) return;
    try {
      await undo();
      await notify();
      toast('Undone');
    } catch (err) {
      toast(err.message, { tone: 'error' });
    }
  }

  const restore = (kind, previousId) => () => (previousId ? castVote(code, previousId, kind) : retractVote(code, kind));

  const toggle = (s, kind) => {
    if (!canVote) return;
    const field = kind === 'vote' ? 'votedByMe' : 'vetoedByMe';
    const previous = session.suggestions.find((x) => x[field])?.id ?? null;
    const removing = previous === s.id;
    const label = kind === 'vote' ? 'Vote' : 'Veto';
    act(
      () => (removing ? retractVote(code, kind) : castVote(code, s.id, kind)),
      removing ? `${label} removed` : `${label} → ${s.name}`,
      restore(kind, previous)
    );
  };

  useHotkeys(
    {
      n: () => canVote && setAddOpen(true),
      s: () => setShareOpen(true),
      '?': () => setHelpOpen(true),
      'mod+z': runUndo,
      ...Object.fromEntries(
        Array.from({ length: 9 }, (_, i) => [String(i + 1), () => visible[i] && toggle(visible[i], 'vote')])
      ),
    },
    Boolean(session)
  );

  if (loading) return <PageLoader />;
  if (error && !session) {
    return (
      <div className="space-y-4 pt-10">
        <ErrorMessage error={error} />
        <Button to="/join" variant="secondary">
          Try another code
        </Button>
      </div>
    );
  }

  const winner = session.suggestions.find((s) => s.id === session.decidedSuggestionId);
  const maxVotes = Math.max(1, ...session.suggestions.map((s) => s.voteCount));
  const moodsInUse = MOODS.filter((m) => session.suggestions.some((s) => s.tags.includes(m.id)));
  const needs = [...new Set(session.participants.flatMap((p) => p.dietary))];
  const tableTaste = tableFavourites(session.participants);

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="animate-rise">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={session.status} />
          {session.crew && (
            <Badge tone="info">
              <Users size={11} /> {session.crew.name}
            </Badge>
          )}
          {session.budgetPerHeadCents && <Badge>Budget {formatCents(session.budgetPerHeadCents)}/head</Badge>}
          {isLive && (
            <Badge tone="good">
              <Radio size={11} /> Live
            </Badge>
          )}
          {session.isLocked && session.status === 'voting' && <Badge tone="bad">Voting locked</Badge>}
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl">{session.title}</h1>
            <p className="mt-0.5 text-sm text-muted">
              Code <span className="font-mono font-semibold tracking-wider text-ink">{session.code}</span>
              {session.crew?.meetingPoint && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <MapPin size={12} /> Meet at {session.crew.meetingPoint}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" aria-label="Keyboard shortcuts" className="hidden sm:inline-flex" onClick={() => setHelpOpen(true)}>
              <Keyboard size={18} />
            </Button>
            <Button variant="secondary" onClick={() => setShareOpen(true)}>
              <Share2 size={16} /> Invite
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <LunchClock deadline={session.votingDeadline} votingOpen={session.status === 'voting'} />
        </div>
      </section>

      {/* People */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {session.participants.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <Avatar name={p.displayName} src={p.avatarUrl} size="sm" />
              <span className="text-sm">
                {p.displayName}
                {p.id === me?.id && <span className="text-muted"> (you)</span>}
                {p.isHost && <span className="ml-1 text-xs text-brand">host</span>}
                {p.dietary.length > 0 && <span className="ml-1" title={p.dietary.join(', ')}>{p.dietary.map(tagEmoji).join('')}</span>}
              </span>
            </div>
          ))}
        </div>
        {tableTaste.length > 0 && (
          <p className="rule-dashed mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-3 text-sm">
            <span className="eyebrow">The table likes</span>
            {tableTaste.map((t) => (
              <span key={t.id}>
                {cuisineLabel(t.id)} <span className="font-mono text-xs text-muted">×{t.count}</span>
              </span>
            ))}
          </p>
        )}
      </Card>

      {!me && !session.isExpired && session.status !== 'closed' && session.status !== 'settled' && (
        <JoinPanel session={session} onJoined={notify} />
      )}

      {session.status === 'closed' && (
        <Card className="bg-surface-2 text-sm">This lunch was closed by the host.</Card>
      )}

      {/* Decision */}
      {winner && (
        <Card className="animate-rise border-brand bg-brand-soft/50">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand">
            <Sparkles size={14} /> We’re eating at
          </p>
          <h2 className="mt-1 font-display text-3xl font-extrabold">{winner.name}</h2>
          {winner.location && <p className="text-sm text-muted">{winner.location}</p>}
          {session.decisionReason && <p className="mt-2 text-sm">{session.decisionReason}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button to={`/s/${code}/bill`}>
              <Receipt size={16} /> {session.bill ? 'View the bill' : 'Split the bill'}
            </Button>
            <Button
              variant="secondary"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${winner.name} ${winner.location ?? ''}`)}`}
            >
              <MapPin size={16} /> Directions
            </Button>
          </div>
        </Card>
      )}

      {me?.isHost && <HostControls session={session} onChanged={notify} />}

      {/* Places */}
      <section aria-labelledby="places-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="places-heading" className="font-display text-xl font-semibold">
            Places <span className="text-muted">({session.suggestions.length})</span>
          </h2>
          {canVote && (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus size={16} /> Suggest
            </Button>
          )}
        </div>

        {session.votingClosedReason && session.status === 'voting' && (
          <p className="mb-3 rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">{session.votingClosedReason}</p>
        )}

        {session.suggestions.length > 1 && (
          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filters">
            {needs.length > 0 && (
              <Chip pressed={filters.fitsEveryone} onClick={() => setFilters((f) => ({ ...f, fitsEveryone: !f.fitsEveryone }))}>
                ✅ Suits everyone
              </Chip>
            )}
            {session.budgetPerHeadCents && (
              <Chip pressed={filters.withinBudget} onClick={() => setFilters((f) => ({ ...f, withinBudget: !f.withinBudget }))}>
                💸 Within budget
              </Chip>
            )}
            {moodsInUse.map((m) => (
              <Chip
                key={m.id}
                pressed={filters.moods.includes(m.id)}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    moods: f.moods.includes(m.id) ? f.moods.filter((x) => x !== m.id) : [...f.moods, m.id],
                  }))
                }
              >
                {m.emoji} {m.label}
              </Chip>
            ))}
          </div>
        )}

        {session.suggestions.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No places yet"
            action={canVote && <Button onClick={() => setAddOpen(true)}>Suggest the first place</Button>}
          >
            Suggest a few spots, then everyone votes. You get one vote and one veto.
          </EmptyState>
        ) : visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            No places match these filters.
          </p>
        ) : (
          <ul className="space-y-3">
            {visible.map((s, i) => (
              <SuggestionCard
                key={s.id}
                s={s}
                rank={i + 1}
                hotkey={canVote && i < 9 ? String(i + 1) : null}
                participants={session.participants}
                me={me}
                budgetCents={session.budgetPerHeadCents}
                maxVotes={maxVotes}
                canVote={canVote}
                isHost={me?.isHost}
                isWinner={s.id === session.decidedSuggestionId}
                onVote={() => toggle(s, 'vote')}
                onVeto={() => toggle(s, 'veto')}
                onRemove={() => act(() => removeSuggestion(code, s.id), `Removed ${s.name}`)}
                onPick={
                  me?.isHost && session.status === 'voting'
                    ? () => act(() => decide(code, { suggestionId: s.id }), `Picked ${s.name}`)
                    : null
                }
              />
            ))}
          </ul>
        )}
        {canVote && <p className="mt-4 text-center text-xs text-muted">You have one vote and one veto. Tap again to take it back.</p>}
      </section>

      {!session.isExpired && session.participants.length > 0 && session.status === 'decided' && !me && (
        <p className="text-center text-sm text-muted">
          Were you there? <Link to="/signin" className="font-semibold text-brand">Sign in</Link> to see what you owe.
        </p>
      )}

      <AddSuggestionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        code={code}
        existingNames={new Set(session.suggestions.map((s) => s.name.toLowerCase()))}
        onAdded={(s) => {
          notify();
          toast(`Added ${s.name}`);
        }}
      />
      <ShareInviteModal
        open={shareOpen}
        onClose={() => {
          setShareOpen(false);
          if (params.get('share')) setParams({}, { replace: true });
        }}
        session={session}
      />
      <ShortcutHelp open={helpOpen} onClose={() => setHelpOpen(false)} shortcuts={SHORTCUTS} />
    </div>
  );
}
