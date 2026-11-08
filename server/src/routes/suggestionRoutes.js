import { Router } from 'express';
import { createSuggestion, deleteSuggestion } from '../controllers/suggestionController.js';
import { requireParticipant } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createSuggestionSchema, suggestionParamsSchema } from '../validators/suggestionSchemas.js';

// Mounted at /api/sessions/:code/suggestions
const router = Router({ mergeParams: true });

router.use(requireParticipant);

router.post('/', validate({ body: createSuggestionSchema }), createSuggestion);
router.delete('/:suggestionId', validate({ params: suggestionParamsSchema }), deleteSuggestion);

export default router;
