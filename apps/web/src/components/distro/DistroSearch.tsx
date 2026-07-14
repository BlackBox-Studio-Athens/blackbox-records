import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createExactFirstSearcher } from '@/lib/exact-first-search';

const SEARCH_HIDDEN_ATTRIBUTE = 'data-distro-search-hidden';

type DistroSearchProps = {
  pageKey: string;
};

type DistroSearchItem = {
  element: HTMLElement;
  searchText: string;
};

type DistroSearchChunk = {
  element: HTMLElement;
  items: DistroSearchItem[];
};

export type DistroSearchDom = {
  chunks: DistroSearchChunk[];
  groups: Array<{ chunks: DistroSearchChunk[]; element: HTMLElement }>;
  items: DistroSearchItem[];
};

export function readDistroSearchDom(root: ParentNode | null): DistroSearchDom | null {
  if (!root) return null;

  const items = [...root.querySelectorAll<HTMLElement>('[data-distro-search-item]')].map((element) => ({
    element,
    searchText: element.dataset.distroSearchText || '',
  }));
  const itemsByElement = new Map(items.map((item) => [item.element, item]));
  const chunks = [...root.querySelectorAll<HTMLElement>('[data-distro-search-chunk]')].map((element) => ({
    element,
    items: [...element.querySelectorAll<HTMLElement>('[data-distro-search-item]')]
      .map((itemElement) => itemsByElement.get(itemElement))
      .filter((item): item is DistroSearchItem => Boolean(item)),
  }));
  const chunksByElement = new Map(chunks.map((chunk) => [chunk.element, chunk]));
  const groups = [...root.querySelectorAll<HTMLElement>('[data-distro-search-group]')].map((element) => ({
    element,
    chunks: [...element.querySelectorAll<HTMLElement>('[data-distro-search-chunk]')]
      .map((chunkElement) => chunksByElement.get(chunkElement))
      .filter((chunk): chunk is DistroSearchChunk => Boolean(chunk)),
  }));

  return { chunks, groups, items };
}

function setSearchHidden(element: HTMLElement, shouldHide: boolean) {
  if (element.hasAttribute(SEARCH_HIDDEN_ATTRIBUTE) === shouldHide) return;
  element.toggleAttribute(SEARCH_HIDDEN_ATTRIBUTE, shouldHide);
}

function hasDistroSearchHiddenState(dom: DistroSearchDom) {
  return [...dom.items, ...dom.chunks, ...dom.groups].some(({ element }) =>
    element.hasAttribute(SEARCH_HIDDEN_ATTRIBUTE),
  );
}

function scheduleDistroSearchReset(dom: DistroSearchDom, onComplete: () => void) {
  dom.chunks.forEach((chunk) => setSearchHidden(chunk.element, true));
  dom.items.forEach((item) => setSearchHidden(item.element, false));
  dom.groups.forEach((group) => setSearchHidden(group.element, false));

  let chunkIndex = 0;
  let frameId = 0;
  const revealNextChunks = () => {
    const batchEnd = Math.min(chunkIndex + 3, dom.chunks.length);
    for (; chunkIndex < batchEnd; chunkIndex += 1) setSearchHidden(dom.chunks[chunkIndex]!.element, false);

    if (chunkIndex < dom.chunks.length) frameId = requestAnimationFrame(revealNextChunks);
    else onComplete();
  };

  frameId = requestAnimationFrame(revealNextChunks);
  return () => cancelAnimationFrame(frameId);
}

export function applyDistroSearch(dom: DistroSearchDom, matchedElements: ReadonlySet<HTMLElement> | null) {
  if (!matchedElements) {
    dom.items.forEach((item) => setSearchHidden(item.element, false));
    dom.chunks.forEach((chunk) => setSearchHidden(chunk.element, false));
    dom.groups.forEach((group) => setSearchHidden(group.element, false));
    return dom.items.filter((item) => !item.element.hidden).length;
  }

  const visibleElements = new Set(
    dom.items.filter((item) => !item.element.hidden && matchedElements.has(item.element)).map((item) => item.element),
  );

  dom.groups.forEach((group) => {
    const hasVisibleItem = group.chunks.some((chunk) => chunk.items.some((item) => visibleElements.has(item.element)));
    setSearchHidden(group.element, !hasVisibleItem);

    group.chunks.forEach((chunk) => {
      const hasVisibleChunkItem = chunk.items.some((item) => visibleElements.has(item.element));
      setSearchHidden(chunk.element, hasVisibleItem && !hasVisibleChunkItem);
      chunk.items.forEach((item) =>
        setSearchHidden(item.element, hasVisibleItem && hasVisibleChunkItem && !visibleElements.has(item.element)),
      );
    });
  });

  return visibleElements.size;
}

export function getDistroSearchResultState(visibleCount: number) {
  return {
    isEmpty: visibleCount === 0,
    visibleLabel: `${visibleCount} ${visibleCount === 1 ? 'item' : 'items'}`,
  };
}

function DistroSearch({ pageKey }: DistroSearchProps) {
  const domRef = useRef<DistroSearchDom | null>(null);
  const searcherRef = useRef<ReturnType<typeof createExactFirstSearcher<DistroSearchItem>> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const resultState = useMemo(() => getDistroSearchResultState(visibleCount), [visibleCount]);
  const hasActiveSearch = searchQuery.trim().length > 0;

  useEffect(() => {
    const dom = readDistroSearchDom(document.querySelector<HTMLElement>('[data-distro-search-root]'));
    if (!dom) return;

    domRef.current = dom;
    searcherRef.current = createExactFirstSearcher(dom.items, (item) => item.searchText);
    setTotalCount(dom.items.length);
    setVisibleCount(dom.items.filter((item) => !item.element.hidden).length);
    setIsReady(true);

    return () => {
      applyDistroSearch(dom, null);
      domRef.current = null;
      searcherRef.current = null;
    };
  }, [pageKey]);

  useEffect(() => {
    const dom = domRef.current;
    if (!dom || !isReady) return undefined;

    if (!searchQuery.trim()) {
      if (!hasDistroSearchHiddenState(dom)) {
        setVisibleCount(dom.items.filter((item) => !item.element.hidden).length);
        return undefined;
      }

      return scheduleDistroSearchReset(dom, () =>
        setVisibleCount(dom.items.filter((item) => !item.element.hidden).length),
      );
    }

    const matchedElements = new Set((searcherRef.current?.search(searchQuery) || []).map((item) => item.element));
    setVisibleCount(applyDistroSearch(dom, matchedElements));
    return undefined;
  }, [isReady, searchQuery]);

  if (!isReady) return null;

  return (
    <div className="artists-roster-filters-panel distro-search-panel space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search distro"
          className="artists-roster-filters-panel__input h-11 rounded-none border-[#2b2b2b] bg-[#111111] pr-3 pl-10 text-[0.95rem]"
          aria-controls="distro-search-results"
          aria-describedby="distro-search-result-count"
          aria-label="Search distro"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          id="distro-search-result-count"
          className="text-xs tracking-[0.18em] uppercase text-muted-foreground"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {resultState.visibleLabel}
        </p>
        {hasActiveSearch ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-none px-2 text-[11px] tracking-[0.16em] uppercase text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={() => setSearchQuery('')}
          >
            Clear search
          </Button>
        ) : (
          <p className="text-xs tracking-[0.14em] uppercase text-[#8f8f8f]">{totalCount} total</p>
        )}
      </div>

      {resultState.isEmpty ? (
        <div
          className="artists-roster-empty-state distro-search-empty-state rounded-none border border-[#2b2b2b] bg-[#141414] px-5 py-6"
          role="status"
        >
          <p className="text-sm tracking-[0.04em] text-muted-foreground">No distro items match your search.</p>
        </div>
      ) : null}
    </div>
  );
}

export default DistroSearch;
