import { ApiError } from './ApiError.js';

// Supabase returns { data, error } instead of throwing.
// unwrap() converts that into "return data or throw an ApiError" so models stay short.
export function unwrap({ data, error }) {
  if (!error) return data;

  switch (error.code) {
    case '23505': // unique_violation
      throw ApiError.conflict('That record already exists', { constraint: error.details });
    case '23503': // foreign_key_violation
      throw ApiError.badRequest('A referenced record does not exist');
    case '23514': // check_violation
    case '22P02': // invalid_text_representation (e.g. bad uuid)
      throw ApiError.badRequest('Invalid data');
    default:
      throw new ApiError(500, `Database error: ${error.message}`);
  }
}
