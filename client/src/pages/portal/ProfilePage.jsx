import { Camera, Flame, Plus, Settings, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { firstFieldError } from '../../api/client.js';
import { deleteAvatar, updateMe, uploadAvatar } from '../../api/me.js';
import { Chip } from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import DietaryPicker from '../../components/ui/DietaryPicker.jsx';
import { ErrorMessage } from '../../components/ui/Feedback.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { tagLabel } from '../../utils/dietary.js';
import { squarePhoto } from '../../utils/image.js';
import { CUISINES, DISH_SUGGESTIONS, MAX_FAVOURITE_FOODS, SPICE_LEVELS, cuisineLabel } from '../../utils/taste.js';

const EMPTY = {
  displayName: '',
  tagline: '',
  favouriteCuisines: [],
  favouriteFoods: [],
  spiceLevel: null,
  dietary: [],
  allergies: '',
  paynowId: '',
};

const formFrom = (p) => ({
  displayName: p.displayName ?? '',
  tagline: p.tagline ?? '',
  favouriteCuisines: p.favouriteCuisines ?? [],
  favouriteFoods: p.favouriteFoods ?? [],
  spiceLevel: p.spiceLevel ?? null,
  dietary: p.dietary ?? [],
  allergies: p.allergies ?? '',
  paynowId: p.paynowId ?? '',
});

function Section({ number, title, hint, children }) {
  return (
    <section className="grid gap-4 border-t border-line py-8 first:border-t-0 first:pt-0 md:grid-cols-[9rem_1fr]">
      <div>
        <p className="eyebrow">{number}</p>
        <h2 className="mt-1 font-display text-2xl">{title}</h2>
      </div>
      <div className="min-w-0 space-y-4">
        {hint && <p className="-mt-1 text-sm text-muted md:mt-1">{hint}</p>}
        {children}
      </div>
    </section>
  );
}

function SpiceMeter({ level, className = '' }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-hidden>
      {[1, 2, 3].map((n) => (
        <Flame key={n} size={14} className={level != null && level >= n ? 'fill-brand text-brand' : 'text-line'} />
      ))}
    </span>
  );
}

/** What friends see: a little menu card that updates while you edit. */
function TasteCard({ form, avatarUrl, since, onPickPhoto, onRemovePhoto, uploading }) {
  const spice = SPICE_LEVELS.find((s) => s.value === form.spiceLevel);
  const name = form.displayName.trim() || 'Your name';
  return (
    <div className="rounded-2xl border border-ink bg-surface p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Lunch card</span>
        {since && <span className="eyebrow">Since {new Date(since).getFullYear()}</span>}
      </div>

      <div className="mt-5 flex items-end gap-4">
        <div className="relative">
          <Avatar name={name} src={avatarUrl} size="2xl" className={uploading ? 'opacity-50' : ''} />
          <button
            type="button"
            onClick={onPickPhoto}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 grid h-10 w-10 place-items-center rounded-full border border-ink bg-bg text-ink transition hover:bg-ink hover:text-bg disabled:opacity-60"
            aria-label={avatarUrl ? 'Change photo' : 'Add a photo'}
          >
            <Camera size={17} />
          </button>
        </div>
        {avatarUrl && (
          <button type="button" onClick={onRemovePhoto} disabled={uploading} className="mb-1 inline-flex items-center gap-1 text-xs text-muted underline-offset-4 hover:text-bad hover:underline">
            <Trash2 size={12} /> Remove photo
          </button>
        )}
      </div>

      <h2 className="mt-5 break-words font-display text-5xl">{name}</h2>
      <p className={`mt-2 font-display text-xl italic ${form.tagline ? 'text-ink' : 'text-muted'}`}>
        {form.tagline || 'Add a line about how you lunch.'}
      </p>

      <dl className="mt-6 space-y-4 text-sm">
        <div className="rule-dashed pt-4">
          <dt className="eyebrow">Cuisines</dt>
          <dd className="mt-1.5">
            {form.favouriteCuisines.length ? form.favouriteCuisines.map(cuisineLabel).join(' · ') : <span className="text-muted">None picked yet</span>}
          </dd>
        </div>
        <div className="rule-dashed pt-4">
          <dt className="eyebrow">Go-to dishes</dt>
          <dd className="mt-1.5 flex flex-wrap gap-1.5">
            {form.favouriteFoods.length ? (
              form.favouriteFoods.map((f) => (
                <span key={f} className="rounded-full border border-line px-2.5 py-0.5 text-xs">{f}</span>
              ))
            ) : (
              <span className="text-muted">None added yet</span>
            )}
          </dd>
        </div>
        <div className="rule-dashed flex items-center justify-between gap-3 pt-4">
          <dt className="eyebrow">Spice</dt>
          <dd className="flex items-center gap-2">
            <span>{spice?.label ?? <span className="text-muted">Not set</span>}</span>
            <SpiceMeter level={form.spiceLevel} />
          </dd>
        </div>
        {form.dietary.length > 0 && (
          <div className="rule-dashed flex items-center justify-between gap-3 pt-4">
            <dt className="eyebrow">Dietary</dt>
            <dd className="text-right">{form.dietary.map(tagLabel).join(', ')}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function DishPicker({ value, onChange }) {
  const [draft, setDraft] = useState('');
  const full = value.length >= MAX_FAVOURITE_FOODS;
  const has = (dish) => value.some((v) => v.toLowerCase() === dish.toLowerCase());

  const add = (raw) => {
    const dish = raw.trim().replace(/\s+/g, ' ').slice(0, 30);
    if (!dish || has(dish) || full) return;
    onChange([...value, dish]);
  };
  const remove = (dish) => onChange(value.filter((v) => v !== dish));

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
      setDraft('');
    } else if (e.key === 'Backspace' && !draft && value.length) {
      remove(value[value.length - 1]);
    }
  };

  const suggestions = DISH_SUGGESTIONS.filter((d) => !has(d));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-2 focus-within:border-ink">
        {value.map((dish) => (
          <span key={dish} className="inline-flex items-center gap-1 rounded-full bg-ink py-1 pl-3 pr-1 text-sm text-bg">
            {dish}
            <button type="button" onClick={() => remove(dish)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-bg/20" aria-label={`Remove ${dish}`}>
              <X size={13} />
            </button>
          </span>
        ))}
        <label htmlFor="dish-input" className="sr-only">Add a dish</label>
        <input
          id="dish-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            add(draft);
            setDraft('');
          }}
          maxLength={30}
          disabled={full}
          placeholder={full ? 'That’s a full menu' : value.length ? 'Add another…' : 'Type a dish and press Enter'}
          className="min-w-40 flex-1 bg-transparent px-2 py-1.5 text-sm placeholder:text-muted focus:outline-none"
        />
      </div>
      <p className="font-mono text-xs text-muted">
        {value.length}/{MAX_FAVOURITE_FOODS}
      </p>
      {suggestions.length > 0 && !full && (
        <div>
          <p className="eyebrow mb-2">Quick add</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((dish) => (
              <button
                key={dish}
                type="button"
                onClick={() => add(dish)}
                className="inline-flex min-h-9 items-center gap-1 rounded-full border border-dashed border-line px-3 text-sm text-muted transition-colors hover:border-ink hover:text-ink"
              >
                <Plus size={13} aria-hidden /> {dish}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SpicePicker({ value, onChange }) {
  return (
    <fieldset>
      <legend className="sr-only">Spice tolerance</legend>
      <div className="grid grid-cols-2 gap-2">
        {SPICE_LEVELS.map((s) => {
          const checked = value === s.value;
          return (
            <label
              key={s.value}
              className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                checked ? 'border-ink bg-ink text-bg' : 'border-line hover:border-ink'
              }`}
            >
              <input type="radio" name="spice" className="sr-only" checked={checked} onChange={() => onChange(s.value)} />
              <span className="flex items-center justify-between gap-2 text-sm font-medium">
                {s.label}
                <SpiceMeter level={s.value} className={checked ? '[&_.text-line]:text-bg/30' : ''} />
              </span>
              <span className={`text-xs ${checked ? 'text-bg/70' : 'text-muted'}`}>{s.note}</span>
            </label>
          );
        })}
      </div>
      {value != null && (
        <button type="button" onClick={() => onChange(null)} className="mt-2 text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
          Clear
        </button>
      )}
    </fieldset>
  );
}

export default function ProfilePage() {
  const { profile, setProfile } = useAuth();
  const { toast } = useToast();
  const fileInput = useRef(null);

  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Keyed on the saved values (not the profile object), so uploading a photo
  // never wipes edits you haven't saved yet.
  const initialKey = JSON.stringify(profile ? formFrom(profile) : EMPTY);
  const initial = useMemo(() => JSON.parse(initialKey), [initialKey]);
  useEffect(() => setForm(initial), [initial]);
  const dirty = JSON.stringify(form) !== initialKey;
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const updated = await updateMe({
        displayName: form.displayName.trim(),
        tagline: form.tagline.trim() || null,
        favouriteCuisines: form.favouriteCuisines,
        favouriteFoods: form.favouriteFoods,
        spiceLevel: form.spiceLevel,
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

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      setProfile(await uploadAvatar(await squarePhoto(file)));
      toast('Photo updated');
    } catch (err) {
      toast(err.message, { tone: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const onRemovePhoto = async () => {
    setUploading(true);
    try {
      setProfile(await deleteAvatar());
      toast('Photo removed');
    } catch (err) {
      toast(err.message, { tone: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const toggleCuisine = (id) =>
    set('favouriteCuisines')(form.favouriteCuisines.includes(id) ? form.favouriteCuisines.filter((c) => c !== id) : [...form.favouriteCuisines, id]);

  return (
    <div className="pb-16">
      <div className="mb-10 border-b border-line pb-6">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">Your profile</p>
          <Link to="/app/settings" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
            <Settings size={14} aria-hidden /> Theme & password
          </Link>
        </div>
        <h1 className="mt-2 font-display text-5xl sm:text-6xl">
          How you <em className="text-brand">lunch.</em>
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          People in your lunches see your photo, and places that match your favourite cuisines get flagged for you while everyone votes.
        </p>
      </div>

      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={onPhoto} />

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <form onSubmit={save} className="order-2 lg:order-1" noValidate>
          <Section number="01" title="The basics">
            <Input
              label="First name"
              value={form.displayName}
              onChange={(e) => set('displayName')(e.target.value)}
              maxLength={40}
              required
            />
            <Input
              label="One line about you"
              value={form.tagline}
              onChange={(e) => set('tagline')(e.target.value)}
              maxLength={80}
              placeholder="Will queue 40 minutes for good laksa"
              hint={`${form.tagline.length}/80`}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => fileInput.current?.click()} loading={uploading}>
                <Camera size={15} /> {profile?.avatarUrl ? 'Change photo' : 'Upload a photo'}
              </Button>
              <span className="text-xs text-muted">JPEG, PNG or WebP. We crop it square and shrink it.</span>
            </div>
          </Section>

          <Section number="02" title="Cuisines" hint="Pick as many as you like. In a lunch, matching places show who loves that food.">
            <div className="flex flex-wrap gap-2">
              {CUISINES.map((c) => (
                <Chip key={c.id} pressed={form.favouriteCuisines.includes(c.id)} onClick={() => toggleCuisine(c.id)}>
                  {c.label}
                </Chip>
              ))}
            </div>
          </Section>

          <Section number="03" title="Go-to dishes" hint="The things you’d order without opening the menu.">
            <DishPicker value={form.favouriteFoods} onChange={set('favouriteFoods')} />
          </Section>

          <Section number="04" title="Spice">
            <SpicePicker value={form.spiceLevel} onChange={set('spiceLevel')} />
          </Section>

          <Section number="05" title="Dietary">
            <DietaryPicker label="Dietary needs" value={form.dietary} onChange={set('dietary')} />
            <Input
              label="Allergies (optional)"
              value={form.allergies}
              onChange={(e) => set('allergies')(e.target.value)}
              maxLength={200}
              placeholder="Peanuts, shellfish…"
              hint="Private. Only shown to you as a reminder."
            />
          </Section>

          <Section number="06" title="Getting paid">
            <Input
              label="PayNow number or UEN (optional)"
              value={form.paynowId}
              onChange={(e) => set('paynowId')(e.target.value)}
              maxLength={40}
              placeholder="9123 4567"
              hint="Added to payment reminders and shown to people who owe you."
            />
          </Section>

          <ErrorMessage error={error} />
        </form>

        <aside className="order-1 lg:sticky lg:top-8 lg:order-2" aria-label="Preview of your lunch card">
          <TasteCard
            form={form}
            avatarUrl={profile?.avatarUrl}
            since={profile?.createdAt}
            onPickPhoto={() => fileInput.current?.click()}
            onRemovePhoto={onRemovePhoto}
            uploading={uploading}
          />
          <p className="mt-3 text-center text-xs text-muted">Preview. Updates as you type.</p>
        </aside>
      </div>

      {/* Save bar appears only when something changed. */}
      <div
        className={`fixed inset-x-0 bottom-16 z-40 px-4 transition-all duration-300 md:bottom-6 md:left-64 ${
          dirty ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
        aria-hidden={!dirty}
      >
        <div className="mx-auto flex max-w-xl items-center gap-3 rounded-full border border-ink bg-ink py-2 pl-5 pr-2 text-bg shadow-md">
          <span className="flex-1 text-sm">Unsaved changes</span>
          <button type="button" onClick={() => setForm(initial)} tabIndex={dirty ? 0 : -1} className="rounded-full px-3 py-2 text-sm text-bg/70 hover:text-bg">
            Discard
          </button>
          <Button variant="accent" size="sm" onClick={save} loading={busy} tabIndex={dirty ? 0 : -1}>
            Save profile
          </Button>
        </div>
      </div>
    </div>
  );
}
