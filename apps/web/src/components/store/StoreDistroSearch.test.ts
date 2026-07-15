import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  applyDistroSearch,
  createDistroCoverflowController,
  getDistroCoverflowPosition,
  getDistroSearchResultState,
  readDistroSearchDom,
  reduceDistroCoverflowState,
  type DistroSearchDom,
} from './StoreDistroSearch';

class FakeElement {
  dataset: Record<string, string> = {};
  focus = vi.fn();
  hidden = false;
  scrollIntoView = vi.fn();
  textContent = '';
  private readonly attributes = new Map<string, string>();
  private animations: Array<{ cancel: () => void; finished: Promise<unknown> }> = [];
  private readonly closestSelectors = new Set<string>();
  private readonly listeners = new Map<string, Set<(event: Record<string, unknown>) => void>>();

  addClosestSelector(selector: string) {
    this.closestSelectors.add(selector);
  }

  addEventListener(type: string, listener: (event: Record<string, unknown>) => void) {
    const listeners = this.listeners.get(type) || new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  closest(selector: string) {
    return this.closestSelectors.has(selector) ? this : null;
  }

  dispatch(type: string, target: FakeElement, init: Record<string, unknown> = {}) {
    const event = {
      button: 0,
      clientX: 0,
      clientY: 0,
      detail: type === 'click' ? 1 : 0,
      pointerId: 1,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      target,
      ...init,
    };
    this.listeners.get(type)?.forEach((listener) => listener(event));
    return event;
  }

  hasAttribute(name: string) {
    return this.attributes.has(name);
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }

  getAnimations() {
    return this.animations;
  }

  listenerCount(type: string) {
    return this.listeners.get(type)?.size || 0;
  }

  removeAttribute(name: string) {
    this.attributes.delete(name);
    if (name.startsWith('data-')) {
      delete this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())];
    }
  }

  removeEventListener(type: string, listener: (event: Record<string, unknown>) => void) {
    this.listeners.get(type)?.delete(listener);
  }

  setAttribute(name: string, value = '') {
    this.attributes.set(name, value);
  }

  setAnimations(animations: Array<{ cancel: () => void; finished: Promise<unknown> }>) {
    this.animations = animations;
  }

  toggleAttribute(name: string, force: boolean) {
    if (force) this.attributes.set(name, '');
    else this.attributes.delete(name);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function createDom() {
  const cards = [new FakeElement(), new FakeElement(), new FakeElement()];
  const chunks = [new FakeElement(), new FakeElement()];
  const groups = [new FakeElement(), new FakeElement()];
  const navigation = new FakeElement();
  const items = cards.map((element, index) => ({
    element: element as unknown as HTMLElement,
    searchText: `item ${index + 1}`,
  }));
  const chunkRecords = [
    { element: chunks[0] as unknown as HTMLElement, items: items.slice(0, 2) },
    { element: chunks[1] as unknown as HTMLElement, items: items.slice(2) },
  ];
  const dom: DistroSearchDom = {
    coverflowGroups: [],
    items,
    chunks: chunkRecords,
    groups: [
      { element: groups[0] as unknown as HTMLElement, chunks: chunkRecords.slice(0, 1) },
      { element: groups[1] as unknown as HTMLElement, chunks: chunkRecords.slice(1) },
    ],
    navigation: navigation as unknown as HTMLElement,
  };

  return { cards, chunks, dom, groups, navigation };
}

function createCoverflowHarness(finished: Promise<unknown> = Promise.resolve()) {
  const section = new FakeElement();
  const controls = new FakeElement();
  const previousButton = new FakeElement();
  const nextButton = new FakeElement();
  const reveal = new FakeElement();
  const toggleButton = new FakeElement();
  const status = new FakeElement();
  const cards = Array.from({ length: 6 }, (_, index) => {
    const card = new FakeElement();
    card.addClosestSelector('[data-distro-coverflow-card]');
    card.setAttribute('aria-label', `Record ${index + 1} — Artist`);
    return card;
  });
  previousButton.addClosestSelector('[data-distro-coverflow-previous]');
  nextButton.addClosestSelector('[data-distro-coverflow-next]');
  toggleButton.addClosestSelector('[data-distro-coverflow-toggle]');
  toggleButton.dataset.distroCoverflowViewAllLabel = 'View all 53';
  status.dataset.distroCoverflowInitialLabel = 'Record 1 — Artist';

  const cancelAnimation = vi.fn();
  reveal.setAnimations([{ cancel: cancelAnimation, finished }]);
  const documentElement = new FakeElement();
  documentElement.toggleAttribute('data-distro-coverflow-capable', true);
  vi.stubGlobal('Element', FakeElement);
  vi.stubGlobal('document', { documentElement });

  const group = {
    cards: cards as unknown as HTMLElement[],
    controls: controls as unknown as HTMLElement,
    element: section as unknown as HTMLElement,
    nextButton: nextButton as unknown as HTMLButtonElement,
    previousButton: previousButton as unknown as HTMLButtonElement,
    reveal: reveal as unknown as HTMLElement,
    state: { mode: 'preview', activeIndex: 0 } as const,
    status: status as unknown as HTMLElement,
    toggleButton: toggleButton as unknown as HTMLButtonElement,
  };
  const controller = createDistroCoverflowController({
    chunks: [],
    coverflowGroups: [group],
    groups: [],
    items: [],
    navigation: null,
  });

  return {
    cards,
    cancelAnimation,
    controller: controller!,
    controls,
    group,
    nextButton,
    previousButton,
    section,
    status,
    toggleButton,
  };
}

describe('Distro search DOM filtering', () => {
  it('leaves the document untouched when no catalog root exists', () => {
    expect(readDistroSearchDom(null)).toBeNull();
  });

  it('hides unmatched cards and empty chunks and groups without changing order', () => {
    const { cards, chunks, dom, groups } = createDom();
    const originalOrder = dom.items.slice();

    const visibleCount = applyDistroSearch(dom, new Set([dom.items[2]!.element]));

    expect(visibleCount).toBe(1);
    expect(cards.map((card) => card.hasAttribute('data-distro-search-hidden'))).toEqual([false, false, false]);
    expect(chunks.map((chunk) => chunk.hasAttribute('data-distro-search-hidden'))).toEqual([false, false]);
    expect(groups.map((group) => group.hasAttribute('data-distro-search-hidden'))).toEqual([true, false]);
    expect(dom.items).toEqual(originalOrder);
  });

  it('hides unmatched cards inside a chunk that remains visible', () => {
    const { cards, chunks, dom } = createDom();

    applyDistroSearch(dom, new Set([dom.items[0]!.element]));

    expect(cards.map((card) => card.hasAttribute('data-distro-search-hidden'))).toEqual([false, true, false]);
    expect(chunks.map((chunk) => chunk.hasAttribute('data-distro-search-hidden'))).toEqual([false, false]);
  });

  it('clears only search-authored hidden state and restores format navigation on clear or cleanup', () => {
    const { cards, dom, navigation } = createDom();
    cards[2]!.hidden = true;

    applyDistroSearch(dom, new Set([dom.items[0]!.element]));
    expect(navigation.hidden).toBe(true);

    const visibleCount = applyDistroSearch(dom, null);

    expect(visibleCount).toBe(2);
    expect(navigation.hidden).toBe(false);
    expect(cards.map((card) => card.hidden)).toEqual([false, false, true]);
    expect(cards.some((card) => card.hasAttribute('data-distro-search-hidden'))).toBe(false);
  });

  it('reports zero results as an empty state and pluralizes the count', () => {
    expect(getDistroSearchResultState(0)).toEqual({ isEmpty: true, visibleLabel: '0 items' });
    expect(getDistroSearchResultState(1)).toEqual({ isEmpty: false, visibleLabel: '1 item' });
  });
});

describe('Distro Coverflow state', () => {
  it('leaves the full catalog untouched when 3D transforms are unavailable', () => {
    vi.stubGlobal('document', { documentElement: new FakeElement() });

    expect(
      createDistroCoverflowController({
        chunks: [],
        coverflowGroups: [{}] as DistroSearchDom['coverflowGroups'],
        groups: [],
        items: [],
        navigation: null,
      }),
    ).toBeNull();
  });

  it('wraps navigation and promotes focused cards', () => {
    expect(reduceDistroCoverflowState({ mode: 'preview', activeIndex: 0 }, { type: 'move', delta: -1 })).toEqual({
      mode: 'preview',
      activeIndex: 5,
    });
    expect(reduceDistroCoverflowState({ mode: 'preview', activeIndex: 5 }, { type: 'move', delta: 1 })).toEqual({
      mode: 'preview',
      activeIndex: 0,
    });
    expect(reduceDistroCoverflowState({ mode: 'preview', activeIndex: 1 }, { type: 'focus', activeIndex: 4 })).toEqual({
      mode: 'preview',
      activeIndex: 4,
    });
  });

  it('mounts, navigates, focuses, and toggles the catalog through the real controller', async () => {
    const { cards, controller, nextButton, previousButton, section, status, toggleButton } = createCoverflowHarness();

    expect(section.dataset.distroCoverflowMode).toBe('preview');
    expect(status.textContent).toBe('Record 1 — Artist');
    expect(status.hidden).toBe(false);
    expect(previousButton.getAttribute('aria-disabled')).toBeNull();
    expect(nextButton.getAttribute('aria-disabled')).toBeNull();

    section.dispatch('click', previousButton);
    expect(cards[5]!.dataset.distroCoverflowPosition).toBe('active');
    section.dispatch('click', nextButton);
    expect(cards[0]!.dataset.distroCoverflowPosition).toBe('active');
    section.dispatch('click', nextButton);
    expect(cards[1]!.dataset.distroCoverflowPosition).toBe('active');
    section.dispatch('focusin', cards[3]!);
    expect(status.textContent).toBe('Record 4 — Artist');

    section.dispatch('click', toggleButton);
    await Promise.resolve();
    expect(section.dataset.distroCoverflowMode).toBe('catalog');
    expect(toggleButton.textContent).toBe('Show Coverflow');
    expect(status.hidden).toBe(true);
    expect(cards[3]!.hasAttribute('data-distro-coverflow-selected')).toBe(true);
    expect(cards[3]!.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(cards[3]!.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'instant',
      block: 'nearest',
      inline: 'nearest',
    });

    await Promise.resolve();
    section.dispatch('click', toggleButton);
    await Promise.resolve();
    expect(section.dataset.distroCoverflowMode).toBe('preview');
    expect(cards[3]!.dataset.distroCoverflowPosition).toBe('active');
    controller.cleanup();
  });

  it('selects a side cover on first pointer click and suppresses activation after scroll movement', () => {
    const { cards, controller, section, status } = createCoverflowHarness();

    section.dispatch('pointerdown', cards[1]!, { clientX: 20, clientY: 20 });
    section.dispatch('focusin', cards[1]!);
    expect(status.textContent).toBe('Record 1 — Artist');

    const selectionClick = section.dispatch('click', cards[1]!);
    expect(selectionClick.preventDefault).toHaveBeenCalledOnce();
    expect(selectionClick.stopPropagation).toHaveBeenCalledOnce();
    expect(cards[1]!.dataset.distroCoverflowPosition).toBe('active');

    section.dispatch('pointerdown', cards[1]!, { clientX: 20, clientY: 20 });
    const activeClick = section.dispatch('click', cards[1]!);
    expect(activeClick.preventDefault).not.toHaveBeenCalled();

    section.dispatch('pointerdown', cards[2]!, { clientX: 20, clientY: 20 });
    section.dispatch('pointermove', cards[2]!, { clientX: 20, clientY: 35 });
    const scrolledClick = section.dispatch('click', cards[2]!);
    expect(scrolledClick.preventDefault).toHaveBeenCalledOnce();
    expect(cards[1]!.dataset.distroCoverflowPosition).toBe('active');

    section.dispatch('pointerdown', cards[2]!, { clientX: 20, clientY: 20 });
    section.dispatch('focusin', cards[2]!);
    section.dispatch('focusout', cards[2]!);
    section.dispatch('focusin', cards[2]!);
    expect(cards[2]!.dataset.distroCoverflowPosition).toBe('active');
    controller.cleanup();
  });

  it('serializes disclosure and lets search interruption and cleanup win', async () => {
    let finishTransition!: () => void;
    const finished = new Promise<void>((resolve) => {
      finishTransition = resolve;
    });
    const { cancelAnimation, controller, controls, section, status, toggleButton } = createCoverflowHarness(finished);

    section.dispatch('click', toggleButton);
    section.dispatch('click', toggleButton);
    expect(toggleButton.getAttribute('aria-disabled')).toBe('true');

    controller.setSearchActive(true);
    expect(cancelAnimation).toHaveBeenCalledOnce();
    expect(section.dataset.distroCoverflowMode).toBe('search-results');
    expect(controls.hidden).toBe(true);
    expect(status.hidden).toBe(true);

    expect(section.listenerCount('click')).toBe(1);
    controller.cleanup();
    expect(section.listenerCount('click')).toBe(0);
    expect(section.listenerCount('focusin')).toBe(0);
    expect(section.listenerCount('pointerdown')).toBe(0);
    expect(section.listenerCount('pointermove')).toBe(0);
    expect(section.dataset.distroCoverflowMode).toBe('preview');

    finishTransition();
    await finished;
  });

  it('keeps search, clear, and disclosure transitions exclusive', () => {
    const preview = { mode: 'preview', activeIndex: 3 } as const;
    const searching = reduceDistroCoverflowState(preview, { type: 'search', active: true });

    expect(searching).toEqual({ mode: 'search-results' });
    expect(reduceDistroCoverflowState(searching, { type: 'toggle' })).toEqual(searching);
    expect(reduceDistroCoverflowState(searching, { type: 'search', active: false })).toEqual({ mode: 'catalog' });
    expect(reduceDistroCoverflowState(preview, { type: 'toggle' })).toEqual({ mode: 'catalog', selectedIndex: 3 });
    expect(reduceDistroCoverflowState({ mode: 'catalog', selectedIndex: 3 }, { type: 'toggle' })).toEqual({
      mode: 'preview',
      activeIndex: 3,
    });
  });

  it('assigns the six visual positions without reordering cards', () => {
    expect(Array.from({ length: 6 }, (_, index) => getDistroCoverflowPosition(index, 0))).toEqual([
      'active',
      'right-near',
      'right-far',
      'back',
      'left-far',
      'left-near',
    ]);
    expect(Array.from({ length: 6 }, (_, index) => getDistroCoverflowPosition(index, 2))).toEqual([
      'left-far',
      'left-near',
      'active',
      'right-near',
      'right-far',
      'back',
    ]);
  });
});
