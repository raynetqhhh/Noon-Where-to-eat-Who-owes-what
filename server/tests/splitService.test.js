import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  allocateProportionally,
  applyCharges,
  computeSettlements,
  splitBill,
} from '../src/services/splitService.js';

const sum = (values) => values.reduce((a, b) => a + b, 0);

describe('allocateProportionally', () => {
  it('always sums to the total', () => {
    const amounts = allocateProportionally(1000, [1, 1, 1]);
    assert.equal(sum(amounts), 1000);
    assert.deepEqual(amounts, [334, 333, 333]);
  });

  it('respects weights', () => {
    assert.deepEqual(allocateProportionally(1000, [3, 1]), [750, 250]);
  });

  it('rejects empty or zero weights', () => {
    assert.throws(() => allocateProportionally(100, []), RangeError);
    assert.throws(() => allocateProportionally(100, [0, 0]), RangeError);
  });
});

describe('applyCharges', () => {
  it('applies service charge then GST on top (Singapore style)', () => {
    // $100 + 10% service = $110, + 9% GST = $119.90
    assert.deepEqual(applyCharges(10_000, { serviceChargePct: 10, taxPct: 9 }), {
      subtotalCents: 10_000,
      discountCents: 0,
      serviceCents: 1_000,
      taxCents: 990,
      totalCents: 11_990,
    });
  });

  it('takes the discount off before charges, and never below zero', () => {
    const r = applyCharges(10_000, { discountCents: 2_000, serviceChargePct: 10, taxPct: 9 });
    assert.equal(r.serviceCents, 800);
    assert.equal(r.totalCents, 9_592); // (8000 + 800) * 1.09
    assert.equal(applyCharges(500, { discountCents: 900 }).totalCents, 0);
  });
});

describe('splitBill', () => {
  it('splits shared items between the people on them', () => {
    const r = splitBill(
      [
        { amountCents: 1_200, participantIds: ['a'] },
        { amountCents: 900, participantIds: ['a', 'b', 'c'] }, // shared plate
      ],
      { serviceChargePct: 10, taxPct: 9 }
    );
    assert.equal(r.subtotalCents, 2_100);
    assert.equal(sum(r.shares.map((s) => s.owedCents)), r.totalCents);
    const a = r.shares.find((s) => s.participantId === 'a');
    const b = r.shares.find((s) => s.participantId === 'b');
    assert.ok(a.owedCents > b.owedCents);
  });
});

describe('computeSettlements', () => {
  it('settles one payer with everyone else', () => {
    const t = computeSettlements(
      [
        { participantId: 'a', owedCents: 1_000 },
        { participantId: 'b', owedCents: 1_000 },
        { participantId: 'c', owedCents: 1_000 },
      ],
      [{ participantId: 'a', amountCents: 3_000 }]
    );
    assert.deepEqual(t, [
      { fromParticipantId: 'b', toParticipantId: 'a', amountCents: 1_000 },
      { fromParticipantId: 'c', toParticipantId: 'a', amountCents: 1_000 },
    ]);
  });

  it('nets out multiple payers with the fewest transfers', () => {
    const shares = [
      { participantId: 'a', owedCents: 1_500 },
      { participantId: 'b', owedCents: 1_500 },
      { participantId: 'c', owedCents: 1_500 },
    ];
    const payers = [
      { participantId: 'a', amountCents: 3_000 },
      { participantId: 'b', amountCents: 1_500 },
    ];
    const t = computeSettlements(shares, payers);
    assert.deepEqual(t, [{ fromParticipantId: 'c', toParticipantId: 'a', amountCents: 1_500 }]);
  });

  it('returns nothing when everyone paid their own share', () => {
    const t = computeSettlements([{ participantId: 'a', owedCents: 500 }], [{ participantId: 'a', amountCents: 500 }]);
    assert.deepEqual(t, []);
  });
});
