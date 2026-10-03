import type Fuse from 'fuse.js';

type SearchTextReader<T> = (item: T) => string;

type FuseConstructor = typeof Fuse;

export type ExactFirstSearcherOptions = {
  /**
   * Called once when a query needed the fuzzy fallback before Fuse had loaded. The search that
   * asked for it returned exact-only matches; searching again now includes the fuzzy matches.
   */
  onFuzzyReady?: () => void;
};

let fuseConstructor: FuseConstructor | null = null;
let fuseLoad: Promise<FuseConstructor> | null = null;

/**
 * Fuse is only needed when a typed term has no exact match, so it loads on the first non-empty
 * query instead of with the search island. Awaiting this makes every later search synchronous.
 */
export function loadExactFirstFuzzySearch(): Promise<FuseConstructor> {
  fuseLoad ??= import('fuse.js').then(
    (module) => (fuseConstructor = module.default),
    (error: unknown) => {
      fuseLoad = null;
      throw error;
    },
  );
  return fuseLoad;
}

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

export function createExactFirstSearcher<T>(
  items: T[],
  readSearchText: SearchTextReader<T>,
  { onFuzzyReady }: ExactFirstSearcherOptions = {},
) {
  let fuse: Fuse<{ item: T; searchText: string }> | null = null;
  let notifyWhenReady = false;

  const getFuse = () => {
    if (fuse || !fuseConstructor) return fuse;
    fuse = new fuseConstructor(
      items.map((item) => ({ item, searchText: normalizeSearchQuery(readSearchText(item)) })),
      {
        includeScore: true,
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 2,
        keys: [{ name: 'searchText', weight: 1 }],
      },
    );
    return fuse;
  };

  const requestFuzzy = () => {
    if (notifyWhenReady) return;
    notifyWhenReady = true;
    void loadExactFirstFuzzySearch().then(
      () => {
        notifyWhenReady = false;
        onFuzzyReady?.();
      },
      () => {
        notifyWhenReady = false;
      },
    );
  };

  return {
    search(query: string) {
      const normalizedQuery = normalizeSearchQuery(query);
      if (!normalizedQuery) return items;
      // Start the download while the shopper is still typing, before any term can need it.
      if (!fuseConstructor) void loadExactFirstFuzzySearch().catch(() => undefined);

      const exactMatches = getExactFirstMatches(items, normalizedQuery, readSearchText);
      if (exactMatches.length > 0) return exactMatches;

      const matchesByTerm = normalizedQuery.split(' ').map((term) => {
        const exact = getExactFirstMatches(items, term, readSearchText);
        if (exact.length > 0 || term.length < 4) return new Set(exact);
        const fuzzy = getFuse();
        if (!fuzzy) {
          requestFuzzy();
          return new Set(exact);
        }
        return new Set(fuzzy.search(term).map((match) => match.item.item));
      });
      return items.filter((item) => matchesByTerm.every((matches) => matches.has(item)));
    },
  };
}
