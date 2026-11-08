import { Ticket } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Field.jsx';

export default function JoinPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    // Accept a bare code or a pasted link like https://.../s/Q7M2KX
    const match = code.toUpperCase().match(/([A-Z0-9]{6})\/?$/);
    if (!match) {
      setError('Codes are 6 letters and numbers, like Q7M2KX');
      return;
    }
    navigate(`/s/${match[1]}`);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="animate-rise rounded-3xl border border-line bg-surface p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Ticket size={26} aria-hidden />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">Join a lunch</h1>
        <p className="mt-1 text-sm text-muted">Enter the code from your group chat. No account needed.</p>
        <form onSubmit={submit} className="mt-6 space-y-4 text-left">
          <Input
            label="Lunch code or link"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            placeholder="Q7M2KX"
            autoCapitalize="characters"
            autoFocus
            error={error}
          />
          <Button type="submit" size="lg" className="w-full">
            Find lunch
          </Button>
        </form>
      </div>
    </div>
  );
}
