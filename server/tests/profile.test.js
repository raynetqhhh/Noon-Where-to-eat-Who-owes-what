import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sniffImageType } from '../src/utils/imageType.js';
import { updateProfileSchema } from '../src/validators/userSchemas.js';

const pad = (bytes) => Buffer.concat([Buffer.from(bytes), Buffer.alloc(16)]);

describe('sniffImageType', () => {
  it('recognises JPEG, PNG and WebP from their bytes', () => {
    assert.equal(sniffImageType(pad([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg');
    assert.equal(sniffImageType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'image/png');
    assert.equal(sniffImageType(Buffer.concat([Buffer.from('RIFF\0\0\0\0WEBP'), Buffer.alloc(8)])), 'image/webp');
  });

  it('rejects anything else, whatever it claims to be', () => {
    assert.equal(sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
    assert.equal(sniffImageType(pad([0x47, 0x49, 0x46, 0x38])), null); // GIF
    assert.equal(sniffImageType(Buffer.alloc(4)), null);
    assert.equal(sniffImageType('not a buffer'), null);
  });
});

describe('updateProfileSchema (taste fields)', () => {
  it('accepts cuisines, dishes and spice level', () => {
    const parsed = updateProfileSchema.parse({
      favouriteCuisines: ['japanese', 'malay', 'japanese'],
      favouriteFoods: [' Laksa ', 'laksa', '', 'Chicken rice'],
      spiceLevel: 2,
      tagline: '  Will queue 40 minutes for good laksa  ',
    });
    assert.deepEqual(parsed.favouriteCuisines, ['japanese', 'malay']);
    assert.deepEqual(parsed.favouriteFoods, ['Laksa', 'Chicken rice']);
    assert.equal(parsed.spiceLevel, 2);
    assert.equal(parsed.tagline, 'Will queue 40 minutes for good laksa');
  });

  it('turns an empty tagline into null and allows clearing spice level', () => {
    const parsed = updateProfileSchema.parse({ tagline: '   ', spiceLevel: null });
    assert.equal(parsed.tagline, null);
    assert.equal(parsed.spiceLevel, null);
  });

  it('rejects unknown cuisines, too many dishes and bad spice levels', () => {
    assert.equal(updateProfileSchema.safeParse({ favouriteCuisines: ['martian'] }).success, false);
    assert.equal(updateProfileSchema.safeParse({ favouriteFoods: Array.from({ length: 13 }, (_, i) => `Dish ${i}`) }).success, false);
    assert.equal(updateProfileSchema.safeParse({ favouriteFoods: ['x'.repeat(31)] }).success, false);
    assert.equal(updateProfileSchema.safeParse({ spiceLevel: 4 }).success, false);
    assert.equal(updateProfileSchema.safeParse({ spiceLevel: 1.5 }).success, false);
  });

  it('rejects fields the client should not set directly', () => {
    assert.equal(updateProfileSchema.safeParse({ avatarUrl: 'https://evil.example/x.png' }).success, false);
  });
});
