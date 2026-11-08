import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import Button from '../../components/ui/Button.jsx';
import { ErrorMessage } from '../../components/ui/Feedback.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import AuthShell from './AuthShell.jsx';

const safeNext = (next) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/app');

export default function SignUpPage() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'What should your friends call you?';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email';
    if (form.password.length < 8) e.password = 'Use at least 8 characters';
    if (form.confirm !== form.password) e.confirm = 'Passwords don’t match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setError(null);
    try {
      const { session } = await signUp(form.email.trim(), form.password, form.name.trim().slice(0, 40));
      if (session) navigate(next, { replace: true });
      else setCheckEmail(true); // email confirmation is switched on in Supabase
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  if (checkEmail) {
    return (
      <AuthShell title="Check your email">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-ok-soft text-ok">
            <MailCheck size={26} aria-hidden />
          </div>
          <p className="mt-4 text-sm text-muted">
            We sent a confirmation link to <b className="text-ink">{form.email}</b>. Tap it to finish creating your account.
          </p>
          <Button to="/signin" variant="secondary" className="mt-6">
            Back to sign in
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save your lunch history, crews and who owes what."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/signin" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="First name"
          hint="Shown to friends in a lunch. First names keep things private."
          autoComplete="given-name"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          maxLength={40}
        />
        <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint="At least 8 characters"
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
        />
        <ErrorMessage error={error} />
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Create account
        </Button>
        <p className="text-center text-xs text-muted">You can add dietary needs and a PayNow ID in Settings later.</p>
      </form>
    </AuthShell>
  );
}
