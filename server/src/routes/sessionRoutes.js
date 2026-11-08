import { Router } from 'express';
import {
  createSession,
  decideRestaurant,
  getSession,
  joinSession,
  updateSession,
} from '../controllers/sessionController.js';
import { attachParticipant, requireHost } from '../middleware/auth.js';
import { loadSession } from '../middleware/loadSession.js';
import { createLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  createSessionSchema,
  decideSchema,
  joinSessionSchema,
  updateSessionSchema,
} from '../validators/sessionSchemas.js';
import billRoutes from './billRoutes.js';
import suggestionRoutes from './suggestionRoutes.js';
import voteRoutes from './voteRoutes.js';

const router = Router();

// POST /api/sessions -> start a new lunch (guest or signed in)
router.post('/', createLimiter, validate({ body: createSessionSchema }), createSession);

// Everything under /api/sessions/:code loads the session and identifies
// the caller (signed-in user or guest token) first.
const sessionScoped = Router({ mergeParams: true });

sessionScoped.get('/', getSession);
sessionScoped.patch('/', requireHost, validate({ body: updateSessionSchema }), updateSession);
sessionScoped.post('/join', createLimiter, validate({ body: joinSessionSchema }), joinSession);
sessionScoped.post('/decision', requireHost, validate({ body: decideSchema }), decideRestaurant);
sessionScoped.use('/suggestions', suggestionRoutes);
sessionScoped.use('/votes', voteRoutes);
sessionScoped.use('/bill', billRoutes);

router.use('/:code', loadSession, attachParticipant, sessionScoped);

export default router;
