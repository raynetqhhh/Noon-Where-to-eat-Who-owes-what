import { SPONSORED_SPOTS } from '../config/sponsoredSpots.js';
import { SuggestionModel } from '../models/suggestionModel.js';
import { assertVotingOpen } from '../services/sessionRules.js';
import { ApiError } from '../utils/ApiError.js';
import { presentSuggestion } from '../views/sessionView.js';

const MAX_SUGGESTIONS_PER_SESSION = 30;

// GET /api/sponsored-spots   (mock-up data, public)
export function listSponsoredSpots(_req, res) {
  res.json({ data: SPONSORED_SPOTS });
}

// POST /api/sessions/:code/suggestions
export async function createSuggestion(req, res) {
  const session = req.lunchSession;
  assertVotingOpen(session);

  const count = await SuggestionModel.countInSession(session.id);
  if (count >= MAX_SUGGESTIONS_PER_SESSION) {
    throw ApiError.conflict(`A lunch can have at most ${MAX_SUGGESTIONS_PER_SESSION} places`);
  }

  let fields;
  if (req.body.sponsoredSpotId) {
    const spot = SPONSORED_SPOTS.find((s) => s.id === req.body.sponsoredSpotId);
    if (!spot) throw ApiError.notFound('Sponsored spot not found');
    const { id: _id, ...details } = spot;
    fields = { ...details, isSponsored: true };
  } else {
    fields = { ...req.body, isSponsored: false, deal: null };
  }

  const suggestion = await SuggestionModel.create({
    sessionId: session.id,
    suggestedBy: req.participant.id,
    ...fields,
  });

  res.status(201).json({ data: presentSuggestion(suggestion, req.participant.id) });
}

// DELETE /api/sessions/:code/suggestions/:suggestionId
export async function deleteSuggestion(req, res) {
  const session = req.lunchSession;
  assertVotingOpen(session);

  const suggestion = await SuggestionModel.findInSession(session.id, req.params.suggestionId);
  if (!suggestion) throw ApiError.notFound('Suggestion not found');

  const isOwner = suggestion.suggested_by === req.participant.id;
  if (!isOwner && !req.participant.is_host) {
    throw ApiError.forbidden('Only the person who suggested it, or the host, can remove it');
  }

  await SuggestionModel.remove(session.id, suggestion.id);
  res.status(204).end();
}
