import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createExactFirstSearcher } from '@/lib/exact-first-search';

import {
  createStoreCoverflowController,
  ensureStoreCoverflowCapability,
  readStoreCoverflowDom,
  type StoreCoverflowController,
} from './StoreCoverflowController';

const SEARCH_HIDDEN_ATTRIBUTE = 'data-distro-search-hidden';

type StoreDistroSearchProps = {
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

type DistroFormatLink = {
  element: HTMLElement;
  formatKey: string;
};

type DistroFormatGroup = {
  chunks: DistroSearchChunk[];
  element: HTMLElement;
  formatKey: string;
  target: HTMLElement;
};

export type DistroSearchDom = {
  chunks: DistroSearchChunk[];
  formatLinks: DistroFormatLink[];
  formatDisclosure: HTMLDetailsElement | null;
  formatSummaryCurrent: HTMLElement | null;
  groups: DistroFormatGroup[];
  items: DistroSearchItem[];
  navigation: HTMLElement | null;
  root: HTMLElement;
};

const ALL_DISTRO_FORMATS_KEY = 'all';

export function readDistroSearchDom(
  root: HTMLElement | null,
  navigation: HTMLElement | null = null,
): DistroSearchDom | null {
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
  const groups = [...root.querySelectorAll<HTMLElement>('[data-distro-search-group]')]
    .map((element): DistroFormatGroup | null => {
      const formatKey = element.dataset.distroFormatKey;
      const target = element.querySelector<HTMLElement>('[data-distro-format-target]');
      if (!formatKey || !target) return null;

      return {
        element,
        formatKey,
        target,
        chunks: [...element.querySelectorAll<HTMLElement>('[data-distro-search-chunk]')]
          .map((chunkElement) => chunksByElement.get(chunkElement))
          .filter((chunk): chunk is DistroSearchChunk => Boolean(chunk)),
      };
    })
    .filter((group): group is DistroFormatGroup => group !== null);
  const formatLinkElements = navigation
    ? [...navigation.querySelectorAll<HTMLElement>('[data-distro-format-link]')]
    : [];
  const formatLinks = formatLinkElements
    .map((element): DistroFormatLink | null => {
      const formatKey = element.dataset.distroFormatKey;
      return formatKey ? { element, formatKey } : null;
    })
    .filter((link): link is DistroFormatLink => link !== null);
  if (groups.length !== root.querySelectorAll('[data-distro-search-group]').length) return null;
  if (formatLinks.length !== formatLinkElements.length) return null;

  return {
    chunks,
    formatLinks,
    formatDisclosure: navigation?.querySelector<HTMLDetailsElement>('[data-distro-format-disclosure]') ?? null,
    formatSummaryCurrent: navigation?.querySelector<HTMLElement>('[data-distro-format-summary-current]') ?? null,
    groups,
    items,
    navigation,
    root,
  };
}

export function resolveInitialDistroFormatKey(hash: string, dom: Pick<DistroSearchDom, 'groups'>) {
  let requestedKey = '';
  try {
    requestedKey = decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return ALL_DISTRO_FORMATS_KEY;
  }

  return dom.groups.some((group) => group.formatKey === requestedKey) ? requestedKey : ALL_DISTRO_FORMATS_KEY;
}

export function applyDistroFormatSelection(
  dom: DistroSearchDom,
  requestedKey: string,
  coverflowController: Pick<StoreCoverflowController, 'setFocusedGroup'> | null = null,
) {
  const selectedGroup = dom.groups.find((group) => group.formatKey === requestedKey) ?? null;
  const formatKey = selectedGroup?.formatKey ?? ALL_DISTRO_FORMATS_KEY;

  if (selectedGroup) dom.root.setAttribute('data-distro-selected-format', formatKey);
  else dom.root.removeAttribute('data-distro-selected-format');

  dom.groups.forEach((group) => {
    const isCurrent = group === selectedGroup;
    group.element.toggleAttribute('data-distro-format-current', isCurrent);
    if (isCurrent) group.element.setAttribute('aria-current', 'true');
    else group.element.removeAttribute('aria-current');
  });
  dom.formatLinks.forEach((link) => {
    const isCurrent = link.formatKey === formatKey;
    link.element.toggleAttribute('data-distro-format-current', isCurrent);
    if (isCurrent) link.element.setAttribute('aria-current', 'true');
    else link.element.removeAttribute('aria-current');
  });
  if (dom.formatSummaryCurrent) {
    dom.formatSummaryCurrent.textContent = selectedGroup?.target.textContent?.trim() || 'All formats';
  }
  closeDistroFormatDisclosure(dom);
  coverflowController?.setFocusedGroup(selectedGroup?.element ?? null);

  return {
    formatKey,
    target: selectedGroup?.target ?? dom.root,
  };
}

export function selectDistroFormat(
  dom: DistroSearchDom,
  requestedKey: string,
  coverflowController: Pick<StoreCoverflowController, 'setFocusedGroup'> | null = null,
  focusTarget = false,
) {
  const selection = applyDistroFormatSelection(dom, requestedKey, coverflowController);
  if (!focusTarget) return { ...selection, cancelFocus: () => undefined };

  const frameId = requestAnimationFrame(() => {
    selection.target.focus({ preventScroll: true });
    selection.target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  return { ...selection, cancelFocus: () => cancelAnimationFrame(frameId) };
}

export function closeDistroFormatDisclosure(dom: Pick<DistroSearchDom, 'formatDisclosure'>) {
  if (dom.formatDisclosure) dom.formatDisclosure.open = false;
}

function setSearchHidden(element: HTMLElement, shouldHide: boolean) {
  if (element.hasAttribute(SEARCH_HIDDEN_ATTRIBUTE) === shouldHide) return;
  element.toggleAttribute(SEARCH_HIDDEN_ATTRIBUTE, shouldHide);
}

function hasDistroSearchHiddenState(dom: DistroSearchDom) {
  return (
    dom.navigation?.hidden ||
    [...dom.items, ...dom.chunks, ...dom.groups].some(({ element }) => element.hasAttribute(SEARCH_HIDDEN_ATTRIBUTE))
  );
}

function scheduleDistroSearchReset(dom: DistroSearchDom, onComplete: () => void) {
  if (dom.navigation) dom.navigation.hidden = false;
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
  if (dom.navigation) dom.navigation.hidden = matchedElements !== null;

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

function StoreDistroSearch({ pageKey }: StoreDistroSearchProps) {
  const coverflowControllerRef = useRef<StoreCoverflowController | null>(null);
  const domRef = useRef<DistroSearchDom | null>(null);
  const formatFocusCleanupRef = useRef<(() => void) | null>(null);
  const searcherRef = useRef<ReturnType<typeof createExactFirstSearcher<DistroSearchItem>> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(0);
  const resultState = useMemo(() => getDistroSearchResultState(visibleCount), [visibleCount]);
  const hasActiveSearch = searchQuery.trim().length > 0;

  useEffect(() => {
    const dom = readDistroSearchDom(
      document.querySelector<HTMLElement>('[data-distro-search-root]'),
      document.querySelector<HTMLElement>('[data-distro-format-navigation]'),
    );
    if (!dom) return;

    domRef.current = dom;
    ensureStoreCoverflowCapability();
    const coverflowDom = readStoreCoverflowDom(dom.root);
    if (!coverflowDom) document.documentElement.removeAttribute('data-store-coverflow-capable');
    coverflowControllerRef.current = coverflowDom ? createStoreCoverflowController(coverflowDom) : null;
    searcherRef.current = createExactFirstSearcher(dom.items, (item) => item.searchText);
    const onNavigationClick = (event: Event) => {
      const formatLink =
        event.target instanceof Element ? event.target.closest<HTMLElement>('[data-distro-format-link]') : null;
      const formatKey = formatLink?.dataset.distroFormatKey;
      if (!formatKey) return;

      formatFocusCleanupRef.current?.();
      formatFocusCleanupRef.current = selectDistroFormat(
        dom,
        formatKey,
        coverflowControllerRef.current,
        true,
      ).cancelFocus;
    };
    dom.navigation?.addEventListener('click', onNavigationClick);
    const initialFormatKey = resolveInitialDistroFormatKey(window.location.hash, dom);
    formatFocusCleanupRef.current = selectDistroFormat(
      dom,
      initialFormatKey,
      coverflowControllerRef.current,
      initialFormatKey !== ALL_DISTRO_FORMATS_KEY,
    ).cancelFocus;
    setVisibleCount(dom.items.filter((item) => !item.element.hidden).length);
    setIsReady(true);

    return () => {
      dom.navigation?.removeEventListener('click', onNavigationClick);
      formatFocusCleanupRef.current?.();
      formatFocusCleanupRef.current = null;
      applyDistroFormatSelection(dom, ALL_DISTRO_FORMATS_KEY, coverflowControllerRef.current);
      coverflowControllerRef.current?.cleanup();
      applyDistroSearch(dom, null);
      coverflowControllerRef.current = null;
      domRef.current = null;
      searcherRef.current = null;
    };
  }, [pageKey]);

  useEffect(() => {
    const dom = domRef.current;
    if (!dom || !isReady) return undefined;
    const hasQuery = searchQuery.trim().length > 0;
    if (hasQuery) {
      formatFocusCleanupRef.current?.();
      formatFocusCleanupRef.current = null;
      applyDistroFormatSelection(dom, ALL_DISTRO_FORMATS_KEY, coverflowControllerRef.current);
    }
    coverflowControllerRef.current?.setSearchActive(hasQuery);

    if (!hasQuery) {
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
    <div className="artists-roster-filters-panel distro-search-panel space-y-3">
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
          aria-describedby={hasActiveSearch ? 'distro-search-result-count' : undefined}
          aria-label="Search distro"
        />
      </div>

      {hasActiveSearch ? (
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-none px-2 text-[11px] tracking-[0.16em] uppercase text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={() => setSearchQuery('')}
          >
            Clear search
          </Button>
        </div>
      ) : null}

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

export default StoreDistroSearch;
