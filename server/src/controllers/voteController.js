import { SuggestionModel } from '../models/suggestionModel.js';
import { VoteModel } from '../models/voteModel.js';
import { assertVotingOpen } from '../services/sessionRules.js';
import { ApiError } from '../utils/ApiError.js';

// PUT /api/sessions/:code/votes   body: { suggestionId, kind: 'vote' | 'veto' }
// Everyone gets one vote and one veto. Casting again moves it.
export async function castVote(req, res) {
  const session = req.lunchSession;
  assertVotingOpen(session);

  const { suggestionId, kind } = req.body;
  const suggestion = await SuggestionModel.findInSession(session.id, suggestionId);
  if (!suggestion) throw ApiError.notFound('Suggestion not found');

  const mine = await VoteModel.listForParticipant(session.id, req.participant.id);
  const other = mine.find((v) => v.kind !== kind);
  if (other?.suggestion_id === suggestion.id) {
    throw ApiError.conflict(
      kind === 'veto' ? "You can't veto the place you voted for" : "You can't vote for a place you vetoed"
    );
  }

  await VoteModel.upsert({
    sessionId: session.id,
    participantId: req.participant.id,
    suggestionId: suggestion.id,
    kind,
  });

  res.json({ data: { suggestionId: suggestion.id, kind } });
}

// DELETE /api/sessions/:code/votes/:kind
export async function retractVote(req, res) {
  const session = req.lunchSession;
  assertVotingOpen(session);

  await VoteModel.remove({ sessionId: session.id, participantId: req.participant.id, kind: req.params.kind });
  res.status(204).end();
}
