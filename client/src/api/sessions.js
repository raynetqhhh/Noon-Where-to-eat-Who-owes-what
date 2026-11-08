import { apiRequest } from './client.js';

// One function per lunch-session endpoint. Components call these, never fetch() directly.

export const createSession = (body) => apiRequest('/sessions', { method: 'POST', body });

export const getSession = (code) => apiRequest(`/sessions/${code}`, { sessionCode: code });

export const joinSession = (code, body) =>
  apiRequest(`/sessions/${code}/join`, { method: 'POST', body, sessionCode: code });

/** Host: { isLocked, votingMinutes, budgetPerHeadCents, status: 'closed' | 'open' } */
export const updateSession = (code, body) =>
  apiRequest(`/sessions/${code}`, { method: 'PATCH', body, sessionCode: code });

/** Host: { auto: true } | { suggestionId } | { suggestionId: null } to reopen */
export const decide = (code, body) =>
  apiRequest(`/sessions/${code}/decision`, { method: 'POST', body, sessionCode: code });

export const addSuggestion = (code, body) =>
  apiRequest(`/sessions/${code}/suggestions`, { method: 'POST', body, sessionCode: code });

export const removeSuggestion = (code, suggestionId) =>
  apiRequest(`/sessions/${code}/suggestions/${suggestionId}`, { method: 'DELETE', sessionCode: code });

export const castVote = (code, suggestionId, kind = 'vote') =>
  apiRequest(`/sessions/${code}/votes`, { method: 'PUT', body: { suggestionId, kind }, sessionCode: code });

export const retractVote = (code, kind = 'vote') =>
  apiRequest(`/sessions/${code}/votes/${kind}`, { method: 'DELETE', sessionCode: code });

export const saveBill = (code, body) =>
  apiRequest(`/sessions/${code}/bill`, { method: 'PUT', body, sessionCode: code });

export const setSettlementPaid = (code, settlementId, isPaid) =>
  apiRequest(`/sessions/${code}/bill/settlements/${settlementId}`, {
    method: 'PATCH',
    body: { isPaid },
    sessionCode: code,
  });

export const getSponsoredSpots = () => apiRequest('/sponsored-spots');
