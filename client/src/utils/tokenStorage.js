// Participant tokens are stored per session code, so one browser can be in
// several lunches. localStorage can throw (private mode, blocked storage),
// so every access is guarded.
const key = (code) => `noon:token:${code.toUpperCase()}`;

export function getToken(code) {
  try {
    return localStorage.getItem(key(code));
  } catch {
    return null;
  }
}

export function saveToken(code, token) {
  try {
    localStorage.setItem(key(code), token);
  } catch {
    /* storage unavailable: user will need to re-join on reload */
  }
}

export function clearToken(code) {
  try {
    localStorage.removeItem(key(code));
  } catch {
    /* ignore */
  }
}
