import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeWinStats, explainDecision, rankSuggestions, winRate } from '../src/services/decisionService.js';
import { buildLedger } from '../src/services/insightService.js';

const vote = (participant_id, kind = 'vote') => ({ participant_id, kind });

describe('rankSuggestions', () => {
  it('puts vetoed places last regardless of votes', () => {
    const ranked = rankSuggestions([
      { id: 's1', name: 'Popular', votes: [vote('a'), vote('b'), vote('c', 'veto')] },
      { id: 's2', name: 'Okay', votes: [vote('c')] },
    ]);
    assert.deepEqual(ranked.map((r) => r.id), ['s2', 's1']);
  });

  it('applies the "been there recently" penalty', () => {
    const ranked = rankSuggestions(
      [
        { id: 's1', name: 'Same Again', votes: [vote('a')] },
        { id: 's2', name: 'New Place', votes: [vote('b')] },
      ],
      { recentNames: ['same again'] }
    );
    assert.equal(ranked[0].id, 's2');
  });

  it('breaks ties in favour of people who have lost more often', () => {
    const winRates = new Map([
      ['lucky', 0.9],
      ['unlucky', 0.1],
    ]);
    const ranked = rankSuggestions(
      [
        { id: 's1', name: 'Lucky pick', votes: [vote('lucky')] },
        { id: 's2', name: 'Unlucky pick', votes: [vote('unlucky')] },
      ],
      { winRates }
    );
    assert.equal(ranked[0].id, 's2');
    assert.match(explainDecision(ranked).reason, /Fairness tie-breaker/);
  });

  it('returns null when everything is vetoed', () => {
    const ranked = rankSuggestions([{ id: 's1', name: 'X', votes: [vote('a', 'veto')] }]);
    assert.equal(explainDecision(ranked), null);
  });
});

describe('computeWinStats / winRate', () => {
  it('counts wins when a user voted for the decided place', () => {
    const stats = computeWinStats([
      { user_id: 'u1', session: { decided_suggestion_id: 'x' }, votes: [{ suggestion_id: 'x', kind: 'vote' }] },
      { user_id: 'u1', session: { decided_suggestion_id: 'y' }, votes: [{ suggestion_id: 'x', kind: 'vote' }] },
      { user_id: 'u1', session: { decided_suggestion_id: null }, votes: [] },
    ]);
    assert.deepEqual(stats.get('u1'), { wins: 1, lunches: 2 });
    assert.equal(winRate(undefined), 0.5);
  });
});

describe('buildLedger', () => {
  it('nets debts in both directions with the same person', () => {
    const me = new Set(['p1', 'p2']);
    const sam = { id: 'x', display_name: 'Sam', user_id: 'sam' };
    const ledger = buildLedger(
      [
        { is_paid: false, amount_cents: 500, from_participant_id: 'p1', to_participant_id: 'x', creditor: sam },
        { is_paid: false, amount_cents: 800, from_participant_id: 'y', to_participant_id: 'p2', debtor: { ...sam, id: 'y' } },
        { is_paid: true, amount_cents: 999, from_participant_id: 'p1', to_participant_id: 'x', creditor: sam },
      ],
      me
    );
    assert.deepEqual(ledger, [{ key: 'sam', name: 'Sam', netCents: 300, openCount: 2 }]);
  });
});
