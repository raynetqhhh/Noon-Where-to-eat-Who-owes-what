import { z } from 'zod';
import { budgetCents, dietaryList, displayName, nullableText } from './common.js';

export const updateProfileSchema = z
  .strictObject({
    displayName: displayName.optional(),
    dietary: dietaryList.optional(),
    allergies: nullableText(200),
    paynowId: nullableText(40),
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
