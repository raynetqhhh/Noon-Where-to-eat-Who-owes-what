import { Rocket } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { firstFieldError } from '../../api/client.js';
import { getCrews } from '../../api/me.js';
import { createSession } from '../../api/sessions.js';
import { Chip } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card, PageHeader } from '../../components/ui/Card.jsx';
import { ErrorMessage } from '../../components/ui/Feedback.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { tagLabel } from '../../utils/dietary.js';
import { centsToInput, toCents } from '../../utils/money.js';

const TIMERS = [null, 5, 10, 15, 30];

export default function NewLunchPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { profile } = useAuth();
  const { data: crews } = useAsync(getCrews, []);

  const [title, setTitle] = useState(() => `${new Date().toLocaleDateString('en-SG', { weekday: 'long' })} lunch`);
  const [crewId, setCrewId] = useState(params.get('crew') ?? '');
  const [budget, setBudget] = useState('');
  const [minutes, setMinutes] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const crew = crews?.find((c) => c.id === crewId);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const budgetCents = budget ? toCents(budget) : undefined;
      const { session } = await createSession({
        title: title.trim() || 'Lunch',
        crewId: crewId || undefined,
        budgetPerHeadCents: budgetCents > 0 ? budgetCents : undefined,
        votingMinutes: minutes ?? undefined,
      });
      navigate(`/s/${session.code}?share=1`);
    } catch (err) {
      setError(firstFieldError(err) ? new Error(firstFieldError(err)) : err);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Start a lunch" subtitle="Takes ten seconds. You’ll get a link to share." />
      <Card>
        <form onSubmit={submit} className="space-y-5">
          <Input label="Name" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />

          <Select
            label="Crew (optional)"
            value={crewId}
            onChange={(e) => {
              setCrewId(e.target.value);
              const c = crews?.find((x) => x.id === e.target.value);
              if (c?.budgetPerHeadCents) setBudget(centsToInput(c.budgetPerHeadCents));
            }}
            hint={crews?.length === 0 ? 'Save a regular group under Crews to reuse it here.' : 'Crew members can tap their name to join.'}
          >
            <option value="">No crew, just a one-off</option>
            {crews?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.members.length})
              </option>
            ))}
          </Select>

          {crew && (
            <div className="rounded-xl bg-surface-2 p-3 text-sm">
              <p className="font-medium">{crew.name}</p>
              <p className="text-muted">
                {crew.members.map((m) => m.displayName + (m.dietary.length ? ` (${m.dietary.map(tagLabel).join(', ')})` : '')).join(' · ')}
              </p>
            </div>
          )}

          <Input label="Budget per head (optional)" prefix="$" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="10.00" hint="Places over budget get flagged." />

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Voting time limit</legend>
            <div className="flex flex-wrap gap-2">
              {TIMERS.map((m) => (
                <Chip key={m ?? 'none'} pressed={minutes === m} onClick={() => setMinutes(m)}>
                  {m ? `${m} min` : 'No limit'}
                </Chip>
              ))}
            </div>
          </fieldset>

          {profile?.dietary?.length > 0 && (
            <p className="text-xs text-muted">Your dietary needs ({profile.dietary.map(tagLabel).join(', ')}) are included automatically.</p>
          )}

          <ErrorMessage error={error} />
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            <Rocket size={18} /> Create & share link
          </Button>
        </form>
      </Card>
    </div>
  );
}
