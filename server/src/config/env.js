// Reads and validates environment variables once, at startup.
// Fail fast: a missing secret should crash on boot, not on the first request.

/** Trim spaces and one pair of surrounding quotes ("..." or '...').
 *  Hosting dashboards like Vercel keep quotes literally if you paste them. */
const clean = (value) =>
  value
    ?.trim()
    .replace(/^(['"])(.*)\1$/s, '$2')
    .trim();

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = required.filter((key) => !clean(process.env[key]));

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. ` +
      'Copy server/.env.example to server/.env and fill them in.'
  );
}

const supabaseUrl = clean(process.env.SUPABASE_URL).replace(/\/+$/, '');
const supabaseServiceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

/** "https://abcd.supabase.co" -> "abcd" (public info, safe to show). */
function projectRefOf(url) {
  try {
    return new URL(url).hostname.split('.')[0];
  } catch {
    return 'invalid-url';
  }
}

/** Which kind of key was configured, without revealing it. */
function keyTypeOf(key) {
  if (key.startsWith('sb_secret_')) return 'secret';
  if (key.startsWith('sb_publishable_')) return 'publishable (wrong key: use the secret key)';
  if (key.startsWith('eyJ')) {
    try {
      const role = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role;
      return role === 'service_role' ? 'legacy service_role' : `legacy ${role} (wrong key: use the service_role/secret key)`;
    } catch {
      return 'unrecognised';
    }
  }
  return 'unrecognised';
}

export const env = Object.freeze({
  nodeEnv: clean(process.env.NODE_ENV) || 'development',
  port: Number(clean(process.env.PORT) || 4000),
  supabaseUrl,
  supabaseServiceRoleKey,
  supabaseProjectRef: projectRefOf(supabaseUrl),
  supabaseKeyType: keyTypeOf(supabaseServiceRoleKey),
  corsOrigin: (clean(process.env.CORS_ORIGIN) || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  sessionTtlHours: Number(clean(process.env.SESSION_TTL_HOURS) || 24),
});

export const isProd = env.nodeEnv === 'production';
