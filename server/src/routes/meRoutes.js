import { Router } from 'express';
import { getInsights, getMe, listLunches, listPayments, updateMe } from '../controllers/meController.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/userSchemas.js';

// Mounted at /api/me (signed-in users only)
const router = Router();

router.get('/', getMe);
router.patch('/', validate({ body: updateProfileSchema }), updateMe);
router.get('/lunches', listLunches);
router.get('/payments', listPayments);
router.get('/insights', getInsights);

export default router;
