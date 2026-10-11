import { createExactFirstSearcher, type ExactFirstSearcherOptions } from '@/lib/exact-first-search';

type ArtistRosterSearchable = {
  title: string;
};

export function createArtistRosterSearcher<T extends ArtistRosterSearchable>(
  items: T[],
  options?: ExactFirstSearcherOptions,
) {
  return createExactFirstSearcher(items, (item) => item.title, options);
}
