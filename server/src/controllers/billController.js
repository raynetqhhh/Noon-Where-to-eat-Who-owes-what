import { BillModel } from '../models/billModel.js';
import { ParticipantModel } from '../models/participantModel.js';
import { SessionModel } from '../models/sessionModel.js';
import { computeSettlements, splitBill } from '../services/splitService.js';
import { ApiError } from '../utils/ApiError.js';
import { presentBill } from '../views/billView.js';

const dollars = (cents) => `$${(cents / 100).toFixed(2)}`;

async function loadBillView(sessionId) {
  const [bill, participants] = await Promise.all([
    BillModel.findBySessionId(sessionId),
    ParticipantModel.listBySession(sessionId),
  ]);
  if (!bill) throw ApiError.notFound('No bill has been added yet');
  return { bill, view: presentBill(bill, participants) };
}

async function syncSettledStatus(session, unpaidCount) {
  if (session.status === 'closed') return;
  const next = unpaidCount === 0 ? 'settled' : 'decided';
  if (session.status !== next) await SessionModel.update(session.id, { status: next });
}

function resolvePayers(payers, totalCents) {
  if (payers.length === 1 && payers[0].amountCents === undefined) {
    return [{ participantId: payers[0].participantId, amountCents: totalCents }];
  }
  if (payers.some((p) => p.amountCents === undefined)) {
    throw ApiError.badRequest('With more than one payer, enter how much each person paid');
  }
  if (new Set(payers.map((p) => p.participantId)).size !== payers.length) {
    throw ApiError.badRequest('Each payer should only be listed once');
  }
  const paid = payers.reduce((sum, p) => sum + p.amountCents, 0);
  if (paid !== totalCents) {
    throw ApiError.badRequest(`Payments add up to ${dollars(paid)} but the bill total is ${dollars(totalCents)}`, {
      expectedTotalCents: totalCents,
    });
  }
  return payers;
}

// PUT /api/sessions/:code/bill   (host only; replaces any existing bill)
export async function saveBill(req, res) {
  const session = req.lunchSession;
  if (!session.decided_suggestion_id || session.status === 'closed') {
    throw ApiError.conflict('Pick a restaurant before splitting the bill');
  }

  const { items, discountCents, serviceChargePct, taxPct, payers } = req.body;

  const memberIds = new Set((await ParticipantModel.listBySession(session.id)).map((p) => p.id));
  const referenced = [...items.flatMap((i) => i.participantIds), ...payers.map((p) => p.participantId)];
  const outsiders = [...new Set(referenced.filter((id) => !memberIds.has(id)))];
  if (outsiders.length > 0) {
    throw ApiError.badRequest('Some people are not in this lunch', { participantIds: outsiders });
  }

  const split = splitBill(items, { discountCents, serviceChargePct, taxPct });
  const payerList = resolvePayers(payers, split.totalCents);
  const settlements = computeSettlements(split.shares, payerList);

  await BillModel.replace(session.id, {
    subtotal_cents: split.subtotalCents,
    discount_cents: split.discountCents,
    service_charge_pct: serviceChargePct,
    tax_pct: taxPct,
    service_cents: split.serviceCents,
    tax_cents: split.taxCents,
    total_cents: split.totalCents,
    created_by: req.participant.id,
    items: items.map((i) => ({
      name: i.name,
      amount_cents: i.amountCents,
      participant_ids: [...new Set(i.participantIds)],
    })),
    payers: payerList.map((p) => ({ participant_id: p.participantId, amount_cents: p.amountCents })),
    shares: split.shares.map((s) => ({ participant_id: s.participantId, owed_cents: s.owedCents })),
    settlements: settlements.map((t) => ({
      from_participant_id: t.fromParticipantId,
      to_participant_id: t.toParticipantId,
      amount_cents: t.amountCents,
    })),
  });

  await syncSettledStatus(session, settlements.length);
  const { view } = await loadBillView(session.id);
  res.status(201).json({ data: view });
}

// GET /api/sessions/:code/bill
export async function getBill(req, res) {
  const { view } = await loadBillView(req.lunchSession.id);
  res.json({ data: view });
}

// PATCH /api/sessions/:code/bill/settlements/:settlementId   body: { isPaid }
// The two people involved, or the host, can mark a transfer paid.
export async function updateSettlement(req, res) {
  const session = req.lunchSession;
  const { bill } = await loadBillView(session.id);

  const settlement = (bill.settlements ?? []).find((s) => s.id === req.params.settlementId);
  if (!settlement) throw ApiError.notFound('Payment not found');

  const me = req.participant.id;
  const involved = settlement.from_participant_id === me || settlement.to_participant_id === me;
  if (!involved && !req.participant.is_host) {
    throw ApiError.forbidden('Only the two people involved, or the host, can update this payment');
  }

  await BillModel.updateSettlement(settlement.id, req.body.isPaid);
  await syncSettledStatus(session, await BillModel.countUnpaidSettlements(bill.id));

  const { view } = await loadBillView(session.id);
  res.json({ data: view });
}
