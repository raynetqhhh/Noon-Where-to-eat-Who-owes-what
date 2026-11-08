import { supabase } from '../config/supabase.js';
import { ParticipantModel } from '../models/participantModel.js';
import { ApiError } from '../utils/ApiError.js';
import { hashToken } from '../utils/tokens.js';

// Two kinds of identity:
//   1. Signed-in users: "Authorization: Bearer <Supabase access token>"
//   2. Guests in a session: "X-Participant-Token: <token from join>"

// Verifying a token calls Supabase, so cache results briefly.
const TOKEN_CACHE_MS = 60 * 1000;
const MAX_CACHE_ENTRIES = 1000;
const tokenCache = new Map();

/** Sets req.user ({ id, email }) when a valid access token is sent, else null. */
export async function authenticateUser(req, _res, next) {
  req.user = null;
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) return next();

  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    req.user = cached.user;
    return next();
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    if (error && !error.status) throw new ApiError(503, 'Could not verify your login, please try again');
    throw ApiError.unauthorized('Your login has expired, please sign in again');
  }

  req.user = { id: data.user.id, email: data.user.email };
  tokenCache.set(token, { user: req.user, expiresAt: Date.now() + TOKEN_CACHE_MS });
  if (tokenCache.size > MAX_CACHE_ENTRIES) tokenCache.delete(tokenCache.keys().next().value);
  next();
}

export function requireUser(req, _res, next) {
  if (!req.user) throw ApiError.unauthorized('Please sign in');
  next();
}

/** Inside /sessions/:code. Sets req.participant (or null). Runs after loadSession. */
export async function attachParticipant(req, _res, next) {
  req.participant = null;
  const sessionId = req.lunchSession.id;

  if (req.user) {
    req.participant = await ParticipantModel.findByUser(sessionId, req.user.id);
  }
  const guestToken = req.get('x-participant-token');
  if (!req.participant && guestToken) {
    req.participant = await ParticipantModel.findByTokenHash(sessionId, hashToken(guestToken));
  }
  next();
}

export function requireParticipant(req, _res, next) {
  if (!req.participant) throw ApiError.unauthorized('Join this lunch first');
  next();
}

export function requireHost(req, _res, next) {
  if (!req.participant) throw ApiError.unauthorized('Join this lunch first');
  if (!req.participant.is_host) throw ApiError.forbidden('Only the host can do that');
  next();
}
