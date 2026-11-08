import { z } from 'zod';
import { DIETARY } from '../config/constants.js';

export const displayName = z.string().trim().min(1, 'Name is required').max(40);
export const dietaryList = z.array(z.enum(DIETARY)).max(DIETARY.length);
export const budgetCents = z.int().min(1).max(1_000_000);
export const optionalText = (max) => z.string().trim().max(max).optional();
export const nullableText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v));
