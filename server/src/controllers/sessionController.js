import { env } from '../config/env.js';
import { BillModel } from '../models/billModel.js';
import { canAccessCrew, CrewModel } from '../models/crewModel.js';
import { HistoryModel } from '../models/historyModel.js';
import { ParticipantModel } from '../models/participantModel.js';
import { SessionModel } from '../models/sessionModel.js';
import { SuggestionModel } from '../models/suggestionModel.js';
import { computeWinStats, explainDecision, rankSuggestions, winRate } from '../services/decisionService.js';
import { ensureProfile } from '../services/profileService.js';
import { assertJoinable } from '../services/sessionRules.js';
import { ApiError } from '../utils/ApiError.js';
import { generateSessionCode, generateToken, hashToken } from '../utils/tokens.js';
import { presentParticipant, presentSession, presentSessionDetails } from '../views/sessionView.js';

const MAX_CODE_ATTEMPTS = 5;
const minutesFromNow = (minutes) => new Date(Date.now() + minutes * 60 * 1000).toISOString();

async function createSessionWithUniqueCode(fields) {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    try {
      return await SessionModel.create({ ...fields, code: generateSessionCode() });
    } catch (err) {
      if (err.status !== 409) throw err; // only retry on a code collision
    }
  }
  throw new ApiError(503, 'Could not create a lunch code, please try again');
}

function nameTaken(name) {
  return ApiError.conflict(`Someone in this lunch is already called "${name}". Try another name.`);
}

// POST /api/sessions
export async function createSession(req, res) {
  const { title, hostName, dietary, crewId, budgetPerHeadCents, votingMinutes } = req.body;

  const profile = req.user ? await ensureProfile(req.user) : null;
  if (!profile && !hostName) {
    throw ApiError.badRequest('Tell us your name', { fieldErrors: { hostName: ['Name is required'] } });
  }

  let crew = null;
  if (crewId) {
    if (!req.user) throw ApiError.unauthorized('Sign in to start a lunch with a crew');
    crew = await CrewModel.findById(crewId);
    if (!crew || !canAccessCrew(crew, req.user.id)) throw ApiError.notFound('Crew not found');
  }

  const session = await createSessionWithUniqueCode({
    title,
    expiresAt: new Date(Date.now() + env.sessionTtlHours * 60 * 60 * 1000).toISOString(),
    crewId: crew?.id ?? null,
    hostUserId: req.user?.id ?? null,
    budgetPerHeadCents: budgetPerHeadCents ?? crew?.budget_per_head_cents ?? null,
    votingDeadline: votingMinutes ? minutesFromNow(votingMinutes) : null,
  });

  const token = profile ? null : generateToken();
  let host;
  try {
    host = await ParticipantModel.create({
      sessionId: session.id,
      displayName: profile?.display_name ?? hostName,
      tokenHash: token ? hashToken(token) : null,
      isHost: true,
      userId: req.user?.id ?? null,
      crewMemberId: crew?.members.find((m) => m.profile_id === req.user?.id)?.id ?? null,
      dietary: profile?.dietary ?? dietary,
    });
  } catch (err) {
    // Don't leave a session without a host behind.
    await SessionModel.remove(session.id).catch(() => {});
    throw err;
  }

  res.status(201).json({
    data: { session: presentSession(session), participant: presentParticipant(host), token },
  });
}

// GET /api/sessions/:code
export async function getSession(req, res) {
  const [details, bill] = await Promise.all([
    SessionModel.findDetailsById(req.lunchSession.id),
    BillModel.findBySessionId(req.lunchSession.id),
  ]);
  res.json({ data: presentSessionDetails(details, { viewer: req.participant, bill }) });
}

// POST /api/sessions/:code/join
export async function joinSession(req, res) {
  const session = req.lunchSession;

  // Already in (e.g. signed-in user opening the link again).
  if (req.participant) {
    return res.json({ data: { participant: presentParticipant(req.participant), token: null } });
  }
  assertJoinable(session);

  let crewMember = null;
  if (req.body.crewMemberId) {
    if (!session.crew_id) throw ApiError.badRequest('This lunch is not linked to a crew');
    crewMember = await CrewModel.findMember(session.crew_id, req.body.crewMemberId);
    if (!crewMember) throw ApiError.notFound('Crew member not found');
  }

  const profile = req.user ? await ensureProfile(req.user) : null;
  const displayName = profile?.display_name ?? crewMember?.display_name ?? req.body.displayName;
  if (!displayName) {
    throw ApiError.badRequest('Tell us your name', { fieldErrors: { displayName: ['Name is required'] } });
  }

  const token = profile ? null : generateToken();
  try {
    const participant = await ParticipantModel.create({
      sessionId: session.id,
      displayName,
      tokenHash: token ? hashToken(token) : null,
      userId: req.user?.id ?? null,
      crewMemberId: crewMember?.id ?? null,
      dietary: profile?.dietary ?? crewMember?.dietary ?? req.body.dietary,
    });
    res.status(201).json({ data: { participant: presentParticipant(participant), token } });
  } catch (err) {
    if (err.status === 409) throw nameTaken(displayName);
    throw err;
  }
}

// PATCH /api/sessions/:code   (host only): lock, countdown, budget, close/reopen
export async function updateSession(req, res) {
  const session = req.lunchSession;
  const { title, isLocked, votingMinutes, budgetPerHeadCents, status } = req.body;
  const fields = {};

  if (title !== undefined) fields.title = title;
  if (isLocked !== undefined) fields.is_locked = isLocked;
  if (votingMinutes !== undefined) fields.voting_deadline = votingMinutes === null ? null : minutesFromNow(votingMinutes);
  if (budgetPerHeadCents !== undefined) fields.budget_per_head_cents = budgetPerHeadCents;

  if (status === 'closed') {
    if (session.status === 'settled') throw ApiError.conflict('This lunch is already settled');
    fields.status = 'closed';
  }
  if (status === 'open') {
    if (session.status !== 'closed') throw ApiError.conflict('Only a closed lunch can be reopened');
    fields.status = session.decided_suggestion_id ? 'decided' : 'voting';
  }

  if (Object.keys(fields).length === 0) return res.json({ data: presentSession(session) });
  const updated = await SessionModel.update(session.id, fields);
  res.json({ data: presentSession(updated) });
}

async function pickFairly(session) {
  const details = await SessionModel.findDetailsById(session.id);
  const suggestions = [...(details.suggestions ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (suggestions.length === 0) throw ApiError.conflict('Add at least one place before deciding');

  const participants = details.participants ?? [];
  const userIds = participants.map((p) => p.user_id).filter(Boolean);

  const [history, recentNames] = await Promise.all([
    HistoryModel.listWinHistory(userIds, session.id),
    HistoryModel.listRecentDecidedNames({
      crewId: session.crew_id,
      hostUserId: session.host_user_id,
      excludeSessionId: session.id,
    }),
  ]);

  const stats = computeWinStats(history);
  const winRates = new Map(participants.map((p) => [p.id, p.user_id ? winRate(stats.get(p.user_id)) : 0.5]));
  const decision = explainDecision(rankSuggestions(suggestions, { recentNames, winRates }));
  if (!decision) throw ApiError.conflict('Every place has been vetoed. Add another option first.');
  return decision;
}

// POST /api/sessions/:code/decision   (host only)
export async function decideRestaurant(req, res) {
  const session = req.lunchSession;
  const { auto, suggestionId } = req.body;

  if (session.status === 'settled') throw ApiError.conflict('This lunch is already settled');
  if (session.status === 'closed') throw ApiError.conflict('Reopen this lunch first');

  // Re-open voting.
  if (!auto && suggestionId === null) {
    const updated = await SessionModel.update(session.id, {
      status: 'voting',
      decided_suggestion_id: null,
      decided_at: null,
      decision_reason: null,
      is_locked: false,
    });
    return res.json({ data: presentSession(updated) });
  }

  let winnerId = suggestionId;
  let reason = 'Picked by the host.';
  if (auto) {
    ({ winnerId, reason } = await pickFairly(session));
  } else {
    const suggestion = await SuggestionModel.findInSession(session.id, suggestionId);
    if (!suggestion) throw ApiError.notFound('Suggestion not found');
  }

  const updated = await SessionModel.update(session.id, {
    status: 'decided',
    decided_suggestion_id: winnerId,
    decided_at: new Date().toISOString(),
    decision_reason: reason,
    is_locked: true,
  });
  res.json({ data: presentSession(updated) });
}
