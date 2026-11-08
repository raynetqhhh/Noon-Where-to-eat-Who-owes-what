import { ArrowLeft, Pencil, Plus, Rocket, Trash2, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { addCrewMember, deleteCrew, getCrew, removeCrewMember, updateCrew, updateCrewMember } from '../../api/me.js';
import Avatar from '../../components/ui/Avatar.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import DietaryPicker from '../../components/ui/DietaryPicker.jsx';
import { ErrorMessage, PageLoader } from '../../components/ui/Feedback.jsx';
import { Input } from '../../components/ui/Field.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { tagEmoji, tagLabel } from '../../utils/dietary.js';
import { centsToInput, formatCents, toCents } from '../../utils/money.js';

export default function CrewDetailPage() {
  const { crewId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: crew, error, loading, reload, setData } = useAsync(() => getCrew(crewId), [crewId]);

  const [memberModal, setMemberModal] = useState(null); // null | { id?, displayName, dietary }
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ name: '', budget: '', meetingPoint: '' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);

  if (loading && !crew) return <PageLoader />;
  if (error && !crew) return <ErrorMessage error={error} onRetry={reload} />;

  const keepFairness = (updated) => setData((old) => ({ ...updated, fairness: old.fairness, lunchCount: old.lunchCount }));

  const saveMember = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const body = { displayName: memberModal.displayName.trim(), dietary: memberModal.dietary };
      const updated = memberModal.id ? await updateCrewMember(crew.id, memberModal.id, body) : await addCrewMember(crew.id, body);
      keepFairness(updated);
      setMemberModal(null);
    } catch (err) {
      setFormError(err);
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (m) => {
    if (!confirm(`Remove ${m.displayName} from ${crew.name}?`)) return;
    try {
      keepFairness(await removeCrewMember(crew.id, m.id));
      toast(`${m.displayName} removed`);
    } catch (err) {
      toast(err.message, { tone: 'error' });
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const budget = settings.budget ? toCents(settings.budget) : null;
      keepFairness(
        await updateCrew(crew.id, {
          name: settings.name.trim(),
          budgetPerHeadCents: budget > 0 ? budget : null,
          meetingPoint: settings.meetingPoint.trim() || null,
        })
      );
      setSettingsOpen(false);
    } catch (err) {
      setFormError(err);
    } finally {
      setBusy(false);
    }
  };

  const removeCrew = async () => {
    if (!confirm(`Delete ${crew.name}? Past lunches stay in your history.`)) return;
    await deleteCrew(crew.id);
    toast('Crew deleted');
    navigate('/app/crews');
  };

  const topWins = Math.max(1, ...crew.fairness.map((r) => r.wins));

  return (
    <div className="space-y-6">
      <Link to="/app/crews" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> Crews
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{crew.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {crew.lunchCount} lunch{crew.lunchCount === 1 ? '' : 'es'} together
            {crew.budgetPerHeadCents && ` · ${formatCents(crew.budgetPerHeadCents)}/head`}
            {crew.meetingPoint && ` · meet at ${crew.meetingPoint}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {crew.isOwner && (
            <Button
              variant="secondary"
              onClick={() => {
                setSettings({ name: crew.name, budget: centsToInput(crew.budgetPerHeadCents), meetingPoint: crew.meetingPoint ?? '' });
                setFormError(null);
                setSettingsOpen(true);
              }}
            >
              <Pencil size={16} /> Edit
            </Button>
          )}
          <Button to={`/app/new?crew=${crew.id}`}>
            <Rocket size={16} /> Start lunch with crew
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Members"
            subtitle="Dietary needs are used to flag places before anyone votes."
            action={
              crew.isOwner && (
                <Button size="sm" variant="secondary" onClick={() => { setFormError(null); setMemberModal({ displayName: '', dietary: [] }); }}>
                  <Plus size={15} /> Add
                </Button>
              )
            }
          />
          <ul className="divide-y divide-line">
            {crew.members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <Avatar name={m.displayName} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {m.displayName} {m.isYou && <span className="text-muted">(you)</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {m.dietary.length ? m.dietary.map((d) => `${tagEmoji(d)} ${tagLabel(d)}`).join(' · ') : 'No dietary needs'}
                  </p>
                </div>
                {m.hasAccount && <Badge tone="good">Account</Badge>}
                {crew.isOwner && (
                  <>
                    <button type="button" aria-label={`Edit ${m.displayName}`} onClick={() => { setFormError(null); setMemberModal({ id: m.id, displayName: m.displayName, dietary: m.dietary }); }} className="rounded-lg p-2 text-muted hover:bg-surface-2">
                      <Pencil size={15} />
                    </button>
                    {!m.isYou && (
                      <button type="button" aria-label={`Remove ${m.displayName}`} onClick={() => removeMember(m)} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-bad">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Fairness board" subtitle="Whose pick wins most often. Ties go to whoever’s been losing." />
          {crew.fairness.length === 0 ? (
            <p className="text-sm text-muted">Decide a lunch with this crew to start the board.</p>
          ) : (
            <ol className="space-y-3">
              {crew.fairness.map((r, i) => (
                <li key={r.key} className="flex items-center gap-3">
                  <span className="w-5 text-center text-sm font-bold text-muted">{i === 0 ? <Trophy size={16} className="text-sun" /> : i + 1}</span>
                  <Avatar name={r.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{r.name}</span>
                      <span className="tabular-nums text-muted">
                        {r.wins}/{r.lunches} wins
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                      <div className="h-full rounded-full bg-sun" style={{ width: `${(r.wins / topWins) * 100}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {crew.isOwner && (
        <div className="border-t border-line pt-6">
          <Button variant="danger" onClick={removeCrew}>
            <Trash2 size={16} /> Delete crew
          </Button>
        </div>
      )}

      <Modal open={Boolean(memberModal)} onClose={() => setMemberModal(null)} title={memberModal?.id ? 'Edit member' : 'Add member'}>
        {memberModal && (
          <form onSubmit={saveMember} className="space-y-4">
            <Input label="First name" value={memberModal.displayName} onChange={(e) => setMemberModal((m) => ({ ...m, displayName: e.target.value }))} maxLength={40} required autoFocus />
            <DietaryPicker label="Dietary needs" value={memberModal.dietary} onChange={(dietary) => setMemberModal((m) => ({ ...m, dietary }))} />
            <ErrorMessage error={formError} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMemberModal(null)}>Cancel</Button>
              <Button type="submit" loading={busy} disabled={!memberModal.displayName.trim()}>Save</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Crew settings">
        <form onSubmit={saveSettings} className="space-y-4">
          <Input label="Crew name" value={settings.name} onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))} maxLength={60} required />
          <Input label="Budget per head" prefix="$" inputMode="decimal" value={settings.budget} onChange={(e) => setSettings((s) => ({ ...s, budget: e.target.value }))} />
          <Input label="Meeting point" value={settings.meetingPoint} onChange={(e) => setSettings((s) => ({ ...s, meetingPoint: e.target.value }))} maxLength={120} />
          <ErrorMessage error={formError} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button type="submit" loading={busy}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
