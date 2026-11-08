import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

/**
 * Validate request parts against zod schemas before the controller runs.
 *   router.post('/', validate({ body: createSessionSchema }), controller)
 * The parsed body (trimmed, defaults applied, unknown keys rejected)
 * replaces req.body.
 */
export const validate = (schemas) => (req, _res, next) => {
  for (const part of ['params', 'query', 'body']) {
    const schema = schemas[part];
    if (!schema) continue;

    const result = schema.safeParse(req[part] ?? {});
    if (!result.success) {
      // { formErrors: [...], fieldErrors: { field: [...] } }
      throw ApiError.badRequest(`Invalid request ${part}`, z.flattenError(result.error));
    }
    if (part === 'body') req.body = result.data;
  }
  next();
};
