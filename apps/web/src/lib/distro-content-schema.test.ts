import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';

import { createDistroContentSchema } from './distro-content-schema';

const schema = createDistroContentSchema(() => z.string().min(1));
const baseEntry = {
  artist_or_label: 'Fixture Artist',
  group: 'CDs' as const,
  image: './fixture-cd-front.jpg',
  image_alt: 'Fixture CD front cover and case',
  order: 1,
  summary: 'Fixture summary.',
  title: 'Fixture Album',
};

describe('Distro content gallery schema', () => {
  it('accepts omitted, one-image, and source-ordered multi-image galleries', () => {
    expect(schema.parse(baseEntry).gallery).toBeUndefined();
    expect(
      schema.parse({
        ...baseEntry,
        gallery: [{ image: './fixture-cd-back.jpg', image_alt: 'Fixture CD back cover and track list' }],
      }).gallery,
    ).toEqual([{ image: './fixture-cd-back.jpg', image_alt: 'Fixture CD back cover and track list' }]);

    const gallery = [
      { image: './fixture-cd-back.jpg', image_alt: 'Fixture CD back cover and track list' },
      { image: './fixture-cd-open.jpg', image_alt: 'Fixture CD open with disc and booklet' },
    ];
    expect(schema.parse({ ...baseEntry, gallery }).gallery).toEqual(gallery);
  });

  it('rejects missing or blank gallery alt text', () => {
    expect(schema.safeParse({ ...baseEntry, gallery: [{ image: './fixture-cd-back.jpg' }] }).success).toBe(false);
    expect(
      schema.safeParse({
        ...baseEntry,
        gallery: [{ image: './fixture-cd-back.jpg', image_alt: '   ' }],
      }).success,
    ).toBe(false);
  });
});
