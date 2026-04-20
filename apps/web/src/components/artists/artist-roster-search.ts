import Fuse from 'fuse.js';

type ArtistRosterSearchable = {
  title: string;
};

function normalizeArtistRosterQuery(query: string) {
  return query.trim().toLowerCase();
}

export function getArtistRosterExactMatches<T extends ArtistRosterSearchable>(items: T[], query: string) {
  const normalizedQuery = normalizeArtistRosterQuery(query);
  if (!normalizedQuery) return items;

  return items.filter((item) => item.title.toLowerCase().includes(normalizedQuery));
}

export function createArtistRosterSearcher<T extends ArtistRosterSearchable>(items: T[]) {
  const fuse = new Fuse(items, {
    includeScore: true,
    threshold: 0.24,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [{ name: 'title', weight: 1 }],
  });

  return {
    search(query: string) {
      const normalizedQuery = normalizeArtistRosterQuery(query);
      if (!normalizedQuery) return items;

      const exactMatches = getArtistRosterExactMatches(items, normalizedQuery);
      if (exactMatches.length > 0) {
        return exactMatches;
      }

      return fuse.search(normalizedQuery).map((match) => match.item);
    },
  };
}
