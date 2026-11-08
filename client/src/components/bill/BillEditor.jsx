import { Plus, Trash2, Users } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { firstFieldError } from '../../api/client.js';
import { saveBill } from '../../api/sessions.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useHotkeys } from '../../hooks/useHotkeys.js';
import { centsToInput, formatCents, toCents } from '../../utils/money.js';
import { splitBill } from '../../utils/split.js';
import { Chip } from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import { Card, CardHeader } from '../ui/Card.jsx';
import { ErrorMessage } from '../ui/Feedback.jsx';
import { Input, Select } from '../ui/Field.jsx';

let keySeq = 0;
const newKey = () => `i${++keySeq}`;

function initialState(bill, participants, meId) {
  const everyone = participants.map((p) => p.id);
  if (!bill) {
    return {
      items: [{ key: newKey(), name: '', amount: '', participantIds: everyone }],
      discount: '',
      serviceOn: true,
      servicePct: '10',
      gstOn: true,
      gstPct: '9',
      payerMode: 'single',
      payerId: meId ?? everyone[0],
      payerAmounts: {},
    };
  }
  return {
    items: bill.items.map((i) => ({ key: newKey(), name: i.name, amount: centsToInput(i.amountCents), participantIds: i.participantIds })),
    discount: bill.discountCents ? centsToInput(bill.discountCents) : '',
    serviceOn: bill.serviceChargePct > 0,
    servicePct: String(bill.serviceChargePct || 10),
    gstOn: bill.taxPct > 0,
    gstPct: String(bill.taxPct || 9),
    payerMode: bill.payers.length > 1 ? 'multiple' : 'single',
    payerId: bill.payers[0]?.participantId ?? meId,
    payerAmounts: Object.fromEntries(bill.payers.map((p) => [p.participantId, centsToInput(p.amountCents)])),
  };
}

/** Host-only bill entry with a live split preview. */
export default function BillEditor({ session, onSaved, onCancel }) {
  const { toast } = useToast();
  const people = session.participants;
  const nameOf = (id) => people.find((p) => p.id === id)?.displayName ?? '?';
  const [state, setState] = useState(() => initialState(session.bill, people, session.me?.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const lastRemoved = useRef(null);
  const firstInputRef = useRef(null);

  const update = (patch) => setState((s) => ({ ...s, ...patch }));
  const updateItem = (key, patch) =>
    setState((s) => ({ ...s, items: s.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) }));

  const addItem = () => {
    setState((s) => ({ ...s, items: [...s.items, { key: newKey(), name: '', amount: '', participantIds: people.map((p) => p.id) }] }));
  };

  const undoRemove = () => {
    const removed = lastRemoved.current;
    if (!removed) return;
    lastRemoved.current = null;
    setState((s) => {
      const items = [...s.items];
      items.splice(removed.index, 0, removed.item);
      return { ...s, items };
    });
  };

  const removeItem = (key) => {
    const index = state.items.findIndex((i) => i.key === key);
    lastRemoved.current = { index, item: state.items[index] };
    setState((s) => ({ ...s, items: s.items.filter((i) => i.key !== key) }));
    toast(`Removed ${state.items[index].name || 'item'}`, { action: { label: 'Undo', onClick: undoRemove } });
  };

  useHotkeys({ a: addItem, 'mod+z': undoRemove });

  const charges = {
    discountCents: toCents(state.discount) || 0,
    serviceChargePct: state.serviceOn ? Number(state.servicePct) || 0 : 0,
    taxPct: state.gstOn ? Number(state.gstPct) || 0 : 0,
  };

  const parsedItems = state.items.map((i) => ({ ...i, amountCents: toCents(i.amount) }));
  const validItems = parsedItems.filter((i) => i.name.trim() && i.amountCents > 0 && i.participantIds.length);
  const preview = useMemo(() => splitBill(validItems, charges), [JSON.stringify(validItems), JSON.stringify(charges)]); // eslint-disable-line react-hooks/exhaustive-deps

  const paidTotal = Object.values(state.payerAmounts).reduce((sum, v) => sum + (toCents(v) || 0), 0);
  const remaining = preview.totalCents - paidTotal;

  const splitEqually = () => {
    const total = toCents(prompt('Total on the receipt before service charge and GST? (e.g. 86.40)') ?? '');
    if (!(total > 0)) return;
    update({ items: [{ key: newKey(), name: 'Food & drinks', amount: centsToInput(total), participantIds: people.map((p) => p.id) }] });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const bad = parsedItems.find((i) => !i.name.trim() || !(i.amountCents > 0) || i.participantIds.length === 0);
    if (bad) {
      setError(new Error('Every item needs a name, a price and at least one person.'));
      return;
    }
    const payers =
      state.payerMode === 'single'
        ? [{ participantId: state.payerId }]
        : Object.entries(state.payerAmounts)
            .map(([participantId, v]) => ({ participantId, amountCents: toCents(v) || 0 }))
            .filter((p) => p.amountCents > 0);
    if (state.payerMode === 'multiple' && remaining !== 0) {
      setError(new Error(`Payments must add up to ${formatCents(preview.totalCents)} (${formatCents(Math.abs(remaining))} ${remaining > 0 ? 'missing' : 'too much'}).`));
      return;
    }

    setBusy(true);
    try {
      await saveBill(session.code, {
        items: parsedItems.map((i) => ({ name: i.name.trim(), amountCents: i.amountCents, participantIds: i.participantIds })),
        discountCents: charges.discountCents,
        serviceChargePct: charges.serviceChargePct,
        taxPct: charges.taxPct,
        payers,
      });
      toast('Bill saved. Everyone can see what they owe.');
      onSaved();
    } catch (err) {
      setError(firstFieldError(err) ? new Error(firstFieldError(err)) : err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card>
        <CardHeader
          title="What did everyone have?"
          subtitle="Add each item and tap who shared it. Press A to add an item."
          action={
            <Button size="sm" variant="ghost" onClick={splitEqually}>
              <Users size={15} /> Just split equally
            </Button>
          }
        />
        <ul className="space-y-4">
          {state.items.map((item, idx) => (
            <li key={item.key} className="rounded-xl border border-line p-3">
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <label className="sr-only" htmlFor={`${item.key}-name`}>Item name</label>
                  <input
                    id={`${item.key}-name`}
                    ref={idx === 0 ? firstInputRef : undefined}
                    value={item.name}
                    onChange={(e) => updateItem(item.key, { name: e.target.value })}
                    placeholder={idx === 0 ? 'e.g. Chicken rice' : 'Item'}
                    maxLength={80}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="relative w-28">
                  <label className="sr-only" htmlFor={`${item.key}-amount`}>Price</label>
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">$</span>
                  <input
                    id={`${item.key}-amount`}
                    value={item.amount}
                    onChange={(e) => updateItem(item.key, { amount: e.target.value })}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-line bg-surface py-2 pl-7 pr-2 text-right text-sm tabular-nums focus:border-brand focus:outline-none"
                  />
                </div>
                <button type="button" onClick={() => removeItem(item.key)} aria-label={`Remove ${item.name || 'item'}`} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-bad" disabled={state.items.length === 1}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Shared by">
                <Chip
                  pressed={item.participantIds.length === people.length}
                  onClick={() => updateItem(item.key, { participantIds: item.participantIds.length === people.length ? [] : people.map((p) => p.id) })}
                  className="!min-h-7 !py-0.5 !text-xs"
                >
                  Everyone
                </Chip>
                {people.map((p) => (
                  <Chip
                    key={p.id}
                    pressed={item.participantIds.includes(p.id)}
                    onClick={() =>
                      updateItem(item.key, {
                        participantIds: item.participantIds.includes(p.id)
                          ? item.participantIds.filter((x) => x !== p.id)
                          : [...item.participantIds, p.id],
                      })
                    }
                    className="!min-h-7 !py-0.5 !text-xs"
                  >
                    {p.displayName}
                  </Chip>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <Button variant="secondary" size="sm" className="mt-4" onClick={addItem}>
          <Plus size={15} /> Add item
        </Button>
      </Card>

      <Card>
        <CardHeader title="Charges & discounts" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Discount / voucher" prefix="$" inputMode="decimal" value={state.discount} onChange={(e) => update({ discount: e.target.value })} placeholder="0.00" hint="Taken off before charges" />
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={state.serviceOn} onChange={(e) => update({ serviceOn: e.target.checked })} className="h-4 w-4 accent-[var(--brand)]" />
              Service charge %
            </label>
            <input aria-label="Service charge percent" value={state.servicePct} disabled={!state.serviceOn} onChange={(e) => update({ servicePct: e.target.value })} inputMode="decimal" className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm disabled:opacity-50" />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={state.gstOn} onChange={(e) => update({ gstOn: e.target.checked })} className="h-4 w-4 accent-[var(--brand)]" />
              GST %
            </label>
            <input aria-label="GST percent" value={state.gstPct} disabled={!state.gstOn} onChange={(e) => update({ gstPct: e.target.value })} inputMode="decimal" className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm disabled:opacity-50" />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Who paid?" />
        <div className="mb-4 flex gap-2" role="radiogroup" aria-label="Payer mode">
          <Chip pressed={state.payerMode === 'single'} onClick={() => update({ payerMode: 'single' })}>One person</Chip>
          <Chip pressed={state.payerMode === 'multiple'} onClick={() => update({ payerMode: 'multiple' })}>Several people</Chip>
        </div>
        {state.payerMode === 'single' ? (
          <Select label="Paid the whole bill" value={state.payerId} onChange={(e) => update({ payerId: e.target.value })}>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.displayName}</option>
            ))}
          </Select>
        ) : (
          <div className="space-y-3">
            {people.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-28 truncate text-sm">{p.displayName}</span>
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">$</span>
                  <input
                    aria-label={`${p.displayName} paid`}
                    value={state.payerAmounts[p.id] ?? ''}
                    onChange={(e) => update({ payerAmounts: { ...state.payerAmounts, [p.id]: e.target.value } })}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-line bg-surface py-2 pl-7 pr-3 text-right text-sm tabular-nums"
                  />
                </div>
              </div>
            ))}
            <p className={`text-right text-sm font-medium ${remaining === 0 ? 'text-ok' : 'text-bad'}`}>
              {remaining === 0 ? 'Adds up ✓' : `${formatCents(Math.abs(remaining))} ${remaining > 0 ? 'still to assign' : 'too much'}`}
            </p>
          </div>
        )}
      </Card>

      {/* Live preview */}
      <Card className="bg-surface-2">
        <CardHeader title="Preview" subtitle="Updates as you type. Saved numbers come from the server." />
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatCents(preview.subtotalCents)}</dd></div>
          {preview.discountCents > 0 && <div className="flex justify-between text-ok"><dt>Discount</dt><dd className="tabular-nums">−{formatCents(preview.discountCents)}</dd></div>}
          {preview.serviceCents > 0 && <div className="flex justify-between"><dt>Service charge</dt><dd className="tabular-nums">{formatCents(preview.serviceCents)}</dd></div>}
          {preview.taxCents > 0 && <div className="flex justify-between"><dt>GST</dt><dd className="tabular-nums">{formatCents(preview.taxCents)}</dd></div>}
          <div className="flex justify-between border-t border-line pt-2 font-display text-lg font-bold"><dt>Total</dt><dd className="tabular-nums">{formatCents(preview.totalCents)}</dd></div>
        </dl>
        {preview.shares.length > 0 && (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {preview.shares.map((s) => (
              <li key={s.participantId} className="flex justify-between rounded-lg bg-surface px-3 py-2 text-sm">
                <span>{nameOf(s.participantId)}</span>
                <span className="font-semibold tabular-nums">{formatCents(s.owedCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ErrorMessage error={error} />
      <div className="sticky bottom-4 flex justify-end gap-2">
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" size="lg" loading={busy} className="shadow-lg">Save bill</Button>
      </div>
    </form>
  );
}
