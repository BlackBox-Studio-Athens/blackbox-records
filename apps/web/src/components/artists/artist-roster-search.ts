import { createExactFirstSearcher, getExactFirstMatches } from '@/lib/exact-first-search';

type ArtistRosterSearchable = {
  title: string;
};

export function getArtistRosterExactMatches<T extends ArtistRosterSearchable>(items: T[], query: string) {
  return getExactFirstMatches(items, query, (item) => item.title);
}

export function createArtistRosterSearcher<T extends ArtistRosterSearchable>(items: T[]) {
  return createExactFirstSearcher(items, (item) => item.title);
}
