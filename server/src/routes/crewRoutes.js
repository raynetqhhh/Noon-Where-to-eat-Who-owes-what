import { Router } from 'express';
import {
  addMember,
  createCrew,
  deleteCrew,
  getCrew,
  listCrews,
  removeMember,
  updateCrew,
  updateMember,
} from '../controllers/crewController.js';
import { validate } from '../middleware/validate.js';
import {
  createCrewSchema,
  crewMemberParamsSchema,
  crewMemberSchema,
  crewParamsSchema,
  updateCrewMemberSchema,
  updateCrewSchema,
} from '../validators/userSchemas.js';

// Mounted at /api/crews (signed-in users only)
const router = Router();
const crew = validate({ params: crewParamsSchema });
const member = validate({ params: crewMemberParamsSchema });

router.get('/', listCrews);
router.post('/', validate({ body: createCrewSchema }), createCrew);
router.get('/:crewId', crew, getCrew);
router.patch('/:crewId', crew, validate({ body: updateCrewSchema }), updateCrew);
router.delete('/:crewId', crew, deleteCrew);
router.post('/:crewId/members', crew, validate({ body: crewMemberSchema }), addMember);
router.patch('/:crewId/members/:memberId', member, validate({ body: updateCrewMemberSchema }), updateMember);
router.delete('/:crewId/members/:memberId', member, removeMember);

export default router;
