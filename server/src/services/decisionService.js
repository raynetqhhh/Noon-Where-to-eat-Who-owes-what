// How Noon picks a winner:
//   1. Any vetoed place is out.
//   2. Most votes wins. A place the group went to in its last few lunches
//      loses half a vote ("been there recently" penalty).
//   3. Tie? Fairness tie-breaker: pick the place whose voters have had their
//      pick chosen least often in past lunches.
//   4. Still tied? The place suggested first.
// Sponsored places get no boost: ranking ignores is_sponsored entirely.

export const RECENT_PENALTY = 0.5;

const normalize = (name) => String(name ?? '').trim().toLowerCase();

/**
 * Build win stats per user from their past participations.
 * rows: [{ user_id, session: { decided_suggestion_id }, votes: [{ suggestion_id, kind }] }]
 * @returns {Map<string, { wins: number, lunches: number }>}
 */
export function computeWinStats(rows) {
  const stats = new Map();
  for (const row of rows) {
    const decided = row.session?.decided_suggestion_id;
    if (!decided || !row.user_id) continue;
    const entry = stats.get(row.user_id) ?? { wins: 0, lunches: 0 };
    entry.lunches += 1;
    if ((row.votes ?? []).some((v) => v.kind === 'vote' && v.suggestion_id === decided)) entry.wins += 1;
    stats.set(row.user_id, entry);
  }
  return stats;
}

/** Smoothed win rate, so a newcomer starts at a neutral 0.5. */
export const winRate = (stat) => ((stat?.wins ?? 0) + 1) / ((stat?.lunches ?? 0) + 2);

/**
 * @param suggestions rows in creation order, each with votes: [{ participant_id, kind }]
 * @param recentNames names decided in recent lunches
 * @param winRates Map<participantId, number between 0 and 1>
 */
export function rankSuggestions(suggestions, { recentNames = [], winRates = new Map() } = {}) {
  const recent = new Set(recentNames.map(normalize));

  const ranked = suggestions.map((s, index) => {
    const votes = (s.votes ?? []).filter((v) => v.kind === 'vote');
    const vetoes = (s.votes ?? []).filter((v) => v.kind === 'veto');
    const isRecent = recent.has(normalize(s.name));
    const voterRates = votes.map((v) => winRates.get(v.participant_id) ?? 0.5);
    return {
      id: s.id,
      name: s.name,
      index,
      voteCount: votes.length,
      vetoCount: vetoes.length,
      vetoed: vetoes.length > 0,
      recent: isRecent,
      score: votes.length - (isRecent ? RECENT_PENALTY : 0),
      // Lower = these voters have "lost" more often, so they get priority.
      fairness: voterRates.length ? voterRates.reduce((a, b) => a + b, 0) / voterRates.length : 1,
    };
  });

  return ranked.sort(
    (a, b) =>
      Number(a.vetoed) - Number(b.vetoed) ||
      b.score - a.score ||
      a.fairness - b.fairness ||
      a.index - b.index
  );
}

/** @returns {{ winnerId: string, reason: string } | null} null if nothing is eligible */
export function explainDecision(ranked) {
  const [winner, runnerUp] = ranked;
  if (!winner || winner.vetoed) return null;

  const parts = [];
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  if (runnerUp && !runnerUp.vetoed && runnerUp.score === winner.score) {
    if (runnerUp.fairness !== winner.fairness) {
      parts.push(
        `Tied with ${runnerUp.name}. Fairness tie-breaker: ${winner.name}'s voters have had their pick chosen less often lately.`
      );
    } else {
      parts.push(`Tied with ${runnerUp.name}; ${winner.name} was suggested first.`);
    }
  } else {
    parts.push(`Most votes (${plural(winner.voteCount, 'vote')}).`);
  }

  const penalised = ranked.filter((r) => r.recent && !r.vetoed && r.id !== winner.id);
  if (penalised.length) parts.push(`Recently visited places lost half a vote: ${penalised.map((r) => r.name).join(', ')}.`);

  const vetoed = ranked.filter((r) => r.vetoed).length;
  if (vetoed) parts.push(`${plural(vetoed, 'place')} vetoed.`);

  return { winnerId: winner.id, reason: parts.join(' ') };
}
