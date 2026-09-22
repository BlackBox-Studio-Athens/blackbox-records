import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  scope?: 'all' | 'distro';
};

type DistroSearchItem = {
  element: HTMLElement;
  searchText: string;
  artist: string;
};

type DistroFormatLink = {
  element: HTMLElement;
  formatKey: string;
};

type DistroFormatGroup = {
  element: HTMLElement;
  formatKey: string;
  items: DistroSearchItem[];
  target: HTMLElement;
};

export type DistroSearchDom = {
  formatLinks: DistroFormatLink[];
  formatDisclosure: HTMLDetailsElement | null;
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
    artist: element.dataset.storeArtist || '',
  }));
  const itemsByElement = new Map(items.map((item) => [item.element, item]));
  const groups = [...root.querySelectorAll<HTMLElement>('[data-distro-search-group]')]
    .map((element): DistroFormatGroup | null => {
      const formatKey = element.dataset.distroFormatKey;
      const target = element.querySelector<HTMLElement>('[data-distro-format-target]');
      if (!formatKey || !target) return null;

      return {
        element,
        formatKey,
        items: [...element.querySelectorAll<HTMLElement>('[data-distro-search-item]')]
          .map((itemElement) => itemsByElement.get(itemElement))
          .filter((item): item is DistroSearchItem => Boolean(item)),
        target,
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
    formatLinks,
    formatDisclosure: navigation?.closest<HTMLDetailsElement>('[data-store-browse-disclosure]') ?? null,
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

export function applyDistroFormatSelection(dom: DistroSearchDom, requestedKey: string) {
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
  return { target: selectedGroup?.target ?? dom.root };
}

function setSearchHidden(element: HTMLElement, shouldHide: boolean) {
  if (element.hasAttribute(SEARCH_HIDDEN_ATTRIBUTE) === shouldHide) return;
  element.toggleAttribute(SEARCH_HIDDEN_ATTRIBUTE, shouldHide);
}

export function applyDistroSearch(dom: DistroSearchDom, matchedElements: ReadonlySet<HTMLElement> | null) {
  const selectedFormat = dom.root.dataset.distroSelectedFormat;
  const formatItems = selectedFormat
    ? new Set(dom.groups.find((group) => group.formatKey === selectedFormat)?.items)
    : null;
  const visibleElements = new Set(
    dom.items
      .filter(
        (item) =>
          !item.element.hidden &&
          (!matchedElements || matchedElements.has(item.element)) &&
          (!formatItems || formatItems.has(item)),
      )
      .map((item) => item.element),
  );

  dom.items.forEach((item) => setSearchHidden(item.element, !visibleElements.has(item.element)));
  dom.groups.forEach((group) => {
    setSearchHidden(group.element, !group.items.some((item) => visibleElements.has(item.element)));
  });

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
  const [count, setCount] = useState(0);
  const [artistHost, setArtistHost] = useState<HTMLElement | null>(null);
  const [choices, setChoices] = useState<ReturnType<typeof getStoreArtistChoices>>([]);
  const filtered = Boolean(query.trim() || artist);
  const hasFilters = filtered || format !== 'all';

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
    searcherRef.current = createExactFirstSearcher(dom.items, (item) => item.searchText);
    setArtistHost(document.querySelector<HTMLElement>('[data-store-artists]'));
    setChoices(getStoreArtistChoices(dom.items));
    setCount(dom.items.length);
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
      if (dom.formatDisclosure) dom.formatDisclosure.open = false;
      // A repeated choice still closes Browse and focuses the current results.
      if (link.dataset.distroFormatKey === (dom.root.dataset.distroSelectedFormat || 'all')) {
        controllerRef.current?.setFocusedGroup(
          dom.groups.find((group) => group.formatKey === link.dataset.distroFormatKey)?.element ?? null,
        );
        const target = dom.groups.find((group) => group.formatKey === link.dataset.distroFormatKey)?.target;
        const visibleTarget = target?.closest('[data-distro-search-hidden]')
          ? summaryRef.current
          : target || summaryRef.current;
        visibleTarget?.focus({ preventScroll: true });
        visibleTarget?.scrollIntoView({ block: 'start' });
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
    if (!ready || !dom) return;
    controllerRef.current?.setSearchActive(filtered);
    const selection = applyDistroFormatSelection(dom, format);
    controllerRef.current?.setFocusedGroup(dom.groups.find((group) => group.formatKey === format)?.element ?? null);
    const matches = query.trim() ? searcherRef.current?.search(query) || [] : dom.items;
    const selected = matches.filter((item) => !artist || normalizeStoreArtist(item.artist) === artist);
    const visibleCount = applyDistroSearch(dom, filtered ? new Set(selected.map((item) => item.element)) : null);
    setCount(visibleCount);
    const current = document.querySelector<HTMLElement>('[data-store-browse-current]');
    if (current)
      current.textContent = [
        choices.find((choice) => choice.key === artist)?.label || 'All artists',
        scope === 'distro'
          ? dom.groups.find((group) => group.formatKey === format)?.target.textContent?.trim() || 'All formats'
          : '',
      ]
        .filter(Boolean)
        .join(' · ');
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    const frame = requestAnimationFrame(() => {
      const target = visibleCount && format !== 'all' ? selection.target : summaryRef.current;
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, query, artist, format, filtered, choices, scope]);

  if (!ready) return null;
  const clearFilters = () => {
    setQuery('');
    setArtist('');
    setFormat('all');
    inputRef.current?.focus();
  };
  return (
    <>
      {artistHost &&
        createPortal(
          <fieldset className="store-artists">
            <legend>Artists</legend>
            <p id="store-artists-help">Artist or label credits from this catalogue.</p>
            <div className="store-artists-list">
              {[{ key: '', label: 'All artists', count: domRef.current?.items.length || 0 }, ...choices].map(
                (choice) => (
                  <label key={choice.key}>
                    <input
                      type="radio"
                      name="store-artist"
                      value={choice.key}
                      checked={artist === choice.key}
                      onChange={() => setArtist(choice.key)}
                      aria-describedby="store-artists-help"
                    />
                    <span>
                      {choice.label} <span className="text-muted-foreground">({choice.count})</span>
                    </span>
                  </label>
                ),
              )}
            </div>
          </fieldset>,
          artistHost,
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
            aria-controls={scope === 'all' ? 'all-store-catalog' : 'distro-search-results'}
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
