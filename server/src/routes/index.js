import { Router } from 'express';
import { env } from '../config/env.js';
import { checkServiceKey } from '../config/supabase.js';
import { listSponsoredSpots } from '../controllers/suggestionController.js';
import { requireUser } from '../middleware/auth.js';
import crewRoutes from './crewRoutes.js';
import meRoutes from './meRoutes.js';
import sessionRoutes from './sessionRoutes.js';

const router = Router();

// Safe set-up check: shows the project ref (already public in the website) and
// the KIND of key configured, never the key itself.
router.get('/health', async (_req, res) => {
  const key = await checkServiceKey();
  res.json({
    data: {
      status: key.accepted ? 'ok' : 'misconfigured',
      uptime: process.uptime(),
      supabase: {
        project: env.supabaseProjectRef,
        keyType: env.supabaseKeyType,
        keyAccepted: key.accepted,
        ...(key.problem && { problem: key.problem }),
      },
    },
  });
});

router.get('/sponsored-spots', listSponsoredSpots);
router.use('/sessions', sessionRoutes);
router.use('/me', requireUser, meRoutes);
router.use('/crews', requireUser, crewRoutes);

export default router;
