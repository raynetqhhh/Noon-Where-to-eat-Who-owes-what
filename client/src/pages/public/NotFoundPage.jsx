import Button from '../../components/ui/Button.jsx';

export default function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-7xl font-extrabold text-brand">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold">This table doesn’t exist</h1>
      <p className="mt-1 text-muted">The page you’re looking for has moved or never existed.</p>
      <Button to="/" className="mt-6">
        Back home
      </Button>
    </section>
  );
}
