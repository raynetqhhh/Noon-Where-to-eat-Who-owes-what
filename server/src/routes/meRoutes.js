import express, { Router } from 'express';
import { AVATAR_MAX_BYTES } from '../config/constants.js';
import {
  deleteAvatar,
  getInsights,
  getMe,
  listLunches,
  listPayments,
  updateMe,
  uploadAvatar,
} from '../controllers/meController.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/userSchemas.js';

// Mounted at /api/me (signed-in users only)
const router = Router();

// Photos arrive as the raw image bytes. The real type is checked from the
// bytes in avatarService, not from this header.
const imageBody = express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: AVATAR_MAX_BYTES });

router.get('/', getMe);
router.patch('/', validate({ body: updateProfileSchema }), updateMe);
router.put('/avatar', imageBody, uploadAvatar);
router.delete('/avatar', deleteAvatar);
router.get('/lunches', listLunches);
router.get('/payments', listPayments);
router.get('/insights', getInsights);

export default router;
