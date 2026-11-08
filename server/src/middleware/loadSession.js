import { SessionModel } from '../models/sessionModel.js';
import { ApiError } from '../utils/ApiError.js';

const CODE_PATTERN = /^[A-Z0-9]{6}$/;

// Resolves :code in the URL to a session row and puts it on req.lunchSession.
// (Not req.session, which is commonly used by express-session.)
// Expired sessions still load, so history and settling debts keep working;
// sessionRules blocks joining and voting on them.
export async function loadSession(req, _res, next) {
  const code = String(req.params.code ?? '').toUpperCase();
  if (!CODE_PATTERN.test(code)) throw ApiError.notFound('Lunch not found');

  const session = await SessionModel.findByCode(code);
  if (!session) throw ApiError.notFound('Lunch not found');

  req.lunchSession = session;
  next();
}
