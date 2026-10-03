import {
  createExactFirstSearcher,
  getExactFirstMatches,
  type ExactFirstSearcherOptions,
} from '@/lib/exact-first-search';

type ArtistRosterSearchable = {
  title: string;
};

export function getArtistRosterExactMatches<T extends ArtistRosterSearchable>(items: T[], query: string) {
  return getExactFirstMatches(items, query, (item) => item.title);
}

export function createArtistRosterSearcher<T extends ArtistRosterSearchable>(
  items: T[],
  options?: ExactFirstSearcherOptions,
) {
  return createExactFirstSearcher(items, (item) => item.title, options);
}
