import { Router } from 'express';
import { listSponsoredSpots } from '../controllers/suggestionController.js';
import { requireUser } from '../middleware/auth.js';
import crewRoutes from './crewRoutes.js';
import meRoutes from './meRoutes.js';
import sessionRoutes from './sessionRoutes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok', uptime: process.uptime() } });
});

router.get('/sponsored-spots', listSponsoredSpots);
router.use('/sessions', sessionRoutes);
router.use('/me', requireUser, meRoutes);
router.use('/crews', requireUser, crewRoutes);

export default router;
