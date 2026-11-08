import { AlertTriangle, Ban, Crown, ExternalLink, MapPin, ThumbsUp, Trash2 } from 'lucide-react';
import { peopleNotCovered, tagEmoji, tagLabel } from '../../utils/dietary.js';
import { formatCents } from '../../utils/money.js';
import { AvatarStack } from '../ui/Avatar.jsx';
import { Badge } from '../ui/Badge.jsx';

export default function SuggestionCard({
  s,
  rank,
  hotkey,
  participants,
  me,
  budgetCents,
  maxVotes,
  canVote,
  isHost,
  isWinner,
  onVote,
  onVeto,
  onRemove,
  onPick,
}) {
  const notCovered = peopleNotCovered(s.tags, participants);
  const overBudget = budgetCents && s.pricePerHeadCents && s.pricePerHeadCents > budgetCents;
  const vetoed = s.vetoCount > 0;
  const voterNames = s.voterIds.map((id) => participants.find((p) => p.id === id)?.displayName ?? '?');
  const canRemove = canVote && me && (isHost || s.suggestedBy === me.id);
  const pct = maxVotes ? (s.voteCount / maxVotes) * 100 : 0;
  const showDeal = s.deal && participants.length >= 4;

  return (
    <li
      className={`animate-rise rounded-2xl border bg-surface p-4 transition ${
        isWinner ? 'border-brand ring-2 ring-brand/30' : rank === 1 && !vetoed && s.voteCount > 0 ? 'border-brand/50' : 'border-line'
      } ${vetoed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-bold text-muted" aria-hidden>
          {isWinner ? <Crown size={14} className="text-brand" /> : rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className={`font-semibold ${vetoed ? 'line-through' : ''}`}>{s.name}</h3>
            {s.isSponsored && <Badge tone="sun">Sponsored</Badge>}
            {vetoed && (
              <Badge tone="bad">
                <Ban size={11} /> Vetoed
              </Badge>
            )}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
            {s.cuisine && <span>{s.cuisine}</span>}
            {s.pricePerHeadCents && (
              <span className={overBudget ? 'font-semibold text-bad' : ''}>
                ~{formatCents(s.pricePerHeadCents)}/head{overBudget ? ' · over budget' : ''}
              </span>
            )}
            {s.location && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={11} aria-hidden /> {s.location}
              </span>
            )}
            {s.url && (
              <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-brand hover:underline">
                Link <ExternalLink size={11} aria-hidden />
              </a>
            )}
          </p>
          {s.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {s.tags.map((t) => (
                <Badge key={t}>
                  <span aria-hidden>{tagEmoji(t)}</span> {tagLabel(t)}
                </Badge>
              ))}
            </div>
          )}
          {notCovered.length > 0 && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-bad">
              <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden />
              Not marked as suitable for {notCovered.map((p) => p.displayName).join(', ')}
            </p>
          )}
          {showDeal && <p className="mt-2 text-xs font-medium text-ok">🎁 Group deal: {s.deal}</p>}
        </div>
        <div className="text-right">
          <span className="font-display text-2xl font-bold tabular-nums">{s.voteCount}</span>
          <span className="block text-[11px] text-muted">vote{s.voteCount === 1 ? '' : 's'}</span>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {voterNames.length > 0 && <AvatarStack names={voterNames} max={4} />}
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {canRemove && (
            <button type="button" onClick={onRemove} aria-label={`Remove ${s.name}`} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-bad">
              <Trash2 size={16} />
            </button>
          )}
          {isHost && onPick && (
            <button type="button" onClick={onPick} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted hover:bg-surface-2 hover:text-ink">
              Pick this
            </button>
          )}
          {canVote && me && (
            <>
              <button
                type="button"
                aria-pressed={s.vetoedByMe}
                onClick={onVeto}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition ${
                  s.vetoedByMe ? 'border-bad bg-bad-soft text-bad' : 'border-line hover:bg-surface-2'
                }`}
              >
                <Ban size={15} aria-hidden /> {s.vetoedByMe ? 'Vetoed' : 'Veto'}
              </button>
              <button
                type="button"
                aria-pressed={s.votedByMe}
                onClick={onVote}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition ${
                  s.votedByMe ? 'bg-brand text-on-brand' : 'border border-brand text-brand hover:bg-brand-soft'
                }`}
              >
                <ThumbsUp size={15} aria-hidden /> {s.votedByMe ? 'Voted' : 'Vote'}
                {hotkey && <kbd className="ml-1 hidden rounded bg-black/10 px-1 text-[10px] sm:inline">{hotkey}</kbd>}
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
