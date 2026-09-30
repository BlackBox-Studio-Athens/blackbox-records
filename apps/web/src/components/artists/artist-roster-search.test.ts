import { describe, expect, it } from 'vitest';

import {
  createArtistRosterSearcher,
  filterArtistRoster,
  getArtistRosterExactMatches,
  listArtistRosterGenres,
  sortArtistRoster,
} from './artist-roster-search';

const rosterItems = [{ title: 'Chronoboros' }, { title: 'Mass Culture' }, { title: 'Ouranopithecus' }];

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

    expect(searcher.search('').map((item) => item.title)).toEqual(['Chronoboros', 'Mass Culture', 'Ouranopithecus']);
  });
});

describe('artist roster genre filter and sort', () => {
  const artists = [
    { title: 'Afterwise', genre: 'Post Rock', sortName: 'Afterwise', latestReleaseSort: '2026-06-01' },
    { title: 'Chronoboros', genre: 'Hardcore', sortName: 'Chronoboros', latestReleaseSort: '2026-03-01' },
    { title: 'Mass Culture', genre: 'Hardcore', sortName: 'Mass Culture', latestReleaseSort: '2026-06-01' },
    { title: 'Ouranopithecus', genre: 'Weird Rock', sortName: 'Ouranopithecus', latestReleaseSort: '2026-06-01' },
    { title: 'Sidus', genre: 'Post Rock', sortName: 'Sidus', latestReleaseSort: '9999-12-31' },
    { title: 'Unlabelled', genre: '', sortName: 'Unlabelled', latestReleaseSort: '' },
  ];
  const titles = (items: { title: string }[]) => items.map((item) => item.title);

  it('lists genres by count, then name, skipping artists without one', () => {
    expect(listArtistRosterGenres(artists)).toEqual([
      { genre: 'Hardcore', count: 2 },
      { genre: 'Post Rock', count: 2 },
      { genre: 'Weird Rock', count: 1 },
    ]);
  });

  it('filters by genre and combines it with search text', () => {
    expect(titles(filterArtistRoster(artists, { genre: 'Post Rock', query: '' }))).toEqual(['Afterwise', 'Sidus']);
    expect(titles(filterArtistRoster(artists, { genre: 'Post Rock', query: 'sid' }))).toEqual(['Sidus']);
    expect(titles(filterArtistRoster(artists, { genre: '', query: '' }))).toHaveLength(6);
  });

  it('returns nothing when search and genre disagree, and everything again once both are cleared', () => {
    expect(filterArtistRoster(artists, { genre: 'Hardcore', query: 'sidus' })).toEqual([]);
    expect(titles(filterArtistRoster(artists, { genre: '', query: '' }))).toEqual(titles(artists));
  });

  it('sorts latest release newest first with upcoming first, ties and undated by name', () => {
    expect(titles(sortArtistRoster(artists, 'latest'))).toEqual([
      'Sidus',
      'Afterwise',
      'Mass Culture',
      'Ouranopithecus',
      'Chronoboros',
      'Unlabelled',
    ]);
    expect(titles(sortArtistRoster([...artists].reverse(), 'az'))).toEqual(titles(artists));
  });
});
