import { describe, expect, it } from 'vitest';

import { createArtistRosterSearcher, getArtistRosterExactMatches } from './artist-roster-search';

const rosterItems = [
  { title: 'Chronoboros' },
  { title: 'Mass Culture' },
  { title: 'Ouranopithecus' },
];

describe('artist roster search', () => {
  it('returns only exact substring title matches before fuzzy fallback', () => {
    const matches = getArtistRosterExactMatches(rosterItems, 'ch');

    expect(matches.map((item) => item.title)).toEqual(['Chronoboros']);
  });

  it('searches against artist title only', () => {
    const searcher = createArtistRosterSearcher(rosterItems);

    expect(searcher.search('ch').map((item) => item.title)).toEqual(['Chronoboros']);
    expect(searcher.search('mass').map((item) => item.title)).toEqual(['Mass Culture']);
  });

  it('falls back to fuzzy title matching for minor typos', () => {
    const searcher = createArtistRosterSearcher(rosterItems);

    expect(searcher.search('chronboros').map((item) => item.title)).toEqual(['Chronoboros']);
  });

  it('returns all items for an empty query', () => {
    const searcher = createArtistRosterSearcher(rosterItems);

    expect(searcher.search('').map((item) => item.title)).toEqual([
      'Chronoboros',
      'Mass Culture',
      'Ouranopithecus',
    ]);
  });
});
