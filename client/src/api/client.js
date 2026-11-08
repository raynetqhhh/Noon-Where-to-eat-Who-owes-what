import { supabase } from '../lib/supabase.js';
import { getToken } from '../utils/tokenStorage.js';

const BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export class ApiRequestError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function accessToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Small fetch wrapper: JSON in/out, attaches the signed-in user's token and
 * (inside a lunch) the guest participant token, unwraps { data }, and throws
 * ApiRequestError on failure.
 */
export async function apiRequest(path, { method = 'GET', body, sessionCode } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const jwt = await accessToken();
  if (jwt) headers.Authorization = `Bearer ${jwt}`;

  const guestToken = sessionCode ? getToken(sessionCode) : null;
  if (guestToken) headers['X-Participant-Token'] = guestToken;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiRequestError(0, "Can't reach the Noon server. Is it running?");
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiRequestError(response.status, payload.error?.message ?? 'Request failed', payload.error?.details);
  }
  return payload.data;
}

/** First field error message, for showing under a form. */
export function firstFieldError(error) {
  const fields = error?.details?.fieldErrors;
  if (!fields) return null;
  const first = Object.values(fields).find((messages) => messages?.length);
  return first?.[0] ?? null;
}
