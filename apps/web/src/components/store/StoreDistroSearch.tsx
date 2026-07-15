import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createExactFirstSearcher } from '@/lib/exact-first-search';

const SEARCH_HIDDEN_ATTRIBUTE = 'data-distro-search-hidden';
const COVERFLOW_POSITIONS = ['active', 'right-near', 'right-far', 'back', 'left-far', 'left-near'] as const;

export type DistroCoverflowState =
  | { mode: 'preview'; activeIndex: number }
  | { mode: 'catalog'; selectedIndex?: number }
  | { mode: 'search-results' };
export type DistroCoverflowEvent =
  | { type: 'focus'; activeIndex: number }
  | { type: 'move'; delta: -1 | 1 }
  | { type: 'search'; active: boolean }
  | { type: 'toggle' };
type DistroCoverflowGroup = {
  cards: HTMLElement[];
  controls: HTMLElement;
  element: HTMLElement;
  nextButton: HTMLButtonElement;
  previousButton: HTMLButtonElement;
  reveal: HTMLElement;
  state: DistroCoverflowState;
  status: HTMLElement;
  toggleButton: HTMLButtonElement;
};

export function getDistroCoverflowPosition(cardIndex: number, activeIndex: number) {
  return COVERFLOW_POSITIONS[(cardIndex - activeIndex + COVERFLOW_POSITIONS.length) % COVERFLOW_POSITIONS.length]!;
}

export function reduceDistroCoverflowState(
  state: DistroCoverflowState,
  event: DistroCoverflowEvent,
  previewCount: number = COVERFLOW_POSITIONS.length,
): DistroCoverflowState {
  if (event.type === 'search') {
    if (event.active) return { mode: 'search-results' };
    return state.mode === 'search-results' ? { mode: 'catalog' } : state;
  }
  if (event.type === 'toggle') {
    if (state.mode === 'search-results') return state;
    return state.mode === 'preview'
      ? { mode: 'catalog', selectedIndex: state.activeIndex }
      : { mode: 'preview', activeIndex: state.selectedIndex ?? 0 };
  }
  if (state.mode !== 'preview') return state;
  if (event.type === 'focus') {
    return event.activeIndex >= 0 && event.activeIndex < previewCount
      ? { ...state, activeIndex: event.activeIndex }
      : state;
  }

  return { ...state, activeIndex: (state.activeIndex + event.delta + previewCount) % previewCount };
}

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

export type DistroSearchDom = {
  coverflowGroups: DistroCoverflowGroup[];
  chunks: DistroSearchChunk[];
  groups: Array<{ chunks: DistroSearchChunk[]; element: HTMLElement }>;
  items: DistroSearchItem[];
  navigation: HTMLElement | null;
};

export function readDistroSearchDom(
  root: ParentNode | null,
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
  const groups = [...root.querySelectorAll<HTMLElement>('[data-distro-search-group]')].map((element) => ({
    element,
    chunks: [...element.querySelectorAll<HTMLElement>('[data-distro-search-chunk]')]
      .map((chunkElement) => chunksByElement.get(chunkElement))
      .filter((chunk): chunk is DistroSearchChunk => Boolean(chunk)),
  }));
  const coverflowGroups = [...root.querySelectorAll<HTMLElement>('[data-distro-coverflow-group]')]
    .map((element): DistroCoverflowGroup | null => {
      const controls = element.querySelector<HTMLElement>('[data-distro-coverflow-controls]');
      const previousButton = element.querySelector<HTMLButtonElement>('[data-distro-coverflow-previous]');
      const nextButton = element.querySelector<HTMLButtonElement>('[data-distro-coverflow-next]');
      const toggleButton = element.querySelector<HTMLButtonElement>('[data-distro-coverflow-toggle]');
      const status = element.querySelector<HTMLElement>('[data-distro-coverflow-status]');
      const reveal = element.querySelector<HTMLElement>('.distro-coverflow-reveal');
      const cards = [...element.querySelectorAll<HTMLElement>('[data-distro-coverflow-card]')];
      if (!controls || !previousButton || !nextButton || !toggleButton || !status || !reveal || cards.length !== 6) {
        return null;
      }

      return {
        cards,
        controls,
        element,
        nextButton,
        previousButton,
        reveal,
        state: { mode: 'preview', activeIndex: 0 },
        status,
        toggleButton,
      };
    })
    .filter((group): group is DistroCoverflowGroup => group !== null);

  return { coverflowGroups, chunks, groups, items, navigation };
}

type DistroCoverflowController = {
  cleanup: () => void;
  setSearchActive: (isActive: boolean) => void;
};

const POINTER_INTENT_DISTANCE = 10;

function setAriaDisabled(element: HTMLElement, isDisabled: boolean) {
  element.setAttribute('aria-disabled', String(isDisabled));
}

export function createDistroCoverflowController(dom: DistroSearchDom): DistroCoverflowController | null {
  if (dom.coverflowGroups.length === 0 || !document.documentElement.hasAttribute('data-distro-coverflow-capable')) {
    return null;
  }

  let revision = 0;
  let inFlight: Animation[] | null = null;

  const renderGroup = (group: DistroCoverflowGroup) => {
    group.element.toggleAttribute('data-distro-coverflow-ready', true);
    group.element.dataset.distroCoverflowMode = group.state.mode;
    group.cards.forEach((card, index) => {
      card.toggleAttribute(
        'data-distro-coverflow-selected',
        group.state.mode === 'catalog' && group.state.selectedIndex === index,
      );
      if (group.state.mode === 'preview') {
        card.dataset.distroCoverflowPosition = getDistroCoverflowPosition(index, group.state.activeIndex);
      } else {
        card.removeAttribute('data-distro-coverflow-position');
      }
    });

    if (group.state.mode === 'preview') {
      group.controls.hidden = false;
      group.status.hidden = false;
      group.previousButton.removeAttribute('aria-disabled');
      group.nextButton.removeAttribute('aria-disabled');
      group.toggleButton.textContent = group.toggleButton.dataset.distroCoverflowViewAllLabel || '';
      if (!group.element.hasAttribute('data-distro-coverflow-transitioning')) {
        setAriaDisabled(group.toggleButton, false);
      }
      group.status.textContent = group.cards[group.state.activeIndex]!.getAttribute('aria-label') || '';
      return;
    }

    group.status.textContent = '';
    group.status.hidden = true;
    group.previousButton.removeAttribute('aria-disabled');
    group.nextButton.removeAttribute('aria-disabled');
    group.controls.hidden = group.state.mode === 'search-results';
    group.toggleButton.textContent = 'Show Coverflow';
    if (!group.element.hasAttribute('data-distro-coverflow-transitioning')) {
      setAriaDisabled(group.toggleButton, false);
    }
  };

  const setGroupState = (group: DistroCoverflowGroup, state: DistroCoverflowState) => {
    group.state = state;
    renderGroup(group);
  };

  const clearTransitionState = () => {
    dom.coverflowGroups.forEach((group) => {
      group.element.removeAttribute('data-distro-coverflow-transitioning');
      group.element.removeAttribute('data-distro-coverflow-reveal');
      setAriaDisabled(group.toggleButton, false);
    });
  };

  const cancelTransition = () => {
    revision += 1;
    inFlight?.forEach((animation) => animation.cancel());
    clearTransitionState();
    inFlight = null;
  };

  const runDisclosure = async (group: DistroCoverflowGroup) => {
    if (inFlight || group.state.mode === 'search-results') return;

    const targetState = reduceDistroCoverflowState(group.state, { type: 'toggle' }, group.cards.length);
    const token = ++revision;
    const selectedIndex =
      group.state.mode === 'preview'
        ? group.state.activeIndex
        : group.state.mode === 'catalog'
          ? (group.state.selectedIndex ?? 0)
          : 0;
    const activeCard = group.cards[selectedIndex];

    dom.coverflowGroups.forEach((coverflowGroup) => {
      coverflowGroup.element.toggleAttribute('data-distro-coverflow-transitioning', true);
      setAriaDisabled(coverflowGroup.toggleButton, true);
    });
    inFlight = [];

    try {
      if (targetState.mode === 'catalog') group.element.dataset.distroCoverflowReveal = 'catalog';
      setGroupState(group, targetState);
      if (targetState.mode === 'catalog' && activeCard) {
        activeCard.focus({ preventScroll: true });
        activeCard.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'nearest', inline: 'nearest' });
      }

      const animatedElements = targetState.mode === 'catalog' ? [group.reveal] : group.cards;
      const animations = animatedElements.flatMap((element) => element.getAnimations?.() ?? []);
      inFlight = animations;
      await Promise.allSettled(animations.map((animation) => animation.finished));
    } finally {
      if (revision === token) {
        clearTransitionState();
        inFlight = null;
      }
    }
  };

  const groupListeners = dom.coverflowGroups.map((group) => {
    let pointerIntent: {
      card: HTMLElement;
      moved: boolean;
      pointerId: number;
      startX: number;
      startY: number;
      wasActive: boolean;
    } | null = null;

    const onPointerDown = (event: PointerEvent) => {
      if (group.state.mode !== 'preview' || event.button !== 0) {
        pointerIntent = null;
        return;
      }

      const target =
        event.target instanceof Element ? event.target.closest<HTMLElement>('[data-distro-coverflow-card]') : null;
      const cardIndex = target ? group.cards.indexOf(target) : -1;
      pointerIntent =
        target && cardIndex >= 0
          ? {
              card: target,
              moved: false,
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              wasActive: cardIndex === group.state.activeIndex,
            }
          : null;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointerIntent || pointerIntent.pointerId !== event.pointerId || pointerIntent.moved) return;
      const deltaX = event.clientX - pointerIntent.startX;
      const deltaY = event.clientY - pointerIntent.startY;
      pointerIntent.moved = deltaX * deltaX + deltaY * deltaY > POINTER_INTENT_DISTANCE * POINTER_INTENT_DISTANCE;
    };
    const onPointerCancel = (event: PointerEvent) => {
      if (pointerIntent?.pointerId === event.pointerId) pointerIntent = null;
    };
    const onFocusOut = (event: FocusEvent) => {
      const target =
        event.target instanceof Element ? event.target.closest<HTMLElement>('[data-distro-coverflow-card]') : null;
      if (target && pointerIntent?.card === target) pointerIntent = null;
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      if (target.closest('[data-distro-coverflow-previous]')) {
        if (group.state.mode === 'preview') {
          setGroupState(
            group,
            reduceDistroCoverflowState(group.state, { type: 'move', delta: -1 }, group.cards.length),
          );
        }
        return;
      }
      if (target.closest('[data-distro-coverflow-next]')) {
        if (group.state.mode === 'preview') {
          setGroupState(group, reduceDistroCoverflowState(group.state, { type: 'move', delta: 1 }, group.cards.length));
        }
        return;
      }
      if (
        target.closest('[data-distro-coverflow-toggle]') &&
        group.toggleButton.getAttribute('aria-disabled') !== 'true'
      ) {
        void runDisclosure(group);
        return;
      }

      const card = target.closest<HTMLElement>('[data-distro-coverflow-card]');
      if (group.state.mode !== 'preview' || !card || event.detail === 0 || pointerIntent?.card !== card) return;

      const intent = pointerIntent;
      pointerIntent = null;
      if (!intent.moved && intent.wasActive) return;

      event.preventDefault();
      event.stopPropagation();
      if (intent.moved) return;

      const activeIndex = group.cards.indexOf(card);
      if (activeIndex >= 0) {
        setGroupState(
          group,
          reduceDistroCoverflowState(group.state, { type: 'focus', activeIndex }, group.cards.length),
        );
        card.focus({ preventScroll: true });
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (group.state.mode !== 'preview') return;
      const target =
        event.target instanceof Element ? event.target.closest<HTMLElement>('[data-distro-coverflow-card]') : null;
      if (target && pointerIntent?.card === target) return;
      const activeIndex = target ? group.cards.indexOf(target) : -1;
      if (activeIndex >= 0 && activeIndex !== group.state.activeIndex) {
        setGroupState(
          group,
          reduceDistroCoverflowState(group.state, { type: 'focus', activeIndex }, group.cards.length),
        );
      }
    };

    group.element.addEventListener('click', onClick);
    group.element.addEventListener('focusin', onFocusIn);
    group.element.addEventListener('focusout', onFocusOut);
    group.element.addEventListener('pointercancel', onPointerCancel);
    group.element.addEventListener('pointerdown', onPointerDown);
    group.element.addEventListener('pointermove', onPointerMove);
    renderGroup(group);
    return { group, onClick, onFocusIn, onFocusOut, onPointerCancel, onPointerDown, onPointerMove };
  });

  return {
    setSearchActive(isActive) {
      cancelTransition();
      dom.coverflowGroups.forEach((group) => {
        setGroupState(group, reduceDistroCoverflowState(group.state, { type: 'search', active: isActive }));
      });
    },
    cleanup() {
      cancelTransition();
      groupListeners.forEach(
        ({ group, onClick, onFocusIn, onFocusOut, onPointerCancel, onPointerDown, onPointerMove }) => {
          group.element.removeEventListener('click', onClick);
          group.element.removeEventListener('focusin', onFocusIn);
          group.element.removeEventListener('focusout', onFocusOut);
          group.element.removeEventListener('pointercancel', onPointerCancel);
          group.element.removeEventListener('pointerdown', onPointerDown);
          group.element.removeEventListener('pointermove', onPointerMove);
          group.state = { mode: 'preview', activeIndex: 0 };
          renderGroup(group);
          group.element.removeAttribute('data-distro-coverflow-ready');
        },
      );
    },
  };
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
  const coverflowControllerRef = useRef<DistroCoverflowController | null>(null);
  const domRef = useRef<DistroSearchDom | null>(null);
  const searcherRef = useRef<ReturnType<typeof createExactFirstSearcher<DistroSearchItem>> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const resultState = useMemo(() => getDistroSearchResultState(visibleCount), [visibleCount]);
  const hasActiveSearch = searchQuery.trim().length > 0;

  useEffect(() => {
    const dom = readDistroSearchDom(
      document.querySelector<HTMLElement>('[data-distro-search-root]'),
      document.querySelector<HTMLElement>('[data-distro-format-navigation]'),
    );
    if (!dom) return;

    domRef.current = dom;
    coverflowControllerRef.current = createDistroCoverflowController(dom);
    searcherRef.current = createExactFirstSearcher(dom.items, (item) => item.searchText);
    setTotalCount(dom.items.length);
    setVisibleCount(dom.items.filter((item) => !item.element.hidden).length);
    setIsReady(true);

    return () => {
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

export default StoreDistroSearch;
