import { ApiError } from '../utils/ApiError.js';

// Business rules about what a session currently allows.

export const isExpired = (session) => new Date(session.expires_at) < new Date();

export const deadlinePassed = (session) =>
  Boolean(session.voting_deadline) && new Date(session.voting_deadline) < new Date();

/** @returns {string|null} why voting is closed, or null if it is open */
export function votingClosedReason(session) {
  if (isExpired(session)) return 'This lunch link has expired';
  if (session.status !== 'voting') return 'Voting has closed for this lunch';
  if (session.is_locked) return 'The host has locked voting';
  if (deadlinePassed(session)) return "Time's up! Voting has ended";
  return null;
}

export function assertVotingOpen(session) {
  const reason = votingClosedReason(session);
  if (reason) throw ApiError.conflict(reason);
}

export function assertJoinable(session) {
  if (isExpired(session)) throw ApiError.conflict('This lunch link has expired');
  if (session.status === 'closed') throw ApiError.conflict('The host has closed this lunch');
  if (session.status === 'settled') throw ApiError.conflict('This lunch is already settled');
}
