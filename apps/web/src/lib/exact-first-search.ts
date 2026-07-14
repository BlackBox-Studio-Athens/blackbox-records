import Fuse from 'fuse.js';

type SearchTextReader<T> = (item: T) => string;

function normalizeSearchQuery(query: string) {
  return query.trim().toLowerCase();
}

export function getExactFirstMatches<T>(items: T[], query: string, readSearchText: SearchTextReader<T>) {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return items;

  return items.filter((item) => readSearchText(item).toLowerCase().includes(normalizedQuery));
}

export function createExactFirstSearcher<T>(items: T[], readSearchText: SearchTextReader<T>) {
  const fuse = new Fuse(
    items.map((item) => ({ item, searchText: readSearchText(item) })),
    {
      includeScore: true,
      threshold: 0.24,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: [{ name: 'searchText', weight: 1 }],
    },
  );

  return {
    search(query: string) {
      const normalizedQuery = normalizeSearchQuery(query);
      if (!normalizedQuery) return items;

      const exactMatches = getExactFirstMatches(items, normalizedQuery, readSearchText);
      if (exactMatches.length > 0) return exactMatches;

      return fuse.search(normalizedQuery).map((match) => match.item.item);
    },
  };
}
