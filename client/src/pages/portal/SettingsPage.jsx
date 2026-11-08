import { LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { firstFieldError } from '../../api/client.js';
import { updateMe } from '../../api/me.js';
import { Chip } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card, CardHeader, PageHeader } from '../../components/ui/Card.jsx';
import DietaryPicker from '../../components/ui/DietaryPicker.jsx';
import { ErrorMessage } from '../../components/ui/Feedback.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function SettingsPage() {
  const { profile, setProfile, user, changePassword, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ displayName: '', dietary: [], allergies: '', paynowId: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName,
        dietary: profile.dietary,
        allergies: profile.allergies ?? '',
        paynowId: profile.paynowId ?? '',
      });
    }
  }, [profile]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const updated = await updateMe({
        displayName: form.displayName.trim(),
        dietary: form.dietary,
        allergies: form.allergies.trim() || null,
        paynowId: form.paynowId.trim() || null,
      });
      setProfile(updated);
      toast('Profile saved');
    } catch (err) {
      setError(firstFieldError(err) ? new Error(firstFieldError(err)) : err);
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast('Use at least 8 characters', { tone: 'error' });
      return;
    }
    setPwBusy(true);
    try {
      await changePassword(password);
      setPassword('');
      toast('Password updated');
    } catch (err) {
      toast(err.message, { tone: 'error' });
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" />

      <Card>
        <CardHeader title="Profile" subtitle="This is what friends see in a lunch." />
        <form onSubmit={save} className="space-y-5">
          <Input label="First name" value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} maxLength={40} required />
          <DietaryPicker label="Dietary needs" value={form.dietary} onChange={(dietary) => setForm((f) => ({ ...f, dietary }))} />
          <Input label="Allergies (optional)" value={form.allergies} onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))} maxLength={200} placeholder="Peanuts, shellfish…" hint="Private for now. Shown to you as a reminder." />
          <Input label="PayNow number or UEN (optional)" value={form.paynowId} onChange={(e) => setForm((f) => ({ ...f, paynowId: e.target.value }))} maxLength={40} placeholder="9123 4567" hint="Included in payment reminders and shown to people who owe you." />
          <ErrorMessage error={error} />
          <Button type="submit" loading={busy}>Save profile</Button>
        </form>
      </Card>

      <Card>
        <CardHeader title="Appearance" />
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Theme">
          {[
            ['light', 'Light', Sun],
            ['dark', 'Dark', Moon],
            ['system', 'Match device', Monitor],
          ].map(([id, label, Icon]) => (
            <Chip key={id} pressed={theme === id} onClick={() => setTheme(id)}>
              <Icon size={14} aria-hidden /> {label}
            </Chip>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Account" subtitle={user?.email} />
        <form onSubmit={savePassword} className="flex flex-wrap items-end gap-3">
          <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="min-w-56 flex-1" />
          <Button type="submit" variant="secondary" loading={pwBusy} disabled={!password}>Update password</Button>
        </form>
        <div className="mt-6 border-t border-line pt-5">
          <Button
            variant="danger"
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
          >
            <LogOut size={16} /> Sign out
          </Button>
        </div>
      </Card>

      <Card className="bg-surface-2 text-sm text-muted">
        <p className="font-semibold text-ink">Privacy</p>
        <p className="mt-1">
          Noon only asks for first names. Lunch links expire after 24 hours for joining and voting. Your history stays in your portal
          so you can settle debts later. Guests’ data is only visible to people in the same lunch.
        </p>
      </Card>
    </div>
  );
}
