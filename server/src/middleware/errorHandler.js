import { isProd } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

// Last middleware in the chain. Express 5 forwards errors from async
// handlers here automatically, so controllers can just `throw`.
// Every error response looks like: { error: { message, details? } }
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    err = ApiError.badRequest('Malformed JSON body');
  }

  const status = err.status ?? err.statusCode ?? 500;
  if (status >= 500) console.error(err);

  const hideMessage = status >= 500 && isProd;

  res.status(status).json({
    error: {
      message: hideMessage ? 'Something went wrong' : err.message,
      ...(err.details && { details: err.details }),
      ...(status >= 500 && !isProd && { stack: err.stack }),
    },
  });
}
