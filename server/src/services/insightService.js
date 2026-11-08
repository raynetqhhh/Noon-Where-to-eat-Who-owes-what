// Turns a user's lunch history into the numbers shown on the Insights tab,
// the fairness board and the payments ledger. Pure functions.

const DAY_MS = 24 * 60 * 60 * 1000;
const SGT_OFFSET_MS = 8 * 60 * 60 * 1000;

const one = (value) => (Array.isArray(value) ? (value[0] ?? null) : (value ?? null));
const sum = (values) => values.reduce((a, b) => a + b, 0);

/** Monday-based week number in Singapore time. */
function weekIndex(date) {
  const days = Math.floor((new Date(date).getTime() + SGT_OFFSET_MS) / DAY_MS);
  return Math.floor((days + 3) / 7); // 1970-01-01 was a Thursday
}

function sgtHour(date) {
  return new Date(new Date(date).getTime() + SGT_OFFSET_MS).getUTCHours();
}

function monthKey(date) {
  return new Date(new Date(date).getTime() + SGT_OFFSET_MS).toISOString().slice(0, 7);
}

function topCounts(values, limit) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

/** Did this participant vote for the place that was picked? */
export function wonPick(row) {
  const decided = one(row.session)?.decided_suggestion_id;
  return Boolean(decided && (row.votes ?? []).some((v) => v.kind === 'vote' && v.suggestion_id === decided));
}

/**
 * @param rows participations from HistoryModel.listParticipations
 */
export function buildInsights(rows, { now = new Date() } = {}) {
  const lunches = rows.filter((r) => one(r.session));
  const decided = lunches.filter((r) => one(r.session).decided_suggestion_id);
  const withBill = lunches.filter((r) => (r.shares ?? []).length > 0);
  const spentCents = sum(withBill.map((r) => sum(r.shares.map((s) => s.owed_cents))));
  const wins = decided.filter(wonPick).length;

  // Spend over the last 6 months (oldest first), including empty months.
  const months = [];
  const cursor = new Date(now.getTime() + SGT_OFFSET_MS);
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - i, 1));
    months.push(d.toISOString().slice(0, 7));
  }
  const spendMap = new Map(months.map((m) => [m, 0]));
  for (const r of withBill) {
    const key = monthKey(one(r.session).created_at);
    if (spendMap.has(key)) spendMap.set(key, spendMap.get(key) + sum(r.shares.map((s) => s.owed_cents)));
  }

  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  for (const r of decided) {
    const at = one(r.session).decided_at;
    if (at) hours[sgtHour(at)].count += 1;
  }

  // Streak: consecutive weeks (ending this week or last week) with a lunch.
  const weeks = new Set(lunches.map((r) => weekIndex(one(r.session).created_at)));
  let week = weekIndex(now);
  if (!weeks.has(week)) week -= 1;
  let streakWeeks = 0;
  while (weeks.has(week)) {
    streakWeeks += 1;
    week -= 1;
  }

  const restaurants = decided.map((r) => one(one(r.session).decided)).filter(Boolean);

  return {
    totals: {
      lunches: lunches.length,
      decided: decided.length,
      hosted: lunches.filter((r) => r.is_host).length,
      spentCents,
      avgSpendCents: withBill.length ? Math.round(spentCents / withBill.length) : 0,
      picksWon: wins,
      winRate: decided.length ? wins / decided.length : null,
      streakWeeks,
    },
    spendByMonth: months.map((month) => ({ month, cents: spendMap.get(month) })),
    cuisines: topCounts(restaurants.map((r) => r.cuisine || 'Other'), 6),
    topPlaces: topCounts(restaurants.map((r) => r.name), 5),
    decisionHours: hours.filter((h) => h.hour >= 7 && h.hour <= 22),
  };
}

/**
 * Fairness board per crew: who attends, and whose pick wins.
 * sessions: [{ crew_id, decided_suggestion_id, participants: [...], votes: [...] }]
 */
export function buildFairnessBoard(sessions, crews) {
  return crews.map((crew) => {
    const board = new Map();
    for (const session of sessions.filter((s) => s.crew_id === crew.id)) {
      for (const p of session.participants ?? []) {
        const key = p.user_id ?? `name:${p.display_name.toLowerCase()}`;
        const entry = board.get(key) ?? { key, name: p.display_name, lunches: 0, wins: 0 };
        entry.lunches += 1;
        const voted = (session.votes ?? []).some(
          (v) => v.participant_id === p.id && v.kind === 'vote' && v.suggestion_id === session.decided_suggestion_id
        );
        if (voted) entry.wins += 1;
        board.set(key, entry);
      }
    }
    const rows = [...board.values()]
      .map((r) => ({ ...r, winRate: r.lunches ? r.wins / r.lunches : 0 }))
      .sort((a, b) => b.wins - a.wins || b.lunches - a.lunches || a.name.localeCompare(b.name));
    return { crewId: crew.id, crewName: crew.name, rows };
  });
}

/**
 * Running ledger: net every unpaid transfer by the other person, so
 * "I owe Sam $5" and "Sam owes me $8" become "Sam owes me $3".
 * Signed-in people are matched across lunches by account; guests by name.
 * @returns [{ key, name, netCents (+ they owe you, - you owe them), openCount }]
 */
export function buildLedger(settlements, myParticipantIds) {
  const ledger = new Map();
  for (const s of settlements) {
    if (s.is_paid) continue;
    const iOwe = myParticipantIds.has(s.from_participant_id);
    const other = one(iOwe ? s.creditor : s.debtor);
    if (!other) continue;
    const key = other.user_id ?? `name:${other.display_name.toLowerCase()}`;
    const entry = ledger.get(key) ?? { key, name: other.display_name, netCents: 0, openCount: 0 };
    entry.netCents += iOwe ? -s.amount_cents : s.amount_cents;
    entry.openCount += 1;
    ledger.set(key, entry);
  }
  return [...ledger.values()]
    .filter((e) => e.netCents !== 0)
    .sort((a, b) => Math.abs(b.netCents) - Math.abs(a.netCents));
}
