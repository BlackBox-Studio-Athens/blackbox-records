import Fuse from 'fuse.js';

type SearchTextReader<T> = (item: T) => string;

function normalizeSearchQuery(query: string) {
  return query
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function getExactFirstMatches<T>(items: T[], query: string, readSearchText: SearchTextReader<T>) {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return items;

  const terms = normalizedQuery.split(' ');
  return items.filter((item) => {
    const text = normalizeSearchQuery(readSearchText(item));
    return terms.every((term) => text.includes(term));
  });
}

export function createExactFirstSearcher<T>(items: T[], readSearchText: SearchTextReader<T>) {
  const fuse = new Fuse(
    items.map((item) => ({ item, searchText: normalizeSearchQuery(readSearchText(item)) })),
    {
      includeScore: true,
      threshold: 0.3,
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

      const matchesByTerm = normalizedQuery.split(' ').map((term) => {
        const exact = getExactFirstMatches(items, term, readSearchText);
        return new Set(exact.length > 0 || term.length < 4 ? exact : fuse.search(term).map((match) => match.item.item));
      });
      return items.filter((item) => matchesByTerm.every((matches) => matches.has(item)));
    },
  };
}
