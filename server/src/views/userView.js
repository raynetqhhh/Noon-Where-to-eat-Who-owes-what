import { wonPick } from '../services/insightService.js';

const one = (value) => (Array.isArray(value) ? (value[0] ?? null) : (value ?? null));
const sum = (values) => values.reduce((a, b) => a + b, 0);

export function presentProfile(row, user) {
  return {
    id: row.id,
    email: user?.email ?? null,
    displayName: row.display_name,
    dietary: row.dietary ?? [],
    allergies: row.allergies,
    paynowId: row.paynow_id,
    avatarUrl: row.avatar_url ?? null,
    tagline: row.tagline ?? null,
    favouriteCuisines: row.favourite_cuisines ?? [],
    favouriteFoods: row.favourite_foods ?? [],
    spiceLevel: row.spice_level ?? null,
    createdAt: row.created_at,
  };
}

/** One row of meal history. */
export function presentLunch(row) {
  const session = one(row.session);
  const restaurant = one(session.decided);
  const bill = one(session.bill);
  const shares = row.shares ?? [];
  return {
    participantId: row.id,
    code: session.code,
    title: session.title,
    status: session.status,
    date: session.created_at,
    decidedAt: session.decided_at,
    crew: one(session.crew) ? { id: one(session.crew).id, name: one(session.crew).name } : null,
    restaurant: restaurant
      ? { name: restaurant.name, cuisine: restaurant.cuisine, location: restaurant.location, tags: restaurant.tags ?? [] }
      : null,
    totalCents: bill?.total_cents ?? null,
    myShareCents: shares.length ? sum(shares.map((s) => s.owed_cents)) : null,
    iPaidCents: sum((row.payments ?? []).map((p) => p.amount_cents)),
    wasHost: row.is_host,
    wonPick: wonPick(row),
  };
}

/** One payment record, from the signed-in user's point of view. */
export function presentSettlement(row, myParticipantIds) {
  const iOwe = myParticipantIds.has(row.from_participant_id);
  const other = one(iOwe ? row.creditor : row.debtor);
  const session = one(one(row.bill)?.session);
  return {
    id: row.id,
    amountCents: row.amount_cents,
    isPaid: row.is_paid,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    direction: iOwe ? 'you_owe' : 'owed_to_you',
    counterpartName: other?.display_name ?? 'Someone',
    session: session ? { code: session.code, title: session.title, date: session.created_at } : null,
  };
}

export function presentCrew(row, userId) {
  return {
    id: row.id,
    name: row.name,
    budgetPerHeadCents: row.budget_per_head_cents,
    meetingPoint: row.meeting_point,
    isOwner: row.owner_id === userId,
    createdAt: row.created_at,
    members: [...(row.members ?? [])]
      .sort((a, b) => a.display_name.localeCompare(b.display_name))
      .map((m) => ({
        id: m.id,
        displayName: m.display_name,
        dietary: m.dietary ?? [],
        hasAccount: Boolean(m.profile_id),
        isYou: m.profile_id === userId,
      })),
  };
}
