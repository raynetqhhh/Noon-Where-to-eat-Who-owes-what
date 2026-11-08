import { Lock, LockOpen, Power, RotateCcw, Scale, Timer } from 'lucide-react';
import { useState } from 'react';
import { decide, updateSession } from '../../api/sessions.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../ui/Button.jsx';
import { Card, CardHeader } from '../ui/Card.jsx';

const TIMERS = [2, 5, 10, 15];

/** Host-only panel: decide fairly, lock voting, countdown, close. */
export default function HostControls({ session, onChanged }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(null);

  const run = async (key, action, message) => {
    setBusy(key);
    try {
      await action();
      await onChanged();
      if (message) toast(message);
    } catch (err) {
      toast(err.message, { tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const voting = session.status === 'voting';
  const closed = session.status === 'closed';
  const hasPlaces = session.suggestions.length > 0;

  return (
    <Card>
      <CardHeader title="Host controls" subtitle="Keep things moving. Only you can see this." />
      <div className="flex flex-wrap gap-2">
        {voting && (
          <Button
            onClick={() => run('decide', () => decide(session.code, { auto: true }), 'Decided! 🎉')}
            loading={busy === 'decide'}
            disabled={!hasPlaces}
          >
            <Scale size={16} /> Decide fairly
          </Button>
        )}
        {voting && (
          <Button
            variant="secondary"
            loading={busy === 'lock'}
            onClick={() =>
              run(
                'lock',
                () => updateSession(session.code, { isLocked: !session.isLocked }),
                session.isLocked ? 'Voting unlocked' : 'Voting locked'
              )
            }
          >
            {session.isLocked ? <LockOpen size={16} /> : <Lock size={16} />}
            {session.isLocked ? 'Unlock voting' : 'Lock voting'}
          </Button>
        )}
        {session.status === 'decided' && (
          <Button
            variant="secondary"
            loading={busy === 'reopen'}
            onClick={() => run('reopen', () => decide(session.code, { suggestionId: null }), 'Voting reopened')}
          >
            <RotateCcw size={16} /> Reopen voting
          </Button>
        )}
        {session.status !== 'settled' && (
          <Button
            variant={closed ? 'secondary' : 'danger'}
            loading={busy === 'close'}
            onClick={() =>
              run(
                'close',
                () => updateSession(session.code, { status: closed ? 'open' : 'closed' }),
                closed ? 'Lunch reopened' : 'Lunch closed'
              )
            }
          >
            <Power size={16} /> {closed ? 'Reopen lunch' : 'Close lunch'}
          </Button>
        )}
      </div>

      {voting && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
            <Timer size={15} aria-hidden /> Voting timer:
          </span>
          {TIMERS.map((m) => (
            <Button
              key={m}
              size="sm"
              variant="secondary"
              loading={busy === `t${m}`}
              onClick={() => run(`t${m}`, () => updateSession(session.code, { votingMinutes: m }), `${m}-minute countdown started`)}
            >
              {m} min
            </Button>
          ))}
          {session.votingDeadline && (
            <Button
              size="sm"
              variant="ghost"
              loading={busy === 'tclear'}
              onClick={() => run('tclear', () => updateSession(session.code, { votingMinutes: null }), 'Timer cleared')}
            >
              Clear
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
