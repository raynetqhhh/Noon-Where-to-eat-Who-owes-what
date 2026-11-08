import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { firstFieldError } from '../../api/client.js';
import { addSuggestion, getSponsoredSpots } from '../../api/sessions.js';
import { tagEmoji } from '../../utils/dietary.js';
import { formatCents, toCents } from '../../utils/money.js';
import { Badge } from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import DietaryPicker from '../ui/DietaryPicker.jsx';
import { ErrorMessage } from '../ui/Feedback.jsx';
import { Input } from '../ui/Field.jsx';
import Modal from '../ui/Modal.jsx';

const EMPTY = { name: '', cuisine: '', price: '', location: '', url: '', tags: [] };

export default function AddSuggestionModal({ open, onClose, code, existingNames, onAdded }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [spots, setSpots] = useState([]);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setError(null);
    getSponsoredSpots().then(setSpots).catch(() => setSpots([]));
  }, [open]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (body) => {
    setBusy(true);
    setError(null);
    try {
      const created = await addSuggestion(code, body);
      onAdded(created);
      onClose();
    } catch (err) {
      setError(firstFieldError(err) ? new Error(firstFieldError(err)) : err);
    } finally {
      setBusy(false);
    }
  };

  const submitCustom = (e) => {
    e.preventDefault();
    const price = form.price ? toCents(form.price) : undefined;
    if (form.price && !(price > 0)) {
      setError(new Error('Price per head should be a number, like 8.50'));
      return;
    }
    submit({
      name: form.name.trim(),
      cuisine: form.cuisine.trim() || undefined,
      pricePerHeadCents: price,
      location: form.location.trim() || undefined,
      url: form.url.trim() || undefined,
      tags: form.tags,
    });
  };

  const duplicate = existingNames.has(form.name.trim().toLowerCase());
  const freeSpots = spots.filter((s) => !existingNames.has(s.name.toLowerCase()));

  return (
    <Modal open={open} onClose={onClose} title="Suggest a place" size="lg">
      <form onSubmit={submitCustom} className="space-y-4">
        <Input
          label="Restaurant name"
          value={form.name}
          onChange={set('name')}
          required
          maxLength={100}
          autoFocus
          error={duplicate ? 'Already on the list' : undefined}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Cuisine" value={form.cuisine} onChange={set('cuisine')} placeholder="Japanese, Local, Thai…" maxLength={40} />
          <Input label="Price per head" prefix="$" inputMode="decimal" value={form.price} onChange={set('price')} placeholder="8.50" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Where" value={form.location} onChange={set('location')} placeholder="Food court, Level 2" maxLength={120} />
          <Input label="Link (optional)" type="url" value={form.url} onChange={set('url')} placeholder="https://" />
        </div>
        <DietaryPicker
          label="Suits / mood"
          options="all"
          value={form.tags}
          onChange={(tags) => setForm((f) => ({ ...f, tags }))}
        />
        <ErrorMessage error={error} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy} disabled={!form.name.trim() || duplicate}>
            <Plus size={16} /> Add place
          </Button>
        </div>
      </form>

      {freeSpots.length > 0 && (
        <div className="mt-6 border-t border-line pt-5">
          <div className="mb-3 flex items-center gap-2">
            <p className="text-sm font-semibold">Nearby partner spots</p>
            <Badge tone="sun">Sponsored</Badge>
          </div>
          <ul className="grid gap-2 sm:grid-cols-3">
            {freeSpots.map((spot) => (
              <li key={spot.id} className="flex flex-col rounded-xl border border-line p-3 text-sm">
                <p className="font-semibold">{spot.name}</p>
                <p className="text-xs text-muted">
                  {spot.cuisine} · ~{formatCents(spot.pricePerHeadCents)}/head
                </p>
                <p className="mt-1 text-xs">{spot.tags.map(tagEmoji).join(' ')}</p>
                <Button size="sm" variant="secondary" className="mt-2" disabled={busy} onClick={() => submit({ sponsoredSpotId: spot.id })}>
                  Add
                </Button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Sponsored spots are labelled and counted exactly like every other place.</p>
        </div>
      )}
    </Modal>
  );
}
