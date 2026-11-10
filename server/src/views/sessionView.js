// Views turn database rows (snake_case) into the JSON the React app receives
// (camelCase), and decide what is safe to expose.
import { rankSuggestions } from '../services/decisionService.js';
import { isExpired, votingClosedReason } from '../services/sessionRules.js';
import { presentBill } from './billView.js';

const one = (value) => (Array.isArray(value) ? (value[0] ?? null) : (value ?? null));

export function presentParticipant(row) {
  const profile = one(row.profile);
  return {
    id: row.id,
    displayName: row.display_name,
    isHost: row.is_host,
    hasAccount: Boolean(row.user_id),
    dietary: row.dietary ?? [],
    paynowId: profile?.paynow_id ?? null,
    // Taste from the person's profile (signed-in people only). Allergies stay private.
    avatarUrl: profile?.avatar_url ?? null,
    favouriteCuisines: profile?.favourite_cuisines ?? [],
    favouriteFoods: profile?.favourite_foods ?? [],
    spiceLevel: profile?.spice_level ?? null,
    joinedAt: row.created_at,
  };
}

export function presentSession(row) {
  const closedReason = votingClosedReason(row);
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    status: row.status,
    decidedSuggestionId: row.decided_suggestion_id,
    decidedAt: row.decided_at,
    decisionReason: row.decision_reason,
    budgetPerHeadCents: row.budget_per_head_cents,
    votingDeadline: row.voting_deadline,
    isLocked: row.is_locked,
    isExpired: isExpired(row),
    votingOpen: closedReason === null,
    votingClosedReason: closedReason,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export function presentSuggestion(row, viewerId = null) {
  const votes = row.votes ?? [];
  const voters = votes.filter((v) => v.kind === 'vote').map((v) => v.participant_id);
  const vetoers = votes.filter((v) => v.kind === 'veto').map((v) => v.participant_id);
  return {
    id: row.id,
    name: row.name,
    cuisine: row.cuisine,
    tags: row.tags ?? [],
    pricePerHeadCents: row.price_per_head_cents,
    location: row.location,
    url: row.url,
    isSponsored: row.is_sponsored,
    deal: row.deal,
    suggestedBy: row.suggested_by,
    createdAt: row.created_at,
    voteCount: voters.length,
    vetoCount: vetoers.length,
    voterIds: voters,
    votedByMe: Boolean(viewerId && voters.includes(viewerId)),
    vetoedByMe: Boolean(viewerId && vetoers.includes(viewerId)),
  };
}

const byCreatedAt = (a, b) => a.created_at.localeCompare(b.created_at);

export function presentSessionDetails(row, { viewer = null, bill = null } = {}) {
  const participantRows = [...(row.participants ?? [])].sort(byCreatedAt);
  const suggestionRows = [...(row.suggestions ?? [])].sort(byCreatedAt);

  // Display order: vetoed last, then by votes, then oldest first.
  const order = rankSuggestions(suggestionRows).map((r) => r.id);
  const byId = new Map(suggestionRows.map((s) => [s.id, s]));

  const crew = one(row.crew);

  return {
    ...presentSession(row),
    crew: crew
      ? {
          id: crew.id,
          name: crew.name,
          meetingPoint: crew.meeting_point,
          members: (crew.members ?? []).map((m) => ({ id: m.id, displayName: m.display_name, dietary: m.dietary ?? [] })),
        }
      : null,
    me: viewer ? presentParticipant(viewer) : null,
    participants: participantRows.map(presentParticipant),
    suggestions: order.map((id) => presentSuggestion(byId.get(id), viewer?.id)),
    bill: bill ? presentBill(bill, participantRows) : null,
  };
}
