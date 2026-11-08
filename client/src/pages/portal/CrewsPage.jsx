import { ArrowRight, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { firstFieldError } from '../../api/client.js';
import { createCrew, getCrews } from '../../api/me.js';
import { AvatarStack } from '../../components/ui/Avatar.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card, EmptyState, PageHeader } from '../../components/ui/Card.jsx';
import { ErrorMessage, Skeleton } from '../../components/ui/Feedback.jsx';
import { Input } from '../../components/ui/Field.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { formatCents, toCents } from '../../utils/money.js';

export default function CrewsPage() {
  const navigate = useNavigate();
  const { data: crews, error, loading, reload } = useAsync(getCrews, []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', budget: '', meetingPoint: '' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const budget = form.budget ? toCents(form.budget) : null;
      const crew = await createCrew({
        name: form.name.trim(),
        budgetPerHeadCents: budget > 0 ? budget : null,
        meetingPoint: form.meetingPoint.trim() || null,
      });
      navigate(`/app/crews/${crew.id}`);
    } catch (err) {
      setFormError(firstFieldError(err) ? new Error(firstFieldError(err)) : err);
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Crews"
        subtitle="Saved groups you eat with regularly, with everyone’s dietary needs and a budget."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> New crew
          </Button>
        }
      />
      <ErrorMessage error={error} onRetry={reload} />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : !crews?.length ? (
        <EmptyState icon={Users} title="No crews yet" action={<Button onClick={() => setOpen(true)}>Create a crew</Button>}>
          For example “CCA lunch crew” or “Team Thursday”. Start lunches with them in one tap.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {crews.map((c) => (
            <li key={c.id}>
              <Card as={Link} to={`/app/crews/${c.id}`} className="block h-full transition hover:border-brand/50">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold">{c.name}</h2>
                  {c.isOwner ? <Badge tone="brand">Owner</Badge> : <Badge>Member</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {c.members.length} member{c.members.length === 1 ? '' : 's'}
                  {c.budgetPerHeadCents && ` · ${formatCents(c.budgetPerHeadCents)}/head`}
                  {c.meetingPoint && ` · ${c.meetingPoint}`}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <AvatarStack names={c.members.map((m) => m.displayName)} />
                  <ArrowRight size={16} className="text-muted" />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New crew">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Crew name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="CCA lunch crew" maxLength={60} required autoFocus />
          <Input label="Budget per head (optional)" prefix="$" inputMode="decimal" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} placeholder="8.00" />
          <Input label="Usual meeting point (optional)" value={form.meetingPoint} onChange={(e) => setForm((f) => ({ ...f, meetingPoint: e.target.value }))} placeholder="Block 52 lobby" maxLength={120} />
          <ErrorMessage error={formError} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={busy} disabled={!form.name.trim()}>Create crew</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
