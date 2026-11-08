import { env } from '../config/env.js';
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

// Supabase error codes that mean "this login token is no good" (sign in again).
const TOKEN_PROBLEMS = new Set(['bad_jwt', 'session_not_found', 'session_expired', 'user_not_found', 'refresh_token_not_found']);

/** Read the project ref from a token's "iss" claim, without verifying it. */
function projectRefOfToken(token) {
  try {
    const { iss } = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return new URL(iss).hostname.split('.')[0];
  } catch {
    return null;
  }
}

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

  // A token from a different Supabase project can never verify here. That is a
  // server set-up problem, not an expired login, so say so.
  const tokenProject = projectRefOfToken(token);
  if (tokenProject && tokenProject !== env.supabaseProjectRef) {
    console.error(`Login token is from Supabase project "${tokenProject}" but the server uses "${env.supabaseProjectRef}".`);
    throw ApiError.misconfigured('The website and server are connected to different Supabase projects. Check SUPABASE_URL on the server.');
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    if (error && !error.status) throw new ApiError(503, 'Could not verify your login, please try again');
    if (TOKEN_PROBLEMS.has(error?.code) || error?.status === 403) {
      throw ApiError.unauthorized('Your login has expired, please sign in again');
    }
    // Anything else (e.g. 401 "Invalid API key") means the server's own key is wrong.
    console.error('Supabase refused the server while verifying a login:', error?.status, error?.code, error?.message);
    throw ApiError.misconfigured('The server could not verify your login. Check SUPABASE_SERVICE_ROLE_KEY on the server.');
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
