// Pure bill-splitting logic: no database, no Express, so it can be unit tested
// on its own. All amounts are integer cents. Every split adds up to the
// total exactly; leftover cents go out using the largest-remainder method.
// Mirrored on the client in client/src/utils/split.js for live previews.

/**
 * Split totalCents across weights, proportionally, in whole cents.
 * @returns {number[]} amounts in the same order as weights, summing to totalCents
 */
export function allocateProportionally(totalCents, weights) {
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  if (weights.length === 0 || weightSum <= 0) {
    throw new RangeError('weights must contain at least one positive value');
  }

  const exact = weights.map((w) => (totalCents * w) / weightSum);
  const amounts = exact.map(Math.floor);
  const remainder = totalCents - amounts.reduce((sum, a) => sum + a, 0);

  // Biggest fractional part gets the next cent; ties go to the earlier entry.
  const order = exact
    .map((value, index) => ({ index, fraction: value - amounts[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let i = 0; i < remainder; i += 1) {
    amounts[order[i].index] += 1;
  }
  return amounts;
}

/**
 * Singapore-style charges: discount/voucher first, then service charge on the
 * discounted subtotal, then GST on (discounted subtotal + service charge).
 */
export function applyCharges(subtotalCents, { discountCents = 0, serviceChargePct = 0, taxPct = 0 } = {}) {
  const discount = Math.min(Math.max(discountCents, 0), subtotalCents);
  const net = subtotalCents - discount;
  const serviceCents = Math.round((net * serviceChargePct) / 100);
  const taxCents = Math.round(((net + serviceCents) * taxPct) / 100);
  return {
    subtotalCents,
    discountCents: discount,
    serviceCents,
    taxCents,
    totalCents: net + serviceCents + taxCents,
  };
}

/**
 * Item-level split. Each item is shared equally by the people on it; each
 * person then carries their proportional part of discount, service and GST.
 * @param {{ amountCents: number, participantIds: string[] }[]} items
 * @returns totals + shares: [{ participantId, owedCents }]
 */
export function splitBill(items, charges = {}) {
  const perPerson = new Map();

  for (const item of items) {
    const ids = [...new Set(item.participantIds)];
    if (ids.length === 0) continue;
    const parts = allocateProportionally(item.amountCents, ids.map(() => 1));
    ids.forEach((id, i) => perPerson.set(id, (perPerson.get(id) ?? 0) + parts[i]));
  }

  const subtotalCents = [...perPerson.values()].reduce((sum, a) => sum + a, 0);
  const totals = applyCharges(subtotalCents, charges);
  const ids = [...perPerson.keys()];
  const owed =
    totals.totalCents > 0 && subtotalCents > 0
      ? allocateProportionally(totals.totalCents, ids.map((id) => perPerson.get(id)))
      : ids.map(() => 0);

  return {
    ...totals,
    shares: ids.map((participantId, i) => ({ participantId, owedCents: owed[i] })),
  };
}

/**
 * Turn "who owes what" + "who paid what" into the fewest transfers that
 * square everyone up (greedy: biggest debtor pays biggest creditor).
 * @returns {{ fromParticipantId, toParticipantId, amountCents }[]}
 */
export function computeSettlements(shares, payers) {
  const net = new Map();
  for (const { participantId, owedCents } of shares) {
    net.set(participantId, (net.get(participantId) ?? 0) - owedCents);
  }
  for (const { participantId, amountCents } of payers) {
    net.set(participantId, (net.get(participantId) ?? 0) + amountCents);
  }

  const debtors = [];
  const creditors = [];
  for (const [id, balance] of net) {
    if (balance < 0) debtors.push({ id, amount: -balance });
    if (balance > 0) creditors.push({ id, amount: balance });
  }
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let d = 0;
  let c = 0;
  while (d < debtors.length && c < creditors.length) {
    const amount = Math.min(debtors[d].amount, creditors[c].amount);
    transfers.push({ fromParticipantId: debtors[d].id, toParticipantId: creditors[c].id, amountCents: amount });
    debtors[d].amount -= amount;
    creditors[c].amount -= amount;
    if (debtors[d].amount === 0) d += 1;
    if (creditors[c].amount === 0) c += 1;
  }
  return transfers;
}
