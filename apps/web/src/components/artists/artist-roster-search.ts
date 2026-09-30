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

export type ArtistRosterSort = 'az' | 'latest';

type ArtistRosterFilterable = ArtistRosterSearchable & {
  genre: string;
  /** ISO date; the catalog uses 9999-12-31 for upcoming or undated latest releases. */
  latestReleaseSort: string;
  sortName: string;
};

/** Genres with per-genre counts, most common first, then by name. Artists without a genre only count in "All". */
export function listArtistRosterGenres(items: { genre: string }[]) {
  const counts = new Map<string, number>();
  for (const { genre } of items) {
    if (genre) counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  return [...counts]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre));
}

/** Search text and genre combine; the input order is kept. An empty genre means "All". */
export function filterArtistRoster<T extends ArtistRosterFilterable>(
  items: T[],
  { genre, query }: { genre: string; query: string },
  searcher: { search: (query: string) => T[] } = createArtistRosterSearcher(items),
) {
  const matched = query.trim() ? new Set(searcher.search(query)) : null;
  return items.filter((item) => (!matched || matched.has(item)) && (!genre || item.genre === genre));
}

/** Newest latest release first (upcoming or undated first), ties by name. */
export function sortArtistRoster<T extends ArtistRosterFilterable>(items: T[], sort: ArtistRosterSort) {
  const byName = (a: T, b: T) => a.sortName.localeCompare(b.sortName);
  return [...items].sort(
    sort === 'latest'
      ? (a, b) =>
          (a.latestReleaseSort === b.latestReleaseSort ? 0 : a.latestReleaseSort < b.latestReleaseSort ? 1 : -1) ||
          byName(a, b)
      : byName,
  );
}
