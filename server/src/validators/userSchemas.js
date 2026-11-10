import { z } from 'zod';
import { CUISINES, MAX_FAVOURITE_FOODS } from '../config/constants.js';
import { budgetCents, dietaryList, displayName, nullableText } from './common.js';

// Free-text dishes: trimmed, de-duplicated (case-insensitive), blanks dropped.
const favouriteFoods = z
  .array(z.string().trim().max(30, 'Keep each dish under 30 characters'))
  .max(MAX_FAVOURITE_FOODS, `Pick up to ${MAX_FAVOURITE_FOODS} dishes`)
  .transform((list) => {
    const seen = new Set();
    return list.filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

export const updateProfileSchema = z
  .strictObject({
    displayName: displayName.optional(),
    dietary: dietaryList.optional(),
    allergies: nullableText(200),
    paynowId: nullableText(40),
    tagline: nullableText(80),
    favouriteCuisines: z.array(z.enum(CUISINES)).max(CUISINES.length).transform((l) => [...new Set(l)]).optional(),
    favouriteFoods: favouriteFoods.optional(),
    spiceLevel: z.int().min(0).max(3).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const createCrewSchema = z.strictObject({
  name: z.string().trim().min(1, 'Crew name is required').max(60),
  budgetPerHeadCents: budgetCents.nullable().optional(),
  meetingPoint: nullableText(120),
});

export const updateCrewSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(60).optional(),
    budgetPerHeadCents: budgetCents.nullable().optional(),
    meetingPoint: nullableText(120),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const crewMemberSchema = z.strictObject({
  displayName,
  dietary: dietaryList.default([]),
});

export const updateCrewMemberSchema = z
  .strictObject({
    displayName: displayName.optional(),
    dietary: dietaryList.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const crewParamsSchema = z.object({ crewId: z.uuid() });
export const crewMemberParamsSchema = z.object({ crewId: z.uuid(), memberId: z.uuid() });
