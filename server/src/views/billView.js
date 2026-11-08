// Bill JSON. Participant names are attached so the client can render
// "Sam pays Aisha $12.40" without another lookup.
export function presentBill(row, participants = []) {
  const nameOf = new Map(participants.map((p) => [p.id, p.display_name]));
  const name = (id) => nameOf.get(id) ?? 'Someone';

  const settlements = (row.settlements ?? []).map((s) => ({
    id: s.id,
    fromParticipantId: s.from_participant_id,
    fromName: name(s.from_participant_id),
    toParticipantId: s.to_participant_id,
    toName: name(s.to_participant_id),
    amountCents: s.amount_cents,
    isPaid: s.is_paid,
    paidAt: s.paid_at,
  }));

  return {
    id: row.id,
    subtotalCents: row.subtotal_cents,
    discountCents: row.discount_cents,
    serviceChargePct: Number(row.service_charge_pct),
    taxPct: Number(row.tax_pct),
    serviceCents: row.service_cents,
    taxCents: row.tax_cents,
    totalCents: row.total_cents,
    createdAt: row.created_at,
    items: [...(row.items ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        id: item.id,
        name: item.name,
        amountCents: item.amount_cents,
        participantIds: (item.shares ?? []).map((s) => s.participant_id),
      })),
    payers: (row.payers ?? []).map((p) => ({
      participantId: p.participant_id,
      name: name(p.participant_id),
      amountCents: p.amount_cents,
    })),
    shares: (row.shares ?? []).map((s) => ({
      participantId: s.participant_id,
      name: name(s.participant_id),
      owedCents: s.owed_cents,
    })),
    settlements,
    outstandingCents: settlements.filter((s) => !s.isPaid).reduce((sum, s) => sum + s.amountCents, 0),
  };
}
