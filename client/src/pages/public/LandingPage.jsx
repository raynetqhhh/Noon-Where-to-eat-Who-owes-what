import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNow } from '../../hooks/useNow.js';
import { DISH_SUGGESTIONS } from '../../utils/taste.js';

const STEPS = [
  {
    title: 'Share one link',
    body: 'Start a lunch and drop the link in your group chat. Friends join with just a name. No app, no account.',
    note: '≈ 10 sec',
  },
  {
    title: 'Vote, veto, decide',
    body: 'Everyone gets one vote and one veto. Votes update live on every phone, and a countdown forces a decision.',
    note: '≈ 2 min',
  },
  {
    title: 'Split, then settle',
    body: 'Enter the bill item by item. Noon adds 10% service and 9% GST and works out the fewest payments to square up.',
    note: '≈ 1 min',
  },
];

// Read like a menu: name, dotted leader, a short note on the right.
const MENU = [
  ['Dietary-aware', 'Halal · veg · vegan', 'Places that don’t suit someone are flagged before anyone votes.'],
  ['One vote, one veto', 'Per person', 'Stops the loudest voice winning. Anyone can rule out the place they really can’t do.'],
  ['Fair tie-breaker', 'House rule', 'Ties go to whoever’s picks have lost most often. Places you went to recently lose half a vote.'],
  ['Lunch clock', 'Countdown', 'See how much of lunch hour is left and give voting a time limit.'],
  ['Item-level split', 'To the cent', 'Shared plates, vouchers and several payers. Every cent adds up to the receipt.'],
  ['Running ledger', 'Netted', '“You owe Sam $5, Sam owes you $8” becomes “Sam owes you $3”.'],
  ['Crews', 'Saved groups', 'Your regular lunch groups, with everyone’s needs and a budget per head.'],
  ['Taste profiles', 'New', 'Add a photo and the food you love. Places your table likes get flagged while you vote.'],
];

const PLANS = [
  { name: 'Free', price: 'S$0', note: 'for everyone', perks: ['Unlimited lunches', 'Vote, veto and fair tie-breaks', 'Item-level bill splitting', 'Live votes on every phone'], cta: 'Get started' },
  { name: 'Crew Plus', price: 'S$2.99', note: 'per crew / month', perks: ['Unlimited saved crews', 'Full history and export', 'Advanced insights', 'Priority support'], cta: 'Try it free' },
  { name: 'Campus & Office', price: 'Let’s talk', note: 'clubs and companies', perks: ['One admin page', 'Partner eatery deals', 'Aggregate, consent-based insights', 'SSO (planned)'], cta: 'Contact us' },
];

const FAQ = [
  ['Do my friends need an account?', 'No. They tap the link and type a name. Accounts are optional, for saving history, crews, payment records and your taste profile.'],
  ['How is the winner chosen?', 'Vetoed places are out. Most votes wins, with half a vote taken off places you visited recently. Ties go to the people whose picks have lost most often.'],
  ['Are sponsored places ranked higher?', 'Never. Sponsored spots are clearly labelled and get exactly the same vote counting as everything else.'],
  ['Does Noon handle the payment itself?', 'No. Noon tells you who pays whom and reminds people by WhatsApp. You pay each other however you like, e.g. PayNow.'],
];

/** "11:42 · 18 min to noon", ticking. */
function NoonClock() {
  const now = useNow(15_000);
  const time = now.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false });
  const mins = now.getHours() * 60 + now.getMinutes();
  const toNoon = 12 * 60 - mins;
  let line;
  if (toNoon > 0 && toNoon <= 180) line = `${toNoon} min to noon`;
  else if (toNoon <= 0 && toNoon > -120) line = 'Lunch hour. Decide fast.';
  else line = 'Planning ahead';
  return (
    <span className="font-mono text-xs tabular-nums text-muted">
      <span className="text-ink">{time}</span> · {line}
    </span>
  );
}

function HeroPoll() {
  const rows = [
    { name: 'Spice Route Biryani', tags: 'Halal · Spicy', votes: 4, lead: true },
    { name: 'Green Bowl Salad Bar', tags: 'Vegan · Light', votes: 3 },
    { name: 'Uncle Lim’s Chicken Rice', tags: 'Quick', votes: 1, veto: 'Priya' },
  ];
  return (
    <div className="w-full max-w-md rounded-2xl border border-ink bg-surface p-5 shadow-2xl xl:-mt-44 xl:rotate-[1.5deg]" aria-label="Example of a lunch in Noon">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Friday lunch · Q7M2KX</p>
          <p className="mt-1.5 font-display text-3xl">Where are we eating?</p>
        </div>
        <span className="rounded-md border border-ink px-2 py-1 text-center font-mono text-[11px] leading-tight">
          VOTING
          <br />
          <span className="text-base text-brand">2:41</span>
        </span>
      </div>
      <ol className="mt-5 divide-y divide-dashed divide-line border-y border-dashed border-line">
        {rows.map((r, i) => (
          <li key={r.name} className={`py-3 ${r.veto ? 'opacity-50' : ''}`}>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-muted">0{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className={`truncate font-medium ${r.veto ? 'line-through' : ''}`}>{r.name}</p>
                <p className="text-xs text-muted">{r.veto ? `Vetoed by ${r.veto}` : r.tags}</p>
              </div>
              <span className={`font-mono text-2xl tabular-nums ${r.lead ? 'text-brand' : ''}`}>{r.votes}</span>
            </div>
            <div className="ml-7 mt-2 h-[3px] bg-surface-2">
              <div className={`h-full ${r.lead ? 'bg-brand' : 'bg-ink'}`} style={{ width: `${(r.votes / 5) * 100}%` }} />
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 font-mono text-xs">
        <p className="eyebrow">After lunch</p>
        <p className="mt-2 flex gap-2">
          Wei Jie → Aisha <span className="leader" /> S$14.20
        </p>
        <p className="mt-1 flex gap-2">
          Priya → Aisha <span className="leader" /> S$11.85
        </p>
      </div>
    </div>
  );
}

function DishTicker() {
  const items = [...DISH_SUGGESTIONS, ...DISH_SUGGESTIONS];
  return (
    <div className="overflow-hidden border-y border-ink bg-ink py-3 text-bg" aria-hidden>
      <div className="animate-marquee flex w-max gap-8 whitespace-nowrap font-display text-3xl italic">
        {items.map((dish, i) => (
          <span key={i} className="flex items-center gap-8">
            {dish}
            <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 fill-sun" aria-hidden>
              <circle cx="5" cy="5" r="5" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ number, children }) {
  return (
    <p className="eyebrow flex items-center gap-3">
      <span className="text-ink">{number}</span>
      <span className="h-px w-8 bg-line" aria-hidden />
      {children}
    </p>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const startTo = user ? '/app/new' : '/signup';

  const join = (e) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length === 6) navigate(`/s/${clean}`);
  };

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:pt-14">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <span className="eyebrow">Group lunch, sorted · Singapore</span>
          <NoonClock />
        </div>

        <h1 className="animate-rise mt-8 font-display text-[clamp(3.6rem,12vw,9.5rem)] leading-[0.88] tracking-[-0.02em]">
          Lunch, decided.
          <br />
          Bill, <em className="text-brand">settled.</em>
        </h1>

        <div className="mt-12 grid items-start gap-12 md:grid-cols-[1fr_auto]">
          <div className="max-w-md">
            <p className="text-lg leading-relaxed text-muted">
              One link for your group to pick where to eat, fairly, then split the bill down to the last cent, with 10% service
              charge and 9% GST already in.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to={startTo} variant="accent" size="lg">
                Start a lunch <ArrowRight size={18} />
              </Button>
              <Button href="#how" variant="secondary" size="lg" target="_self" rel={undefined}>
                How it works
              </Button>
            </div>

            <form onSubmit={join} className="mt-10 flex max-w-sm items-stretch rounded-xl border border-ink">
              <label htmlFor="hero-code" className="flex items-center border-r border-dashed border-ink px-3 font-mono text-[11px] uppercase tracking-wider text-muted">
                Code
              </label>
              <input
                id="hero-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Q7M2KX"
                maxLength={8}
                autoCapitalize="characters"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm uppercase tracking-[0.25em] placeholder:text-muted/60 focus:outline-none"
              />
              <button type="submit" className="m-1 rounded-lg px-4 text-sm font-medium hover:bg-ink hover:text-bg">
                Join
              </button>
            </form>
          </div>
          <HeroPoll />
        </div>
      </section>

      <DishTicker />

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
        <SectionLabel number="01">How it works</SectionLabel>
        <h2 className="mt-4 max-w-2xl font-display text-5xl sm:text-6xl">Three steps. About three minutes.</h2>
        <ol className="mt-12 border-t border-ink">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid gap-2 border-b border-line py-7 md:grid-cols-[7rem_1fr_1.4fr_6rem] md:items-baseline md:gap-8">
              <span className="font-display text-6xl text-brand">{i + 1}.</span>
              <h3 className="font-display text-3xl">{s.title}</h3>
              <p className="text-muted">{s.body}</p>
              <span className="font-mono text-xs text-muted md:text-right">{s.note}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Features, as a menu */}
      <section id="features" className="scroll-mt-20 border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <SectionLabel number="02">On the menu</SectionLabel>
              <h2 className="mt-4 max-w-xl font-display text-5xl sm:text-6xl">
                Built for the real <em>lunch problems.</em>
              </h2>
            </div>
            <p className="max-w-xs text-sm text-muted">
              Dietary needs, indecision, the friend who always wins, and the bill nobody wants to split.
            </p>
          </div>
          <ul className="mt-14 grid gap-x-16 gap-y-9 md:grid-cols-2">
            {MENU.map(([name, note, body]) => (
              <li key={name}>
                <div className="flex items-baseline gap-3">
                  <h3 className="font-display text-2xl">{name}</h3>
                  <span className="leader" aria-hidden />
                  <span className={`font-mono text-xs uppercase tracking-wider ${note === 'New' ? 'text-brand' : 'text-muted'}`}>{note}</span>
                </div>
                <p className="mt-1.5 max-w-md text-sm text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* For eateries (business model) */}
      <section id="eateries" className="scroll-mt-20 bg-ink text-bg">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-bg/60">
              <span className="text-sun">03</span> — For eateries
            </p>
            <h2 className="mt-4 font-display text-5xl sm:text-6xl">
              Be the answer to <em className="text-sun">“where should we eat?”</em>
            </h2>
            <p className="mt-5 max-w-md text-bg/70">
              Groups decide in Noon at the exact moment they’re choosing. Partner eateries can reach them, honestly.
            </p>
          </div>
          <ul className="divide-y divide-bg/15 border-y border-bg/15 self-end">
            {[
              ['Sponsored spots', 'Appear as an option, always labelled “Sponsored”. Votes count exactly the same as any other place.'],
              ['Group deals', 'Offer a discount for groups of 4 or more. Shown only when a group is big enough to use it.'],
              ['Aggregate insights', 'Peak decision times and popular moods. Anonymous, aggregated, and only with consent.'],
            ].map(([t, d]) => (
              <li key={t} className="grid gap-1 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <p className="font-medium">{t}</p>
                <p className="text-sm text-bg/70">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
        <SectionLabel number="04">Pricing</SectionLabel>
        <h2 className="mt-4 font-display text-5xl sm:text-6xl">Free for friends.</h2>
        <p className="mt-3 max-w-md text-muted">Extras for groups that eat together every week.</p>
        <div className="mt-12 grid border-t border-ink md:grid-cols-3 md:divide-x md:divide-line">
          {PLANS.map((p, i) => (
            <div key={p.name} className={`flex flex-col border-b border-line py-8 md:border-b-0 ${i === 0 ? 'md:pr-8' : i === 2 ? 'md:pl-8' : 'md:px-8'}`}>
              <h3 className="font-display text-3xl">{p.name}</h3>
              <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
                <span className={p.price.startsWith('S$') ? 'font-mono text-4xl tracking-tight' : 'font-display text-4xl italic'}>{p.price}</span>
                <span className="text-sm text-muted">{p.note}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2 text-sm">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex gap-2.5 border-b border-dashed border-line pb-2">
                    <Plus size={14} className="mt-0.5 shrink-0 text-brand" aria-hidden /> {perk}
                  </li>
                ))}
              </ul>
              <Button to="/signup" variant={i === 1 ? 'primary' : 'secondary'} className="mt-8 self-start">
                {p.cta} <ArrowUpRight size={15} />
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-4 font-mono text-xs text-muted">Paid plans are a concept for this pilot. Nothing is charged.</p>
      </section>

      {/* FAQ */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionLabel number="05">Questions</SectionLabel>
            <h2 className="mt-4 font-display text-5xl">Fair questions.</h2>
          </div>
          <div className="divide-y divide-line border-y border-ink">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                  {q}
                  <Plus size={18} className="shrink-0 text-brand transition-transform duration-300 group-open:rotate-45" aria-hidden />
                </summary>
                <p className="mt-3 max-w-xl text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="eyebrow">
          <NoonClock />
        </p>
        <h2 className="mx-auto mt-6 max-w-4xl font-display text-[clamp(3rem,9vw,7rem)] leading-[0.9]">
          It’s almost noon. <em className="text-brand">Where are we eating?</em>
        </h2>
        <Button to={startTo} variant="accent" size="lg" className="mt-10">
          Start a lunch in ten seconds <ArrowRight size={18} />
        </Button>
      </section>
    </>
  );
}
