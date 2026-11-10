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
    case '42501': // insufficient_privilege: RLS blocked us, so we're not using the secret key
      throw ApiError.misconfigured(
        'The server is using the wrong Supabase key. SUPABASE_SERVICE_ROLE_KEY must be the secret (service_role) key.'
      );
    case '42703': // undefined_column
    case 'PGRST204': // column not in PostgREST's schema cache
      throw ApiError.misconfigured(
        'The database is missing a migration. Run the newest file in supabase/migrations in the Supabase SQL editor.'
      );
    default:
      throw new ApiError(500, `Database error: ${error.message}`);
  }
}
