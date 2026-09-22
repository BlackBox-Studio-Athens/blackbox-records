import { expect, it } from 'vitest';
import {
  tracklistSchema,
  tracklistGroups,
  tracklistFormat,
  validateCmsDraft,
  type Tracklist,
} from '@blackbox/content-model';

it('validates embedded format-specific values and renders only the matching populated edition', () => {
  const vinyl: Tracklist = {
    format: 'vinyl',
    sides: [
      { label: 'A', tracks: [{ title: 'First', duration: '3:42' }] },
      { label: 'B', tracks: [{ title: 'Δεύτερο τραγούδι' }] },
    ],
  };
  expect(tracklistSchema.parse(vinyl)).toEqual(vinyl);
  expect(tracklistGroups(vinyl, 'Black vinyl LP')).toEqual([
    { heading: 'Side A', tracks: [{ position: 'A1', title: 'First', duration: '3:42' }] },
    { heading: 'Side B', tracks: [{ position: 'B1', title: 'Δεύτερο τραγούδι' }] },
  ]);
  expect(tracklistGroups(vinyl, 'CD')).toEqual([]);
  expect(tracklistGroups(vinyl, 'Clothes')).toEqual([]);
  expect(tracklistGroups(null, 'LP')).toEqual([]);
  expect(tracklistGroups({ format: 'vinyl', sides: [{ label: 'A', tracks: [] }] }, 'LP')).toEqual([]);
  expect(tracklistFormat('Tapes')).toBe('cassette');
  expect(tracklistFormat('CDs')).toBe('cd');
  expect(tracklistFormat('Vinyl 7-inch')).toBe('vinyl');
  for (const invalid of [
    'A1. Free text',
    { ...vinyl, sides: [vinyl.sides[0], vinyl.sides[0]] },
    { format: 'cd', sides: vinyl.sides },
    { format: 'vinyl', sides: [{ label: 'AA', tracks: [] }] },
    { format: 'cd', discs: [{ tracks: [{ title: ' ' }] }] },
    { format: 'cd', discs: [{ tracks: [{ title: 'Track', duration: '3:99' }] }] },
    { format: 'cd', discs: [{ tracks: [{ title: 'Track', providerId: 'secret' }] }] },
  ])
    expect(tracklistSchema.safeParse(invalid).success).toBe(false);
  expect(validateCmsDraft('releases', { tracklist: { format: 'cd', discs: [{ tracks: [{ title: '' }] }] } })).toEqual(
    [],
  );
});

it('distinguishes disc numbering from cassette sides without inventing durations', () => {
  const cd: Tracklist = { format: 'cd', discs: [{ tracks: [{ title: 'One' }] }, { tracks: [{ title: 'Two' }] }] };
  expect(tracklistGroups(cd, 'CD').map((group) => [group.heading, group.tracks[0]!.position])).toEqual([
    ['Disc 1', '1-1'],
    ['Disc 2', '2-1'],
  ]);
  expect(tracklistGroups({ format: 'cd', discs: [cd.discs[0]!] }, 'CD')[0]!.tracks[0]).toEqual({
    title: 'One',
    position: '1',
  });
  expect(
    tracklistGroups({ format: 'cassette', sides: [{ label: 'B', tracks: [{ title: 'B-side' }] }] }, 'Cassette')[0]!
      .tracks[0]!.position,
  ).toBe('B1');
});
