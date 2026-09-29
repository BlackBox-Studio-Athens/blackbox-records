import { describe, expect, it } from 'vitest';

import {
  assertNoSlugCollisions,
  createSlugSuggestion,
  findSlugCollisions,
  resolveExplicitOrSuggestedSlug,
  validateSlug,
} from './slugs';

describe('slug tooling', () => {
  it('creates lowercase kebab-case slug suggestions from editorial labels', () => {
    expect(createSlugSuggestion('Čhrönoboros / BLACK Vinyl LP')).toBe('chroenoboros-black-vinyl-lp');
    expect(createSlugSuggestion('  Mass Culture: Live @ Athens!  ')).toBe('mass-culture-live-athens');
    expect(createSlugSuggestion('The   Chemical   Bath')).toBe('the-chemical-bath');
  });

  it('validates committed slug data without regenerating it', () => {
    expect(validateSlug('disintegration-black-vinyl-lp')).toEqual({
      slug: 'disintegration-black-vinyl-lp',
      valid: true,
    });
    expect(validateSlug('Barren Point')).toEqual({
      reason: 'format',
      slug: 'Barren Point',
      valid: false,
    });
    expect(validateSlug('   ')).toEqual({
      reason: 'blank',
      slug: '',
      valid: false,
    });
  });

  it('uses valid explicit slugs before draft suggestions', () => {
    expect(resolveExplicitOrSuggestedSlug('caregivers-vinyl', 'Caregivers')).toBe('caregivers-vinyl');
    expect(resolveExplicitOrSuggestedSlug('___', 'The Chemical Bath')).toBe('the-chemical-bath');
  });

  it('reports slug collisions without suffixing public slugs', () => {
    expect(
      findSlugCollisions([
        { owner: 'release:disintegration', slug: 'disintegration-black-vinyl-lp' },
        { owner: 'distro:barren-point', slug: 'barren-point' },
        { owner: 'release:caregivers', slug: 'caregivers-vinyl' },
        { owner: 'distro:caregivers-vinyl', slug: 'caregivers-vinyl' },
      ]),
    ).toEqual([
      {
        owners: ['release:caregivers', 'distro:caregivers-vinyl'],
        slug: 'caregivers-vinyl',
      },
    ]);

    expect(
      findSlugCollisions([
        { owner: 'release:disintegration', slug: 'disintegration-black-vinyl-lp' },
        { owner: 'distro:barren-point', slug: 'barren-point' },
      ]),
    ).toEqual([]);

    expect(() =>
      assertNoSlugCollisions([
        { owner: 'release:caregivers', slug: 'caregivers-vinyl' },
        { owner: 'distro:caregivers-vinyl', slug: 'caregivers-vinyl' },
      ]),
    ).toThrow('Slug collision detected: caregivers-vinyl');
  });
});
