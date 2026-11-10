import { ArrowRight, LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Avatar from '../../components/ui/Avatar.jsx';
import { Chip } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card, CardHeader, PageHeader } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function SettingsPage() {
  const { profile, user, changePassword, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

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

  const name = profile?.displayName ?? 'You';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader eyebrow="Account" title="Settings" />

      <Link
        to="/app/profile"
        className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-ink"
      >
        <Avatar name={name} src={profile?.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl">{name}</p>
          <p className="truncate text-sm text-muted">Photo, favourite food, dietary needs and PayNow</p>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-medium">
          Edit profile <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

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
        <CardHeader title="Sign-in" subtitle={user?.email} />
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

      <div className="rounded-2xl border border-dashed border-line p-5 text-sm text-muted">
        <p className="eyebrow mb-2">Privacy</p>
        <p>
          Noon only asks for first names. Your photo and favourite food are shown to people in lunches you join; allergies stay
          private. Lunch links expire after 24 hours for joining and voting. Your history stays in your portal so you can settle
          debts later.
        </p>
      </div>
    </div>
  );
}
