import { describe, expect, it } from 'vitest';

import { createExactFirstSearcher } from './exact-first-search';

const distroItems = [
  {
    artistOrLabel: 'Chronoboros',
    format: 'Vinyl 12in',
    group: 'Vinyl 12-inch',
    title: 'Caregivers',
  },
  {
    artistOrLabel: 'BlackBox Records',
    format: 'Tape',
    group: 'Tapes',
    title: 'Barren Point',
  },
];
const readDistroSearchText = (item: (typeof distroItems)[number]) =>
  [item.title, item.artistOrLabel, item.group, item.format].join(' ');

describe('exact-first search', () => {
  it.each([
    ['care', 'Caregivers'],
    ['chronoboros', 'Caregivers'],
    ['tapes', 'Barren Point'],
    ['vinyl 12in', 'Caregivers'],
  ])('matches Distro title, artist or label, exact group, and format text for %s', (query, title) => {
    const searcher = createExactFirstSearcher(distroItems, readDistroSearchText);

    expect(searcher.search(query).map((item) => item.title)).toEqual([title]);
  });

  it('returns exact matches without adding fuzzy results', () => {
    const items = [{ title: 'Mass Culture' }, { title: 'Moss Culter' }];
    const searcher = createExactFirstSearcher(items, (item) => item.title);

    expect(searcher.search('mass')).toEqual([{ title: 'Mass Culture' }]);
  });

  it('returns every item for an empty query', () => {
    const searcher = createExactFirstSearcher(distroItems, readDistroSearchText);

    expect(searcher.search('   ')).toEqual(distroItems);
  });
});
