import { z } from 'zod';
import { SUGGESTION_TAGS, VOTE_KINDS } from '../config/constants.js';
import { optionalText } from './common.js';

const customSuggestion = z.strictObject({
  name: z.string().trim().min(1, 'Restaurant name is required').max(100),
  cuisine: optionalText(40),
  tags: z.array(z.enum(SUGGESTION_TAGS)).max(12).default([]),
  pricePerHeadCents: z.int().min(1).max(100_000).optional(),
  location: optionalText(120),
  url: z.url({ protocol: /^https?$/ }).max(500).optional(),
});

const sponsoredSuggestion = z.strictObject({
  sponsoredSpotId: z.string().min(1).max(60),
});

export const createSuggestionSchema = z.union([sponsoredSuggestion, customSuggestion]);

export const suggestionParamsSchema = z.object({
  suggestionId: z.uuid(),
});

export const castVoteSchema = z.strictObject({
  suggestionId: z.uuid(),
  kind: z.enum(VOTE_KINDS).default('vote'),
});

export const voteKindParamsSchema = z.object({
  kind: z.enum(VOTE_KINDS),
});
