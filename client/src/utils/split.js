// Client copy of server/src/services/splitService.js, used for the live
// preview while editing a bill. The server recalculates on save, so the
// server's numbers are always the source of truth.

export function allocateProportionally(totalCents, weights) {
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  if (weights.length === 0 || weightSum <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => (totalCents * w) / weightSum);
  const amounts = exact.map(Math.floor);
  const remainder = totalCents - amounts.reduce((sum, a) => sum + a, 0);
  exact
    .map((value, index) => ({ index, fraction: value - amounts[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)
    .slice(0, remainder)
    .forEach(({ index }) => {
      amounts[index] += 1;
    });
  return amounts;
}

export function applyCharges(subtotalCents, { discountCents = 0, serviceChargePct = 0, taxPct = 0 } = {}) {
  const discount = Math.min(Math.max(discountCents, 0), subtotalCents);
  const net = subtotalCents - discount;
  const serviceCents = Math.round((net * serviceChargePct) / 100);
  const taxCents = Math.round(((net + serviceCents) * taxPct) / 100);
  return { subtotalCents, discountCents: discount, serviceCents, taxCents, totalCents: net + serviceCents + taxCents };
}

export function splitBill(items, charges = {}) {
  const perPerson = new Map();
  for (const item of items) {
    const ids = [...new Set(item.participantIds)];
    if (!ids.length || !(item.amountCents > 0)) continue;
    const parts = allocateProportionally(item.amountCents, ids.map(() => 1));
    ids.forEach((id, i) => perPerson.set(id, (perPerson.get(id) ?? 0) + parts[i]));
  }
  const subtotalCents = [...perPerson.values()].reduce((sum, a) => sum + a, 0);
  const totals = applyCharges(subtotalCents, charges);
  const ids = [...perPerson.keys()];
  const owed = allocateProportionally(totals.totalCents, ids.map((id) => perPerson.get(id)));
  return { ...totals, shares: ids.map((participantId, i) => ({ participantId, owedCents: owed[i] })) };
}
