import {
  ArrowRight,
  BadgePercent,
  Ban,
  Check,
  Clock,
  Link2,
  Receipt,
  Scale,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import Button from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const STEPS = [
  { icon: Link2, title: 'Share one link', body: 'Start a lunch and drop the link in your group chat. Friends join with just a name. No app, no account.' },
  { icon: Zap, title: 'Vote, veto, decide', body: 'Everyone gets one vote and one veto. Votes update live on every phone, and a countdown forces a decision.' },
  { icon: Receipt, title: 'Split, then settle', body: 'Enter the bill item by item. Noon adds 10% service and 9% GST and works out the fewest payments to square up.' },
];

const FEATURES = [
  { icon: ShieldCheck, title: 'Dietary-aware', body: 'Halal, vegetarian, vegan, no beef, no pork. Places that don’t suit someone are flagged before you vote.' },
  { icon: Ban, title: 'One vote, one veto', body: 'Stops the loudest voice winning. Anyone can rule out the place they really can’t do.' },
  { icon: Scale, title: 'Fairness tie-breaker', body: 'Ties go to the people whose picks have lost most often. "Been there recently" places lose half a vote.' },
  { icon: Clock, title: 'Lunch clock & countdown', body: 'See how much lunch hour is left and give voting a time limit, so it doesn’t drag on.' },
  { icon: Receipt, title: 'Item-level split', body: 'Shared plates, discounts and vouchers, several payers. Every cent adds up to the receipt.' },
  { icon: Wallet, title: 'Running ledger', body: 'Debts net out across lunches. "You owe Sam $5, Sam owes you $8" becomes "Sam owes you $3".' },
  { icon: Users, title: 'Crews', body: 'Save your regular groups, like the CCA lunch crew, with everyone’s needs and a budget per head.' },
  { icon: Sparkles, title: 'Insights & history', body: 'Meal history, spend by month, favourite cuisines, streaks and a fairness board.' },
];

const PLANS = [
  {
    name: 'Free',
    price: 'S$0',
    note: 'for everyone',
    perks: ['Unlimited lunches', 'Vote, veto and fair tie-breaks', 'Item-level bill splitting', 'Live votes on every phone'],
    cta: 'Get started',
  },
  {
    name: 'Crew Plus',
    price: 'S$2.99',
    note: 'per crew / month',
    perks: ['Unlimited saved crews', 'Full history and export', 'Advanced insights', 'Priority support'],
    cta: 'Try it free',
    featured: true,
  },
  {
    name: 'Campus & Office',
    price: 'Let’s talk',
    note: 'for clubs and companies',
    perks: ['One admin page', 'Partner eatery deals', 'Aggregate, consent-based insights', 'SSO (planned)'],
    cta: 'Contact us',
  },
];

const FAQ = [
  ['Do my friends need an account?', 'No. They tap the link and type a name. Accounts are optional, for saving history, crews and payment records.'],
  ['How is the winner chosen?', 'Vetoed places are out. Most votes wins, with half a vote taken off places you visited recently. Ties go to the people whose picks have lost most often.'],
  ['Are sponsored places ranked higher?', 'Never. Sponsored spots are clearly labelled and get exactly the same vote counting as everything else.'],
  ['Does Noon handle the payment itself?', 'No. Noon tells you who pays whom and reminds people by WhatsApp. You pay each other however you like, e.g. PayNow.'],
];

function HeroPreview() {
  const rows = [
    { name: 'Spice Route Biryani', tags: '🌙 Halal · 🌶️ Spicy', votes: 4, lead: true },
    { name: 'Green Bowl Salad Bar', tags: '🌱 Vegan · 🥗 Light', votes: 3 },
    { name: 'Uncle Lim’s Chicken Rice', tags: '⚡ Quick', votes: 1, veto: true },
  ];
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-sun/40 via-brand/20 to-transparent blur-2xl" aria-hidden />
      <div className="rounded-[2rem] border border-line bg-surface p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">Friday lunch · code Q7M2KX</p>
            <p className="font-display text-lg font-semibold">Where are we eating?</p>
          </div>
          <Badge tone="brand">
            <Clock size={12} /> 2:41
          </Badge>
        </div>
        <ul className="mt-4 space-y-2.5">
          {rows.map((r) => (
            <li
              key={r.name}
              className={`rounded-2xl border p-3 ${r.lead ? 'border-brand bg-brand-soft/60' : 'border-line'} ${r.veto ? 'opacity-55' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className={`truncate text-sm font-semibold ${r.veto ? 'line-through' : ''}`}>{r.name}</p>
                  <p className="text-xs text-muted">{r.tags}</p>
                </div>
                <span className="font-display text-xl font-bold tabular-nums">{r.votes}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-brand" style={{ width: `${(r.votes / 5) * 100}%` }} />
              </div>
              {r.veto && <p className="mt-1.5 text-xs font-medium text-bad">Vetoed by Priya</p>}
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-2xl bg-surface-2 p-3 text-xs">
          <p className="font-semibold">After lunch</p>
          <p className="mt-1 text-muted">Wei Jie pays Aisha <b className="text-ink">S$14.20</b> · Priya pays Aisha <b className="text-ink">S$11.85</b></p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  const join = (e) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length === 6) navigate(`/s/${clean}`);
  };

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 md:grid-cols-2 md:pt-20">
        <div className="animate-rise">
          <Badge tone="sun" className="mb-5">
            <Sparkles size={12} /> No more “anywhere is fine”
          </Badge>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Lunch, decided.
            <br />
            <span className="text-brand">Bill, settled.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted">
            One link for your group to pick where to eat, fairly, and then split the bill down to the last cent,
            with 10% service charge and 9% GST included.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to={user ? '/app/new' : '/signup'} size="lg">
              Start a lunch <ArrowRight size={18} />
            </Button>
            <Button href="#how" variant="secondary" size="lg" target="_self" rel={undefined}>
              See how it works
            </Button>
          </div>
          <form onSubmit={join} className="mt-8 flex max-w-sm items-center gap-2 rounded-2xl border border-line bg-surface p-1.5 pl-4">
            <label htmlFor="hero-code" className="sr-only">
              Lunch code
            </label>
            <input
              id="hero-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Got a code? e.g. Q7M2KX"
              maxLength={8}
              autoCapitalize="characters"
              className="min-w-0 flex-1 bg-transparent text-sm uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:outline-none"
            />
            <Button type="submit" size="sm" variant="secondary">
              Join
            </Button>
          </form>
        </div>
        <HeroPreview />
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold tracking-tight">How it works</h2>
          <p className="mt-2 text-muted">Three steps, about two minutes, zero awkward chasing.</p>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl border border-line bg-bg p-6">
                <span className="absolute right-5 top-4 font-display text-5xl font-extrabold text-line">{i + 1}</span>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-on-brand">
                  <s.icon size={20} aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <h2 className="font-display text-3xl font-bold tracking-tight">Everything a lunch group needs</h2>
        <p className="mt-2 max-w-2xl text-muted">Built for the real problems: dietary needs, indecision, the friend who always wins, and the bill nobody wants to split.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <f.icon size={22} className="text-brand" aria-hidden />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For eateries (business model) */}
      <section id="eateries" className="scroll-mt-20 bg-ink text-bg">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <Badge tone="sun" className="!text-ink">
              <Store size={12} /> For eateries
            </Badge>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">Be the answer to “where should we eat?”</h2>
            <p className="mt-3 opacity-75">
              Groups decide in Noon at the exact moment they’re choosing. Partner eateries can reach them, honestly.
            </p>
          </div>
          <ul className="grid gap-4">
            {[
              { icon: Store, t: 'Sponsored spots', d: 'Appear as an option, always labelled “Sponsored”. Votes are counted the same as any other place.' },
              { icon: BadgePercent, t: 'Group deals', d: 'Offer a discount for groups of 4 or more. Shown when a group is big enough to use it.' },
              { icon: ShieldCheck, t: 'Aggregate insights', d: 'Peak decision times and popular moods: anonymous, aggregated, and only with consent.' },
            ].map((x) => (
              <li key={x.t} className="flex gap-4 rounded-2xl bg-white/5 p-5">
                <x.icon size={22} className="shrink-0 text-sun" aria-hidden />
                <div>
                  <p className="font-semibold">{x.t}</p>
                  <p className="mt-1 text-sm opacity-75">{x.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight">Simple pricing</h2>
        <p className="mt-2 text-center text-muted">Free for friends. Extras for groups that eat together every week.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col rounded-3xl border p-6 ${p.featured ? 'border-brand bg-brand-soft/40 shadow-lg' : 'border-line bg-surface'}`}
            >
              {p.featured && <Badge tone="brand" className="mb-3 self-start">Most popular</Badge>}
              <h3 className="font-display text-xl font-semibold">{p.name}</h3>
              <p className="mt-3">
                <span className="font-display text-4xl font-extrabold">{p.price}</span>{' '}
                <span className="text-sm text-muted">{p.note}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden /> {perk}
                  </li>
                ))}
              </ul>
              <Button to="/signup" variant={p.featured ? 'primary' : 'secondary'} className="mt-6">
                {p.cta}
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted">Paid plans are a concept for this pilot. Nothing is charged.</p>
      </section>

      {/* FAQ */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold tracking-tight">Questions</h2>
          <div className="mt-8 divide-y divide-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {q}
                  <span className="text-brand transition group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-2 text-sm text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl bg-brand px-6 py-12 text-center text-on-brand">
          <h2 className="font-display text-3xl font-bold tracking-tight">It’s almost noon. Where are we eating?</h2>
          <p className="mt-2 opacity-90">Start a lunch in ten seconds.</p>
          <Button to={user ? '/app/new' : '/signup'} variant="secondary" size="lg" className="mt-6">
            Start a lunch <ArrowRight size={18} />
          </Button>
        </div>
      </section>
    </>
  );
}
