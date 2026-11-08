import { z } from 'zod';
import { budgetCents, dietaryList, displayName } from './common.js';

const votingMinutes = z.int().min(1).max(240);

export const createSessionSchema = z.strictObject({
  title: z.string().trim().min(1).max(80).default('Lunch'),
  // Required for guests; signed-in hosts use their profile name.
  hostName: displayName.optional(),
  dietary: dietaryList.default([]),
  crewId: z.uuid().optional(),
  budgetPerHeadCents: budgetCents.optional(),
  votingMinutes: votingMinutes.optional(),
});

export const joinSessionSchema = z.strictObject({
  displayName: displayName.optional(),
  dietary: dietaryList.default([]),
  // Guests in a crew lunch can claim their name from the crew list.
  crewMemberId: z.uuid().optional(),
});

export const updateSessionSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(80).optional(),
    isLocked: z.boolean().optional(),
    votingMinutes: votingMinutes.nullable().optional(), // null clears the countdown
    budgetPerHeadCents: budgetCents.nullable().optional(),
    status: z.enum(['closed', 'open']).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

// auto: true -> fairness-weighted pick. suggestionId -> host picks.
// suggestionId: null -> re-open voting.
export const decideSchema = z
  .strictObject({
    auto: z.boolean().optional(),
    suggestionId: z.uuid().nullable().optional(),
  })
  .refine((v) => v.auto === true || v.suggestionId !== undefined, 'Send auto: true or a suggestionId');
