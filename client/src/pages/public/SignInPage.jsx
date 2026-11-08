import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import Button from '../../components/ui/Button.jsx';
import { ErrorMessage } from '../../components/ui/Feedback.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import AuthShell from './AuthShell.jsx';

/** Only allow redirects within this site. */
const safeNext = (next) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/app');

export default function SignInPage() {
  const { user, signIn, sendPasswordReset } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      setError(new Error('Type your email above first, then tap "Forgot password".'));
      return;
    }
    try {
      await sendPasswordReset(email.trim());
      toast('Check your email for a link to reset your password.');
    } catch (err) {
      setError(err);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see your lunches, payments and crews."
      footer={
        <>
          New to Noon?{' '}
          <Link to={`/signup${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end">
          <button type="button" onClick={forgot} className="text-sm font-medium text-brand hover:underline">
            Forgot password?
          </button>
        </div>
        <ErrorMessage error={error} />
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Sign in
        </Button>
      </form>
      <p className="mt-5 text-center text-xs text-muted">
        Just joining a friend’s lunch?{' '}
        <Link to="/join" className="font-semibold text-ink underline">
          Join as a guest
        </Link>
      </p>
    </AuthShell>
  );
}
