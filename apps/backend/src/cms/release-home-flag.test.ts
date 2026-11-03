import { expect, it } from 'vitest';
import { z } from 'zod';
import { createReleasesContentSchema, validateCmsRevisionContent } from '@blackbox/content-model';

it('accepts the optional Show on Home boolean without adding a value to older releases', () => {
  const schema = createReleasesContentSchema(() => z.object({ id: z.string() }), { artist: z.string() });
  const release = {
    catalog_number: 'BBR#001',
    title: 'Afterwise',
    artist: 'artist',
    release_stage: 'released',
    release_date: '2026-09-01',
    cover_image: { id: 'cover' },
    cover_image_alt: 'Cover',
  };
  expect(schema.parse(release)).not.toHaveProperty('show_on_home');
  for (const show_on_home of [false, true]) {
    expect(schema.parse({ ...release, show_on_home }).show_on_home).toBe(show_on_home);
    expect(validateCmsRevisionContent('releases', { ...release, show_on_home })).toEqual([]);
  }
  for (const show_on_home of [0, 1, null]) {
    expect(validateCmsRevisionContent('releases', { ...release, show_on_home })).toEqual([]);
  }
  for (const show_on_home of ['true', 2]) {
    expect(schema.safeParse({ ...release, show_on_home }).success).toBe(false);
    expect(validateCmsRevisionContent('releases', { ...release, show_on_home }).length).toBeGreaterThan(0);
  }
});
