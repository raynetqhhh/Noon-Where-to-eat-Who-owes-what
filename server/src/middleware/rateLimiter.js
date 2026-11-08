import rateLimit from 'express-rate-limit';

const message = (text) => ({ error: { message: text } });

// General ceiling for every /api request.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Too many requests, please slow down.'),
});

// Stricter limit for creating sessions / joining, which are the spammable actions.
export const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Too many sessions created, try again later.'),
});
