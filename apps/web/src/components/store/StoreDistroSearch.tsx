import { memo, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createExactFirstSearcher } from '@/lib/exact-first-search';
import { acquireLenisModalLock, scrollElementWithLenis } from '@/platform/lib/lenis-scroll';

import { connectSurfaceHistory } from '@/platform/lib/surface-history';
import {
  filterStoreArtistOptions,
  moveStoreFilterParts,
  normalizeStoreArtist,
  placeStoreArtistOptions,
  resetStoreArtistControls,
  resetStoreArtistsTrigger,
  resetStoreFilterTrigger,
  returnStoreFilterParts,
  setStoreArtistsTrigger,
  setStoreFilterTrigger,
} from './store-artist-options';

import { connectStoreCrate, type StoreCrateSwitch } from './crate/crate-switch';

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

// Same order as argument-less localeCompare, without resolving locale data on every comparison (about 40 ms per
// Store load at 4x CPU).
const artistLabelCollator = new Intl.Collator();

export function getStoreArtistChoices(items: readonly Pick<DistroSearchItem, 'artist'>[]) {
  const choices = new Map<string, { key: string; label: string; count: number }>();
  for (const { artist } of items) {
    const key = normalizeStoreArtist(artist);
    if (!key) continue;
    const existing = choices.get(key);
    if (existing) existing.count += 1;
    else choices.set(key, { key, label: artist.trim().replace(/\s+/gu, ' '), count: 1 });
  }
  return [...choices.values()].sort((a, b) => artistLabelCollator.compare(a.label, b.label));
}

type StoreArtistChoice = ReturnType<typeof getStoreArtistChoices>[number];

// Results filter live, so Return or Search only closes a phone keyboard that covers them.
function blurOnEnter(event: KeyboardEvent) {
  if (event.key === 'Enter' && event.target instanceof HTMLElement) event.target.blur();
}

type StoreArtistControlsProps = {
  choices: readonly StoreArtistChoice[];
  resultsId: string;
};

export function StoreArtistControls({ choices, resultsId }: StoreArtistControlsProps) {
  return (
    // The desktop Artists menu holds this list; on phones the island moves it into the Filter sheet while it is open.
    <fieldset className="store-artists" disabled data-store-artist-fieldset data-store-filter-part="artists">
      <legend>Artists</legend>
      <p id="store-artists-help">Tick one or more.</p>
      <input
        type="search"
        className="store-artists-find"
        placeholder="Find an artist"
        enterKeyHint="search"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
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
  );
}

const STORE_FILTER_SECTIONS = [
  ['formats', 'Formats'],
  ['availability', 'Availability'],
  ['view', 'View'],
  ['artists', 'Artists'],
] as const;

/** The phone Filter sheet: one modal bottom sheet that borrows the toolbar's browse controls while it is open. */
export function StoreFilterSheet() {
  return (
    <dialog
      id="store-filter-sheet"
      className="store-filter-sheet"
      aria-labelledby="store-filter-sheet-title"
      data-store-filter-sheet
    >
      <div className="store-filter-sheet__head">
        <h2 id="store-filter-sheet-title" tabIndex={-1}>
          Filter
        </h2>
        <Button type="button" variant="outline" size="icon" aria-label="Close" data-store-filter-sheet-close>
          <X aria-hidden="true" />
        </Button>
      </div>
      <div className="store-filter-sheet__body" data-lenis-scroll-root data-store-filter-sheet-body>
        {STORE_FILTER_SECTIONS.map(([part, title]) => (
          <section key={part} className="store-filter-sheet__section" hidden data-store-filter-section={part}>
            <h3>{title}</h3>
          </section>
        ))}
      </div>
      <div className="store-filter-sheet__foot">
        <Button type="button" className="store-filter-sheet__show" data-store-filter-sheet-done>
          Show items
        </Button>
      </div>
    </dialog>
  );
}

type StoreArtistSelection = ReadonlySet<string>;

// Enhance the server controls without replacing them. Query changes never touch this list.
const StoreArtistPicker = memo(function StoreArtistPicker({
  appliedCount,
  artists,
  host,
  onArtistsChange,
  visibleLabel,
}: {
  appliedCount: number;
  artists: StoreArtistSelection;
  host: HTMLElement;
  onArtistsChange: Dispatch<SetStateAction<StoreArtistSelection>>;
  visibleLabel: string;
}) {
  useEffect(() => {
    const fieldset = host.querySelector<HTMLFieldSetElement>('[data-store-artist-fieldset]');
    if (!fieldset) return;
    const sheet = host.querySelector<HTMLDialogElement>('[data-store-filter-sheet]');
    const find = host.querySelector<HTMLInputElement>('[data-store-artist-find]');
    const trigger = document.querySelector<HTMLButtonElement>(
      '[data-store-search-toolbar] [data-store-artists-trigger]',
    );
    const filterTrigger = document.querySelector<HTMLButtonElement>(
      '[data-store-search-toolbar] [data-store-filter-trigger]',
    );
    const desktop = window.matchMedia('(min-width: 64rem)');
    let releaseScroll: (() => void) | null = null;
    // A Grid or Crate choice made in the sheet waits until the sheet has closed and consumed its history entry,
    // so the Crate's own entry is never the one Back removes.
    let pendingViewChoice: HTMLElement | null = null;
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
      if (sheet && event.target === sheet) closeSheet();
      else if (button?.hasAttribute('data-store-artist-clear')) onArtistsChange(new Set());
      else if (button?.matches('[data-store-filter-sheet-close], [data-store-filter-sheet-done]')) closeSheet();
    };
    const onViewChoice = (event: Event) => {
      const choice =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>('[data-store-crate-grid], [data-store-crate-open]')
          : null;
      if (!choice) return;
      event.stopPropagation();
      pendingViewChoice = choice;
      closeSheet();
    };
    const onFind = () => filterStoreArtistOptions(fieldset, find?.value ?? '');
    const openSheet = (fromHistory = false) => {
      if (!sheet || sheet.open) return;
      if (!fromHistory) surfaceHistory.push();
      moveStoreFilterParts(document, sheet);
      sheet.showModal();
      releaseScroll = acquireLenisModalLock(sheet);
      sheet.querySelector<HTMLElement>('#store-filter-sheet-title')?.focus({ preventScroll: true });
    };
    const returnParts = () => {
      returnStoreFilterParts(document);
      releaseScroll?.();
      releaseScroll = null;
    };
    const onClose = () => {
      returnParts();
      filterTrigger?.focus({ preventScroll: true });
      pendingViewChoice?.click();
      pendingViewChoice = null;
    };
    const surfaceHistory = connectSurfaceHistory('__storeFilter', (open) => {
      if (open) openSheet(true);
      else sheet?.close();
    });
    const closeSheet = () => surfaceHistory.close(() => sheet?.close());
    // Prevent the native fallback (the Formats menu) once the sheet is available.
    const onOpen = (event: Event) => {
      event.preventDefault();
      openSheet();
    };
    const onCancel = (event: Event) => {
      event.preventDefault();
      closeSheet();
    };
    const onViewport = (event: MediaQueryListEvent) => {
      if (event.matches && sheet?.open) closeSheet();
      if (!event.matches) {
        document.querySelectorAll<HTMLElement>('[data-store-browse-menu]').forEach((menu) => {
          try {
            menu.hidePopover();
          } catch {
            // Already closed or unsupported.
          }
        });
      }
    };
    host.addEventListener('change', onChange);
    host.addEventListener('click', onClick);
    sheet?.addEventListener('click', onViewChoice, true);
    find?.addEventListener('input', onFind);
    find?.addEventListener('keydown', blurOnEnter);
    filterTrigger?.addEventListener('click', onOpen);
    sheet?.addEventListener('cancel', onCancel);
    sheet?.addEventListener('close', onClose);
    desktop.addEventListener('change', onViewport);
    fieldset.disabled = false;
    if (trigger) trigger.disabled = false;
    if (filterTrigger) filterTrigger.disabled = false;
    return () => {
      host.removeEventListener('change', onChange);
      host.removeEventListener('click', onClick);
      sheet?.removeEventListener('click', onViewChoice, true);
      find?.removeEventListener('input', onFind);
      find?.removeEventListener('keydown', blurOnEnter);
      filterTrigger?.removeEventListener('click', onOpen);
      sheet?.removeEventListener('cancel', onCancel);
      surfaceHistory.dispose();
      sheet?.removeEventListener('close', onClose);
      desktop.removeEventListener('change', onViewport);
      pendingViewChoice = null;
      if (sheet?.open) sheet.close();
      returnParts();
      resetStoreArtistControls(host);
      if (trigger) resetStoreArtistsTrigger(trigger);
      if (filterTrigger) resetStoreFilterTrigger(filterTrigger);
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
    const filterTrigger = document.querySelector<HTMLElement>(
      '[data-store-search-toolbar] [data-store-filter-trigger]',
    );
    if (filterTrigger) setStoreFilterTrigger(filterTrigger, appliedCount);
  }, [appliedCount]);
  useEffect(() => {
    const done = host.querySelector<HTMLElement>('[data-store-filter-sheet-done]');
    if (done) done.textContent = `Show ${visibleLabel}`;
  }, [host, visibleLabel]);
  return null;
});

type StoreSearchToolbarProps = {
  /** The cards' container, which the Grid/Crate switch controls. */
  catalogId: string;
  /** The native Formats menu, when the collection shows the Distro format links. */
  formatsMenuId?: string | undefined;
  resultsId: string;
};

/**
 * One 44px row: Search, then Filter on phones, or Formats, Artists, Pre-orders, Grid/Crate and the count on desktop.
 * Every control renders at its final size before enhancement. Formats and the phone Filter open the native Formats
 * menu without JavaScript, so the format links stay reachable; the island turns Filter into the Filter sheet.
 */
export function StoreSearchToolbar({ catalogId, formatsMenuId, resultsId }: StoreSearchToolbarProps) {
  return (
    <>
      <div className="store-search-toolbar" data-store-search-toolbar>
        <div className="store-search-field relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            disabled
            placeholder="Search Store"
            aria-label="Search Store"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-controls={resultsId}
            className="h-11 rounded-none pl-10"
          />
        </div>
        <Button
          type="button"
          variant="chip"
          className="store-filter-trigger"
          aria-haspopup="dialog"
          aria-controls="store-filter-sheet"
          popoverTarget={formatsMenuId}
          disabled={!formatsMenuId}
          data-store-filter-trigger
        >
          <SlidersHorizontal aria-hidden="true" />
          Filter
          <span className="store-filter-trigger__count" data-store-filter-count />
        </Button>
        {formatsMenuId && (
          <Button
            type="button"
            variant="chip"
            className="store-menu-trigger"
            popoverTarget={formatsMenuId}
            data-store-formats-trigger
          >
            Formats
            <ChevronDown aria-hidden="true" />
          </Button>
        )}
        <Button
          type="button"
          variant="chip"
          className="store-menu-trigger store-artists-trigger"
          popoverTarget="store-artists-menu"
          disabled
          data-store-artists-trigger
        >
          <span data-store-artists-trigger-label>Artists</span>
          <ChevronDown aria-hidden="true" />
        </Button>
        {/* Homes keep the Pre-orders chip and the view switch in the desktop row; the Filter sheet borrows them. */}
        <span className="store-filter-home" data-store-filter-home="availability">
          <Button
            type="button"
            variant="chip"
            className="store-preorder-filter"
            aria-pressed="false"
            aria-controls={resultsId}
            disabled
            hidden
            data-store-preorder-filter
            data-store-filter-part="availability"
          >
            Pre-orders{' '}
            <span className="store-preorder-filter__count" data-store-preorder-count>
              0
            </span>
          </Button>
        </span>
        <span className="store-filter-home" data-store-filter-home="view">
          {/* Shown only inside a collection with a bin, once the Store search island is ready. */}
          <span
            className="store-crate-view-switch"
            role="group"
            aria-label="Catalogue view"
            data-store-filter-part="view"
          >
            <button
              type="button"
              className="store-crate-view"
              aria-controls={catalogId}
              aria-pressed="true"
              data-store-crate-grid
              disabled
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <rect width="7" height="7"></rect>
                <rect x="9" width="7" height="7"></rect>
                <rect y="9" width="7" height="7"></rect>
                <rect x="9" y="9" width="7" height="7"></rect>
              </svg>
              Grid
            </button>
            <button
              type="button"
              className="store-crate-view"
              aria-controls={catalogId}
              aria-pressed="false"
              data-store-crate-open
              disabled
            >
              <svg width="18" height="16" viewBox="0 0 18 16" fill="currentColor" aria-hidden="true">
                <rect x="5" y="0" width="8" height="2"></rect>
                <rect x="3" y="3" width="12" height="2"></rect>
                <rect x="1" y="6" width="16" height="10"></rect>
              </svg>
              Crate
            </button>
          </span>
        </span>
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
          <dt>Ships together</dt>
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
  const crateRef = useRef<StoreCrateSwitch | null>(null);
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
    // The Crate applies a format synchronously, before it measures the cards it flies between Grid and bin.
    crateRef.current = connectStoreCrate(dom.root, {
      filterable: dom.formatLinks.length > 0,
      format: () => dom.root.dataset.distroSelectedFormat || ALL_DISTRO_FORMATS_KEY,
      setFormat: (key) => {
        const formatKey = resolveDistroFormatKey(dom, key);
        applyDistroFormatSelection(dom, formatKey);
        applyDistroSearchVisibility(
          dom,
          getDistroSearchVisibleElements(dom, null, formatKey === ALL_DISTRO_FORMATS_KEY ? undefined : formatKey),
        );
        setFormat(formatKey);
      },
    });
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
      // A choice from the desktop Formats menu closes it; the sheet stays open and shows the new count.
      const menu = link.closest<HTMLElement>('[data-store-browse-menu]');
      if (menu?.matches(':popover-open')) menu.hidePopover();
      // In the Crate a format choice walks to its bin, or leaves for the Grid when it has none.
      if (crateRef.current?.choose(link.dataset.distroFormatKey)) return;
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
    // The Pre-orders chip may sit in the Filter sheet, outside the toolbar.
    const preorderFilter = document.querySelector<HTMLButtonElement>('[data-store-preorder-filter]');
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
      // The live count, not the field: refocusing the field would reopen a phone keyboard over the restored results.
      summary?.focus();
    };
    const onPreorderFilter = () => setPreorders((current) => ({ ...current, active: !current.active }));
    input?.addEventListener('input', onInput);
    input?.addEventListener('keydown', blurOnEnter);
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
      input?.removeEventListener('keydown', blurOnEnter);
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
      crateRef.current?.dispose();
      applyDistroSearch(dom, null);
      domRef.current = null;
      crateRef.current = null;
      searcherRef.current = null;
    };
  }, [pageKey, scope]);

  useEffect(() => {
    const dom = domRef.current;
    if (!ready || !dom || !visibleElements) return;
    const selection = applyDistroFormatSelection(dom, format);
    applyDistroSearchVisibility(dom, visibleElements);
    crateRef.current?.sync(filtered, visibleElements, resolveDistroFormatKey(dom, format));
    const visibleCount = visibleElements.size;
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    const frame = requestAnimationFrame(() => {
      const target = visibleCount && format !== 'all' ? selection.target : summaryRef.current;
      target?.focus({ preventScroll: true });
      if (target) scrollElementWithLenis(target, { block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, visibleElements, format, filtered, scope]);

  useEffect(() => {
    if (!ready) return;
    if (inputRef.current) inputRef.current.value = query;
    if (summaryRef.current) summaryRef.current.textContent = getDistroSearchResultState(count).visibleLabel;
    const toolbar = document.querySelector<HTMLElement>('[data-store-search-toolbar]');
    const clearSearch = toolbar?.querySelector<HTMLButtonElement>('[data-store-clear-search]');
    const clearAll = toolbar?.querySelector<HTMLButtonElement>('[data-store-clear-filters]');
    const preorderFilter = document.querySelector<HTMLButtonElement>('[data-store-preorder-filter]');
    const preorderCount = document.querySelector<HTMLElement>('[data-store-preorder-count]');
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
      appliedCount={artists.size + Number(preordersOnly) + Number(format !== 'all')}
      artists={artists}
      host={artistHost}
      onArtistsChange={setArtists}
      visibleLabel={getDistroSearchResultState(count).visibleLabel}
    />
  ) : null;
}

export default StoreDistroSearch;
