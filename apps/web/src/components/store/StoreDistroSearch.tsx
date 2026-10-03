import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createExactFirstSearcher } from '@/lib/exact-first-search';
import { scrollElementWithLenis } from '@/platform/lib/lenis-scroll';

import {
  createStoreCoverflowController,
  ensureStoreCoverflowCapability,
  readStoreCoverflowDom,
  type StoreCoverflowController,
} from './StoreCoverflowController';

const SEARCH_HIDDEN_ATTRIBUTE = 'data-distro-search-hidden';

type StoreDistroSearchProps = {
  pageKey: string;
  scope?: 'all' | 'distro';
};

type DistroSearchItem = {
  element: HTMLElement;
  searchText: string;
  artist: string;
  formatKey: string;
};

type DistroFormatLink = {
  element: HTMLElement;
  formatKey: string;
};

export type DistroSearchDom = {
  formatLinks: DistroFormatLink[];
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
    artist: element.dataset.storeArtist || '',
    formatKey: element.dataset.distroFormatKey || '',
  }));
  const formatLinkElements = navigation
    ? [...navigation.querySelectorAll<HTMLElement>('[data-distro-format-link]')]
    : [];
  const formatLinks = formatLinkElements
    .map((element): DistroFormatLink | null => {
      const formatKey = element.dataset.distroFormatKey;
      return formatKey ? { element, formatKey } : null;
    })
    .filter((link): link is DistroFormatLink => link !== null);
  if (formatLinks.length !== formatLinkElements.length) return null;

  return {
    formatLinks,
    items,
    navigation,
    root,
  };
}

export function resolveInitialDistroFormatKey(hash: string, dom: Pick<DistroSearchDom, 'formatLinks'>) {
  let requestedKey = '';
  try {
    requestedKey = decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return ALL_DISTRO_FORMATS_KEY;
  }

  return dom.formatLinks.some((link) => link.formatKey === requestedKey) ? requestedKey : ALL_DISTRO_FORMATS_KEY;
}

function resolveDistroFormatKey(dom: Pick<DistroSearchDom, 'formatLinks'>, requestedKey: string) {
  return dom.formatLinks.some((link) => link.formatKey === requestedKey) ? requestedKey : ALL_DISTRO_FORMATS_KEY;
}

export function applyDistroFormatSelection(dom: DistroSearchDom, requestedKey: string) {
  const formatKey = resolveDistroFormatKey(dom, requestedKey);

  if (formatKey !== ALL_DISTRO_FORMATS_KEY) dom.root.setAttribute('data-distro-selected-format', formatKey);
  else dom.root.removeAttribute('data-distro-selected-format');

  dom.formatLinks.forEach((link) => {
    const isCurrent = link.formatKey === formatKey;
    link.element.toggleAttribute('data-distro-format-current', isCurrent);
    if (isCurrent) link.element.setAttribute('aria-current', 'true');
    else link.element.removeAttribute('aria-current');
  });
  return { target: dom.root };
}

function setSearchHidden(element: HTMLElement, shouldHide: boolean) {
  if (element.hasAttribute(SEARCH_HIDDEN_ATTRIBUTE) === shouldHide) return;
  element.toggleAttribute(SEARCH_HIDDEN_ATTRIBUTE, shouldHide);
}

/** Pure read of which cards a search shows; applying it is a separate write-only DOM pass. */
export function getDistroSearchVisibleElements(
  dom: Pick<DistroSearchDom, 'items'>,
  matchedElements: ReadonlySet<HTMLElement> | null,
  selectedFormat: string | undefined,
) {
  return new Set(
    dom.items
      .filter(
        (item) =>
          !item.element.hidden &&
          (!matchedElements || matchedElements.has(item.element)) &&
          (!selectedFormat || item.formatKey === selectedFormat),
      )
      .map((item) => item.element),
  );
}

function applyDistroSearchVisibility(dom: DistroSearchDom, visibleElements: ReadonlySet<HTMLElement>) {
  dom.items.forEach((item) => setSearchHidden(item.element, !visibleElements.has(item.element)));
}

export function applyDistroSearch(dom: DistroSearchDom, matchedElements: ReadonlySet<HTMLElement> | null) {
  const visibleElements = getDistroSearchVisibleElements(dom, matchedElements, dom.root.dataset.distroSelectedFormat);
  applyDistroSearchVisibility(dom, visibleElements);
  return visibleElements.size;
}

export function getDistroSearchResultState(visibleCount: number) {
  return {
    isEmpty: visibleCount === 0,
    visibleLabel: `${visibleCount} ${visibleCount === 1 ? 'item' : 'items'}`,
  };
}

export function normalizeStoreArtist(artist: string) {
  return artist.normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase();
}

export function getStoreArtistChoices(items: readonly Pick<DistroSearchItem, 'artist'>[]) {
  const choices = new Map<string, { key: string; label: string; count: number }>();
  for (const { artist } of items) {
    const key = normalizeStoreArtist(artist);
    if (!key) continue;
    const existing = choices.get(key);
    if (existing) existing.count += 1;
    else choices.set(key, { key, label: artist.trim().replace(/\s+/gu, ' '), count: 1 });
  }
  return [...choices.values()].sort((a, b) => a.label.localeCompare(b.label));
}

type StoreArtistChoice = ReturnType<typeof getStoreArtistChoices>[number];

type StoreArtistPickerProps = {
  artist: string;
  choices: readonly StoreArtistChoice[];
  host: HTMLElement;
  onArtistChange: (artist: string) => void;
  resultsId: string;
};

/** The artist list only changes with the artist choice, so typing a query never re-renders it. */
const StoreArtistPicker = memo(function StoreArtistPicker({
  artist,
  choices,
  host,
  onArtistChange,
  resultsId,
}: StoreArtistPickerProps) {
  return createPortal(
    <>
      {/* Phones get the native picker; the desktop pane keeps the radio list. CSS shows one. */}
      <label className="store-artists-picker">
        <span>Artist</span>
        <select value={artist} onChange={(event) => onArtistChange(event.target.value)} aria-controls={resultsId}>
          {choices.map((choice) => (
            <option key={choice.key} value={choice.key}>
              {choice.label} ({choice.count})
            </option>
          ))}
        </select>
      </label>
      <fieldset className="store-artists">
        <legend>Artists</legend>
        <p id="store-artists-help">Artist or label credits from this catalogue.</p>
        <div className="store-artists-list" data-lenis-scroll-root>
          {choices.map((choice) => (
            <label key={choice.key}>
              <input
                type="radio"
                name="store-artist"
                value={choice.key}
                checked={artist === choice.key}
                onChange={() => onArtistChange(choice.key)}
                aria-describedby="store-artists-help"
              />
              <span>
                {choice.label} <span className="text-muted-foreground">({choice.count})</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </>,
    host,
  );
});

function StoreDistroSearch({ pageKey, scope = 'distro' }: StoreDistroSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const domRef = useRef<DistroSearchDom | null>(null);
  const controllerRef = useRef<StoreCoverflowController | null>(null);
  const searcherRef = useRef<ReturnType<typeof createExactFirstSearcher<DistroSearchItem>> | null>(null);
  const pendingFocus = useRef(false);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [artist, setArtist] = useState('');
  const [format, setFormat] = useState('all');
  const [fuzzyRevision, setFuzzyRevision] = useState(0);
  const [artistHost, setArtistHost] = useState<HTMLElement | null>(null);
  const [choices, setChoices] = useState<StoreArtistChoice[]>([]);
  const filtered = Boolean(query.trim() || artist);
  const hasFilters = filtered || format !== 'all';
  const artistChoices = useMemo(
    () => [{ key: '', label: 'All artists', count: domRef.current?.items.length || 0 }, ...choices],
    [choices],
  );
  // Derive the visible set while rendering so each keystroke commits once, count included.
  const visibleElements = useMemo(() => {
    const dom = domRef.current;
    if (!ready || !dom) return null;
    const matches = query.trim() ? searcherRef.current?.search(query) || [] : dom.items;
    const selected = matches.filter((item) => !artist || normalizeStoreArtist(item.artist) === artist);
    const formatKey = resolveDistroFormatKey(dom, format);
    return getDistroSearchVisibleElements(
      dom,
      filtered ? new Set(selected.map((item) => item.element)) : null,
      formatKey === ALL_DISTRO_FORMATS_KEY ? undefined : formatKey,
    );
    // choices changes whenever the island reads a new catalog DOM; fuzzyRevision reruns the search
    // once the lazily loaded fuzzy matcher is available.
  }, [ready, choices, query, artist, format, filtered, fuzzyRevision]);
  const count = visibleElements?.size ?? 0;

  useEffect(() => {
    const dom = readDistroSearchDom(
      document.querySelector<HTMLElement>(scope === 'all' ? '[data-store-search-root]' : '[data-distro-search-root]'),
      scope === 'distro' ? document.querySelector<HTMLElement>('[data-distro-format-navigation]') : null,
    );
    if (!dom) return;
    domRef.current = dom;
    ensureStoreCoverflowCapability();
    const coverflow = readStoreCoverflowDom(dom.root);
    controllerRef.current = coverflow ? createStoreCoverflowController(coverflow) : null;
    searcherRef.current = createExactFirstSearcher(dom.items, (item) => item.searchText, {
      onFuzzyReady: () => {
        if (domRef.current === dom) setFuzzyRevision((revision) => revision + 1);
      },
    });
    setArtistHost(document.querySelector<HTMLElement>('[data-store-artists]'));
    setChoices(getStoreArtistChoices(dom.items));
    const initialFormat = resolveInitialDistroFormatKey(window.location.hash, dom);
    setFormat(initialFormat);
    pendingFocus.current = initialFormat !== 'all';
    const onFormat = (event: Event) => {
      const link =
        event.target instanceof Element ? event.target.closest<HTMLElement>('[data-distro-format-link]') : null;
      if (!link?.dataset.distroFormatKey) return;
      event.preventDefault();
      event.stopPropagation();
      pendingFocus.current = true;
      // A repeated choice still focuses the current results.
      if (link.dataset.distroFormatKey === (dom.root.dataset.distroSelectedFormat || 'all')) {
        const visibleTarget = summaryRef.current ?? dom.root;
        visibleTarget?.focus({ preventScroll: true });
        if (visibleTarget) scrollElementWithLenis(visibleTarget, { block: 'start' });
        pendingFocus.current = false;
      }
      setFormat(link.dataset.distroFormatKey);
    };
    dom.navigation?.addEventListener('click', onFormat);
    setReady(true);
    const total = document.querySelector<HTMLElement>('[data-store-result-total]');
    if (total) total.hidden = true;
    return () => {
      dom.navigation?.removeEventListener('click', onFormat);
      applyDistroFormatSelection(dom, 'all');
      controllerRef.current?.cleanup();
      applyDistroSearch(dom, null);
      if (total) total.hidden = false;
      domRef.current = null;
      controllerRef.current = null;
      searcherRef.current = null;
    };
  }, [pageKey, scope]);

  useEffect(() => {
    const dom = domRef.current;
    if (!ready || !dom || !visibleElements) return;
    controllerRef.current?.setSearchActive(hasFilters);
    const selection = applyDistroFormatSelection(dom, format);
    applyDistroSearchVisibility(dom, visibleElements);
    const visibleCount = visibleElements.size;
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    const frame = requestAnimationFrame(() => {
      const target = visibleCount && format !== 'all' ? selection.target : summaryRef.current;
      target?.focus({ preventScroll: true });
      if (target) scrollElementWithLenis(target, { block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, visibleElements, format, hasFilters, scope]);

  if (!ready) return null;
  const resultsId = scope === 'all' ? 'all-store-catalog' : 'distro-search-results';
  const clearFilters = () => {
    setQuery('');
    setArtist('');
    setFormat('all');
    inputRef.current?.focus();
  };
  return (
    <>
      {artistHost && (
        <StoreArtistPicker
          artist={artist}
          choices={artistChoices}
          host={artistHost}
          onArtistChange={setArtist}
          resultsId={resultsId}
        />
      )}
      <div className="store-search-toolbar">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Store"
            aria-label="Search Store"
            aria-controls={resultsId}
            className="h-11 rounded-none pl-10"
          />
        </div>
        <p
          ref={summaryRef}
          className="store-result-count"
          tabIndex={-1}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {getDistroSearchResultState(count).visibleLabel}
        </p>
        {query && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
          >
            Clear search
          </Button>
        )}
        {hasFilters && (
          <Button type="button" variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>
      {count === 0 && <p className="store-empty-results">No Store items match these filters.</p>}
    </>
  );
}

export default StoreDistroSearch;
