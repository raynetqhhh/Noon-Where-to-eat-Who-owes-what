import { Router } from 'express';
import { getBill, saveBill, updateSettlement } from '../controllers/billController.js';
import { requireHost, requireParticipant } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { saveBillSchema, settlementParamsSchema, updateSettlementSchema } from '../validators/billSchemas.js';

// Mounted at /api/sessions/:code/bill
const router = Router({ mergeParams: true });

router.get('/', getBill);
router.put('/', requireHost, validate({ body: saveBillSchema }), saveBill);
router.patch(
  '/settlements/:settlementId',
  requireParticipant,
  validate({ params: settlementParamsSchema, body: updateSettlementSchema }),
  updateSettlement
);

export default router;
