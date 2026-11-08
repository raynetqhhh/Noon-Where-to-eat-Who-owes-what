import { Router } from 'express';
import { castVote, retractVote } from '../controllers/voteController.js';
import { requireParticipant } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { castVoteSchema, voteKindParamsSchema } from '../validators/suggestionSchemas.js';

// Mounted at /api/sessions/:code/votes
const router = Router({ mergeParams: true });

router.use(requireParticipant);

router.put('/', validate({ body: castVoteSchema }), castVote);
router.delete('/:kind', validate({ params: voteKindParamsSchema }), retractVote);

export default router;
