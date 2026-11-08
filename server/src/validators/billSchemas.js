import { z } from 'zod';

const cents = z.int().min(1).max(10_000_000); // up to $100,000

export const saveBillSchema = z.strictObject({
  items: z
    .array(
      z.strictObject({
        name: z.string().trim().min(1, 'Item name is required').max(80),
        amountCents: cents,
        participantIds: z.array(z.uuid()).min(1, 'Pick who shared this item').max(50),
      })
    )
    .min(1, 'Add at least one item')
    .max(200),
  discountCents: z.int().min(0).max(10_000_000).default(0),
  serviceChargePct: z.number().min(0).max(100).default(10),
  taxPct: z.number().min(0).max(100).default(9),
  // One payer may omit amountCents (= pays the whole bill).
  payers: z
    .array(z.strictObject({ participantId: z.uuid(), amountCents: z.int().min(0).max(10_000_000).optional() }))
    .min(1, 'Who paid?')
    .max(50),
});

export const settlementParamsSchema = z.object({
  settlementId: z.uuid(),
});

export const updateSettlementSchema = z.strictObject({
  isPaid: z.boolean(),
});
