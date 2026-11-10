import { apiRequest } from './client.js';

// Signed-in user endpoints (portal).

export const getMe = () => apiRequest('/me');
export const updateMe = (body) => apiRequest('/me', { method: 'PATCH', body });
/** photo: a Blob from squarePhoto() */
export const uploadAvatar = (photo) => apiRequest('/me/avatar', { method: 'PUT', body: photo });
export const deleteAvatar = () => apiRequest('/me/avatar', { method: 'DELETE' });
export const getLunches = () => apiRequest('/me/lunches');
export const getPayments = () => apiRequest('/me/payments');
export const getInsights = () => apiRequest('/me/insights');

export const getCrews = () => apiRequest('/crews');
export const getCrew = (id) => apiRequest(`/crews/${id}`);
export const createCrew = (body) => apiRequest('/crews', { method: 'POST', body });
export const updateCrew = (id, body) => apiRequest(`/crews/${id}`, { method: 'PATCH', body });
export const deleteCrew = (id) => apiRequest(`/crews/${id}`, { method: 'DELETE' });
export const addCrewMember = (id, body) => apiRequest(`/crews/${id}/members`, { method: 'POST', body });
export const updateCrewMember = (id, memberId, body) =>
  apiRequest(`/crews/${id}/members/${memberId}`, { method: 'PATCH', body });
export const removeCrewMember = (id, memberId) =>
  apiRequest(`/crews/${id}/members/${memberId}`, { method: 'DELETE' });
