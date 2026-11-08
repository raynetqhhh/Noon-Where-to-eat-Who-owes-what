import { LogIn, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { firstFieldError } from '../../api/client.js';
import { joinSession } from '../../api/sessions.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { saveToken } from '../../utils/tokenStorage.js';
import { Chip } from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';
import DietaryPicker from '../ui/DietaryPicker.jsx';
import { ErrorMessage } from '../ui/Feedback.jsx';
import { Input } from '../ui/Field.jsx';

/** Join with just a name (guest) or with your account in one tap. */
export default function JoinPanel({ session, onJoined }) {
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [dietary, setDietary] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const taken = new Set(session.participants.map((p) => p.displayName.toLowerCase()));
  const unclaimed = (session.crew?.members ?? []).filter((m) => !taken.has(m.displayName.toLowerCase()));

  const join = async (body) => {
    setBusy(true);
    setError(null);
    try {
      const { token } = await joinSession(session.code, body);
      if (token) saveToken(session.code, token);
      await onJoined();
    } catch (err) {
      setError(firstFieldError(err) ? new Error(firstFieldError(err)) : err);
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    return (
      <Card className="border-brand/40 bg-brand-soft/40">
        <h2 className="font-display text-lg font-semibold">You’re invited to {session.title}</h2>
        <p className="mt-1 text-sm text-muted">Join to suggest places and vote. Your dietary needs from Settings come with you.</p>
        <ErrorMessage error={error} />
        <Button className="mt-4" loading={busy} onClick={() => join({})}>
          <UserPlus size={16} /> Join as {profile?.displayName ?? 'me'}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="border-brand/40">
      <h2 className="font-display text-lg font-semibold">Join {session.title}</h2>
      <p className="mt-1 text-sm text-muted">Just a first name. No account needed.</p>

      {unclaimed.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">From the {session.crew.name} crew? Tap your name:</p>
          <div className="flex flex-wrap gap-2">
            {unclaimed.map((m) => (
              <Chip key={m.id} onClick={() => join({ crewMemberId: m.id })} disabled={busy}>
                {m.displayName}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          join({ displayName: name.trim(), dietary });
        }}
      >
        <Input label="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="given-name" required />
        <DietaryPicker label="Any dietary needs? (optional)" value={dietary} onChange={setDietary} />
        <ErrorMessage error={error} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={busy} disabled={!name.trim()}>
            Join lunch
          </Button>
          <Link to={`/signin?next=/s/${session.code}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
            <LogIn size={14} /> I have an account
          </Link>
        </div>
      </form>
    </Card>
  );
}
