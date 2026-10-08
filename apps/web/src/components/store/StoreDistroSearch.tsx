import { memo, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createExactFirstSearcher } from '@/lib/exact-first-search';
import { acquireLenisModalLock, scrollElementWithLenis } from '@/platform/lib/lenis-scroll';

import {
  filterStoreArtistOptions,
  normalizeStoreArtist,
  placeStoreArtistOptions,
  resetStoreArtistControls,
  resetStoreArtistsTrigger,
  setStoreArtistsTrigger,
} from './store-artist-options';

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
  preordersOnly = false,
) {
  return new Set(
    dom.items
      .filter(
        (item) =>
          !item.element.hidden &&
          (!preordersOnly || item.element.hasAttribute('data-store-preorder')) &&
          (!matchedElements || matchedElements.has(item.element)) &&
          (!selectedFormat || item.formatKey === selectedFormat),
      )
      .map((item) => item.element),
  );
}

function applyDistroSearchVisibility(dom: DistroSearchDom, visibleElements: ReadonlySet<HTMLElement>) {
  dom.items.forEach((item) => setSearchHidden(item.element, !visibleElements.has(item.element)));
}

export function applyDistroSearch(
  dom: DistroSearchDom,
  matchedElements: ReadonlySet<HTMLElement> | null,
  preordersOnly = false,
) {
  const visibleElements = getDistroSearchVisibleElements(
    dom,
    matchedElements,
    dom.root.dataset.distroSelectedFormat,
    preordersOnly,
  );
  applyDistroSearchVisibility(dom, visibleElements);
  return visibleElements.size;
}

export function getDistroSearchResultState(visibleCount: number) {
  return {
    isEmpty: visibleCount === 0,
    visibleLabel: `${visibleCount} ${visibleCount === 1 ? 'item' : 'items'}`,
  };
}

export { normalizeStoreArtist };

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

type StoreArtistControlsProps = {
  choices: readonly StoreArtistChoice[];
  resultsId: string;
};

export function StoreArtistControls({ choices, resultsId }: StoreArtistControlsProps) {
  return (
    <>
      {/* The desktop pane shows this list; on phones the island moves it into the sheet below while it is open. */}
      <fieldset className="store-artists" disabled data-store-artist-fieldset>
        <legend>Artists</legend>
        <p id="store-artists-help">Tick one or more.</p>
        <input
          type="search"
          className="store-artists-find"
          placeholder="Find an artist"
          aria-label="Find an artist"
          aria-controls="store-artists-options"
          data-store-artist-find
        />
        <div className="store-artists-selected" hidden data-store-artist-selected>
          <div className="store-artists-selected__head">
            <span data-store-artist-selected-label>Selected · 0</span>
            <button type="button" className="store-artists-clear" data-store-artist-clear>
              Clear
            </button>
          </div>
          <div className="store-artists-selected__list" data-store-artist-selected-list />
        </div>
        <div id="store-artists-options" className="store-artists-list" data-lenis-scroll-root data-store-artist-options>
          {choices.map((choice, index) => (
            <label
              key={choice.key}
              data-store-artist-option
              data-store-artist-index={index}
              data-store-artist-name={choice.key}
            >
              <input
                type="checkbox"
                name="store-artist"
                value={choice.key}
                aria-controls={resultsId}
                aria-describedby="store-artists-help"
              />
              <span>
                {choice.label} <span className="text-muted-foreground">({choice.count})</span>
              </span>
            </label>
          ))}
        </div>
        <p className="store-artists-no-match" hidden data-store-artist-no-match>
          No artist matches.
        </p>
      </fieldset>
      <dialog
        id="store-artists-sheet"
        className="store-artists-sheet"
        aria-labelledby="store-artists-sheet-title"
        data-store-artists-sheet
      >
        <div className="store-artists-sheet__head">
          <h2 id="store-artists-sheet-title" tabIndex={-1}>
            Artists
          </h2>
          <Button type="button" variant="outline" size="icon-lg" aria-label="Close" data-store-artists-sheet-close>
            <X aria-hidden="true" />
          </Button>
        </div>
        <div className="store-artists-sheet__body" data-lenis-scroll-root data-store-artists-sheet-body />
        <div className="store-artists-sheet__foot">
          <Button type="button" size="lg" className="store-artists-sheet__show" data-store-artists-sheet-done>
            Show items
          </Button>
        </div>
      </dialog>
    </>
  );
}

type StoreArtistSelection = ReadonlySet<string>;

// Enhance the server controls without replacing them. Query changes never touch this list.
const StoreArtistPicker = memo(function StoreArtistPicker({
  artists,
  host,
  onArtistsChange,
  visibleLabel,
}: {
  artists: StoreArtistSelection;
  host: HTMLElement;
  onArtistsChange: Dispatch<SetStateAction<StoreArtistSelection>>;
  visibleLabel: string;
}) {
  useEffect(() => {
    const fieldset = host.querySelector<HTMLFieldSetElement>('[data-store-artist-fieldset]');
    if (!fieldset) return;
    const sheet = host.querySelector<HTMLDialogElement>('[data-store-artists-sheet]');
    const sheetBody = sheet?.querySelector<HTMLElement>('[data-store-artists-sheet-body]');
    const find = host.querySelector<HTMLInputElement>('[data-store-artist-find]');
    const trigger = document.querySelector<HTMLButtonElement>(
      '[data-store-search-toolbar] [data-store-artists-trigger]',
    );
    const desktop = window.matchMedia('(min-width: 64rem)');
    let releaseScroll: (() => void) | null = null;
    const onChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.name !== 'store-artist') return;
      const { checked, value } = target;
      onArtistsChange((current) => {
        const next = new Set(current);
        if (checked) next.add(value);
        else next.delete(value);
        return next;
      });
    };
    const onClick = (event: Event) => {
      const button = event.target instanceof Element ? event.target.closest('button') : null;
      if (sheet && event.target === sheet) sheet.close();
      else if (button?.hasAttribute('data-store-artist-clear')) onArtistsChange(new Set());
      else if (button?.matches('[data-store-artists-sheet-close], [data-store-artists-sheet-done]')) sheet?.close();
    };
    const onFind = () => filterStoreArtistOptions(fieldset, find?.value ?? '');
    const openSheet = () => {
      if (!sheet || !sheetBody || sheet.open) return;
      sheetBody.append(fieldset);
      sheet.showModal();
      releaseScroll = acquireLenisModalLock(sheet);
      sheet.querySelector<HTMLElement>('#store-artists-sheet-title')?.focus();
    };
    const returnList = () => {
      sheet?.before(fieldset);
      releaseScroll?.();
      releaseScroll = null;
    };
    const onClose = () => {
      returnList();
      trigger?.focus();
    };
    const onViewport = (event: MediaQueryListEvent) => {
      if (event.matches) sheet?.close();
    };
    host.addEventListener('change', onChange);
    host.addEventListener('click', onClick);
    find?.addEventListener('input', onFind);
    trigger?.addEventListener('click', openSheet);
    sheet?.addEventListener('close', onClose);
    desktop.addEventListener('change', onViewport);
    fieldset.disabled = false;
    if (trigger) trigger.disabled = false;
    return () => {
      host.removeEventListener('change', onChange);
      host.removeEventListener('click', onClick);
      find?.removeEventListener('input', onFind);
      trigger?.removeEventListener('click', openSheet);
      sheet?.removeEventListener('close', onClose);
      desktop.removeEventListener('change', onViewport);
      if (sheet?.open) sheet.close();
      returnList();
      resetStoreArtistControls(host);
      if (trigger) resetStoreArtistsTrigger(trigger);
    };
  }, [host, onArtistsChange]);
  useEffect(() => {
    const fieldset = host.querySelector<HTMLFieldSetElement>('[data-store-artist-fieldset]');
    if (!fieldset) return;
    host.querySelectorAll<HTMLInputElement>('input[name="store-artist"]').forEach((checkbox) => {
      checkbox.checked = artists.has(checkbox.value);
    });
    const count = placeStoreArtistOptions(fieldset);
    filterStoreArtistOptions(fieldset, host.querySelector<HTMLInputElement>('[data-store-artist-find]')?.value ?? '');
    const trigger = document.querySelector<HTMLElement>('[data-store-search-toolbar] [data-store-artists-trigger]');
    if (trigger) setStoreArtistsTrigger(trigger, count);
  }, [artists, host]);
  useEffect(() => {
    const done = host.querySelector<HTMLElement>('[data-store-artists-sheet-done]');
    if (done) done.textContent = `Show ${visibleLabel}`;
  }, [host, visibleLabel]);
  return null;
});

export function StoreSearchToolbar({ resultsId }: { resultsId: string }) {
  return (
    <>
      <div className="store-search-toolbar" data-store-search-toolbar>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            disabled
            placeholder="Search Store"
            aria-label="Search Store"
            aria-controls={resultsId}
            className="h-11 rounded-none pl-10"
          />
        </div>
        <p
          className="store-result-count"
          tabIndex={-1}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-store-search-summary
        />
        <Button type="button" variant="ghost" disabled hidden data-store-clear-search>
          Clear search
        </Button>
        {/* Phones only (CSS); the island opens the Artists sheet from it. */}
        <Button
          type="button"
          variant="chip"
          size="lg"
          className="store-artists-trigger"
          aria-haspopup="dialog"
          aria-controls="store-artists-sheet"
          disabled
          data-store-artists-trigger
        >
          <span data-store-artists-trigger-label>Artists</span>
          <ChevronDown aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="chip"
          size="lg"
          className="store-preorder-filter"
          aria-pressed="false"
          aria-controls={resultsId}
          disabled
          hidden
          data-store-preorder-filter
        >
          Pre-orders{' '}
          <span className="store-preorder-filter__count" data-store-preorder-count>
            0
          </span>
        </Button>
        <button type="button" className="store-clear-filters" disabled hidden data-store-clear-filters>
          <X aria-hidden="true" />
          Clear filters
        </button>
      </div>
      <dl className="store-preorder-notes" aria-label="About pre-orders" data-store-preorder-notes hidden>
        <div>
          <dt>You pay today</dt>
          <dd>Charged in full at order, like any other purchase.</dd>
        </div>
        <div>
          <dt>We wait for the copies</dt>
          <dd>Every item states when we expect to ship. If that changes, we email you.</dd>
        </div>
        <div>
          <dt>One parcel</dt>
          <dd>Your whole order is sent together by BOX NOW when the pre-order arrives.</dd>
        </div>
      </dl>
      <p className="store-empty-results" data-store-empty-results hidden>
        No Store items match these filters.
      </p>
    </>
  );
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
  const [artists, setArtists] = useState<StoreArtistSelection>(() => new Set());
  const [format, setFormat] = useState('all');
  const [fuzzyRevision, setFuzzyRevision] = useState(0);
  const [preorders, setPreorders] = useState({ count: 0, active: false });
  const [artistHost, setArtistHost] = useState<HTMLElement | null>(null);
  const [choices, setChoices] = useState<StoreArtistChoice[]>([]);
  const preordersOnly = preorders.active && preorders.count > 0;
  const filtered = Boolean(query.trim() || artists.size > 0 || preordersOnly);
  const hasFilters = filtered || format !== 'all';
  // Derive the visible set while rendering so each keystroke commits once, count included.
  const visibleElements = useMemo(() => {
    const dom = domRef.current;
    if (!ready || !dom) return null;
    const matches = query.trim() ? searcherRef.current?.search(query) || [] : dom.items;
    const selected = matches.filter((item) => artists.size === 0 || artists.has(normalizeStoreArtist(item.artist)));
    const formatKey = resolveDistroFormatKey(dom, format);
    return getDistroSearchVisibleElements(
      dom,
      filtered ? new Set(selected.map((item) => item.element)) : null,
      formatKey === ALL_DISTRO_FORMATS_KEY ? undefined : formatKey,
      preordersOnly,
    );
    // choices changes whenever the island reads a new catalog DOM; fuzzyRevision reruns the search
    // once the lazily loaded fuzzy matcher is available.
  }, [ready, choices, query, artists, format, filtered, fuzzyRevision, preorders, preordersOnly]);
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
    const countPreorders = () => dom.items.filter((item) => item.element.hasAttribute('data-store-preorder')).length;
    setPreorders({ count: countPreorders(), active: window.location.hash === '#preorders' });
    const onListingApplied = () => {
      const count = countPreorders();
      setPreorders((current) => ({ count, active: count > 0 && current.active }));
    };
    document.addEventListener('blackbox:store-listing-applied', onListingApplied);
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
    const toolbar = document.querySelector<HTMLElement>('[data-store-search-toolbar]');
    const input = toolbar?.querySelector<HTMLInputElement>('input[type="search"]');
    const summary = toolbar?.querySelector<HTMLParagraphElement>('[data-store-search-summary]');
    const clearSearch = toolbar?.querySelector<HTMLButtonElement>('[data-store-clear-search]');
    const clearAll = toolbar?.querySelector<HTMLButtonElement>('[data-store-clear-filters]');
    const preorderFilter = toolbar?.querySelector<HTMLButtonElement>('[data-store-preorder-filter]');
    inputRef.current = input ?? null;
    summaryRef.current = summary ?? null;
    const onInput = () => setQuery(input?.value ?? '');
    const onClearSearch = () => {
      setQuery('');
      input?.focus();
    };
    const onClearAll = () => {
      setQuery('');
      setArtists(new Set());
      setFormat('all');
      setPreorders((current) => ({ ...current, active: false }));
      input?.focus();
    };
    const onPreorderFilter = () => setPreorders((current) => ({ ...current, active: !current.active }));
    input?.addEventListener('input', onInput);
    clearSearch?.addEventListener('click', onClearSearch);
    clearAll?.addEventListener('click', onClearAll);
    preorderFilter?.addEventListener('click', onPreorderFilter);
    if (input) input.disabled = false;
    if (clearSearch) clearSearch.disabled = false;
    if (clearAll) clearAll.disabled = false;
    if (preorderFilter) preorderFilter.disabled = false;
    toolbar?.setAttribute('data-store-search-ready', '');
    return () => {
      input?.removeEventListener('input', onInput);
      clearSearch?.removeEventListener('click', onClearSearch);
      clearAll?.removeEventListener('click', onClearAll);
      preorderFilter?.removeEventListener('click', onPreorderFilter);
      if (input) {
        input.disabled = true;
        input.value = '';
      }
      if (summary) summary.textContent = '';
      for (const button of [clearSearch, clearAll, preorderFilter])
        if (button) {
          button.disabled = true;
          button.hidden = true;
        }
      toolbar?.removeAttribute('data-store-search-ready');
      const empty = document.querySelector<HTMLElement>('[data-store-empty-results]');
      if (empty) empty.hidden = true;
      const notes = document.querySelector<HTMLElement>('[data-store-preorder-notes]');
      if (notes) notes.hidden = true;
      document.removeEventListener('blackbox:store-listing-applied', onListingApplied);
      dom.navigation?.removeEventListener('click', onFormat);
      applyDistroFormatSelection(dom, 'all');
      controllerRef.current?.cleanup();
      applyDistroSearch(dom, null);
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

  useEffect(() => {
    if (!ready) return;
    if (inputRef.current) inputRef.current.value = query;
    if (summaryRef.current) summaryRef.current.textContent = getDistroSearchResultState(count).visibleLabel;
    const toolbar = document.querySelector<HTMLElement>('[data-store-search-toolbar]');
    const clearSearch = toolbar?.querySelector<HTMLButtonElement>('[data-store-clear-search]');
    const clearAll = toolbar?.querySelector<HTMLButtonElement>('[data-store-clear-filters]');
    const preorderFilter = toolbar?.querySelector<HTMLButtonElement>('[data-store-preorder-filter]');
    const preorderCount = toolbar?.querySelector<HTMLElement>('[data-store-preorder-count]');
    if (preorderFilter) {
      preorderFilter.hidden = preorders.count === 0;
      preorderFilter.setAttribute('aria-pressed', String(preordersOnly));
    }
    if (preorderCount) preorderCount.textContent = String(preorders.count);
    const notes = document.querySelector<HTMLElement>('[data-store-preorder-notes]');
    if (notes) notes.hidden = !preordersOnly;
    if (clearSearch) clearSearch.hidden = !query;
    if (clearAll) clearAll.hidden = !hasFilters;
    const empty = document.querySelector<HTMLElement>('[data-store-empty-results]');
    if (empty) empty.hidden = count !== 0;
  }, [ready, query, count, hasFilters, preorders, preordersOnly]);

  if (!ready) return null;
  return artistHost ? (
    <StoreArtistPicker
      artists={artists}
      host={artistHost}
      onArtistsChange={setArtists}
      visibleLabel={getDistroSearchResultState(count).visibleLabel}
    />
  ) : null;
}

export default StoreDistroSearch;
