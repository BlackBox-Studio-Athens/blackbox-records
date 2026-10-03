import { beforeAll, describe, expect, it, vi } from 'vitest';

import { createExactFirstSearcher, loadExactFirstFuzzySearch } from './exact-first-search';

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

describe('exact-first search before the fuzzy matcher loads', () => {
  // Runs first: the module-level Fuse import has not been requested yet in this test file.
  it('answers exact queries synchronously and reports when a typo can be retried', async () => {
    const items = ['Anarchotribal Ouranopithecus Vinyl LP', 'Barren Point Tape'];
    const onFuzzyReady = vi.fn();
    const searcher = createExactFirstSearcher(items, (item) => item, { onFuzzyReady });

    expect(searcher.search('barren')).toEqual([items[1]]);
    expect(searcher.search('pethicus')).toEqual([]);
    expect(searcher.search('pethicus vinyl')).toEqual([]);
    expect(onFuzzyReady).not.toHaveBeenCalled();

    await loadExactFirstFuzzySearch();
    await Promise.resolve();
    expect(onFuzzyReady).toHaveBeenCalledOnce();
    expect(searcher.search('pethicus')).toEqual([items[0]]);
  });
});

describe('exact-first search', () => {
  beforeAll(async () => {
    await loadExactFirstFuzzySearch();
  });

  it.each(['pethicus', 'pithecus', 'vinyl pethicus', 'ANARCHOTRIBAL   vinyl', 'ouranopithecus anarchotribal'])(
    'finds partial names, typos, and reordered terms for %s',
    (query) => {
      const items = ['Anarchotribal Ouranopithecus Vinyl LP', 'Barren Point Tape'];
      expect(createExactFirstSearcher(items, (item) => item).search(query)).toEqual([items[0]]);
    },
  );

  it('ignores accents and punctuation while requiring every query term', () => {
    const items = ['Μαύρο Café Vinyl 12-inch', 'Other Tape'];
    const searcher = createExactFirstSearcher(items, (item) => item);
    expect(searcher.search('μαυρο cafe 12 inch')).toEqual([items[0]]);
    expect(searcher.search('cafe tape')).toEqual([]);
    expect(searcher.search('zz')).toEqual([]);
  });

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
