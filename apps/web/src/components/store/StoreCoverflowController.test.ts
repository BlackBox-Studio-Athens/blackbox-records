import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  advanceStoreCoverflowWheelGesture,
  createStoreCoverflowController,
  ensureStoreCoverflowCapability,
  getStoreCoverflowPosition,
  getStoreCoverflowSwipeDelta,
  getStoreCoverflowWheelDelta,
  readStoreCoverflowDom,
  reduceStoreCoverflowState,
  type StoreCoverflowDom,
} from './StoreCoverflowController';

afterEach(() => {
  vi.unstubAllGlobals();
});

class FakeElement {
  clientWidth = 320;
  dataset: Record<string, string> = {};
  focus = vi.fn();
  hidden = false;
  releasePointerCapture = vi.fn();
  scrollIntoView = vi.fn();
  setPointerCapture = vi.fn();
  textContent = '';
  private readonly attributes = new Map<string, string>();
  private animations: Array<{ cancel: () => void; finished: Promise<unknown> }> = [];
  private readonly closestSelectors = new Set<string>();
  private readonly listeners = new Map<string, Set<(event: Record<string, unknown>) => void>>();
  private readonly styles = new Map<string, string>();
  style = {
    getPropertyValue: (name: string) => this.styles.get(name) || '',
    removeProperty: (name: string) => this.styles.delete(name),
    setProperty: (name: string, value: string) => this.styles.set(name, value),
  };

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
      deltaMode: 0,
      deltaX: 0,
      deltaY: 0,
      detail: type === 'click' ? 1 : 0,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
      preventDefault: vi.fn(),
      shiftKey: false,
      stopPropagation: vi.fn(),
      target,
      timeStamp: 1,
      ...init,
    };
    this.listeners.get(type)?.forEach((listener) => listener(event));
    return event;
  }

  getAnimations() {
    return this.animations;
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }

  hasAttribute(name: string) {
    return this.attributes.has(name);
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

  setAnimations(animations: Array<{ cancel: () => void; finished: Promise<unknown> }>) {
    this.animations = animations;
  }

  setAttribute(name: string, value = '') {
    this.attributes.set(name, value);
  }

  toggleAttribute(name: string, force: boolean) {
    if (force) this.attributes.set(name, '');
    else this.attributes.delete(name);
  }
}

function createHarness(cardCount = 8) {
  const element = new FakeElement();
  const stage = new FakeElement();
  const controls = new FakeElement();
  const currentValue = new FakeElement();
  const disclosureRail = new FakeElement();
  const nextButton = new FakeElement();
  const previousButton = new FakeElement();
  const remainingValue = new FakeElement();
  const reveal = new FakeElement();
  const status = new FakeElement();
  const summary = new FakeElement();
  const toggleButton = new FakeElement();
  const cards = Array.from({ length: cardCount }, (_, index) => {
    const card = new FakeElement();
    card.addClosestSelector('[data-store-coverflow-card]');
    card.setAttribute('aria-label', `Record ${index + 1} — Artist`);
    if (index < 6) card.dataset.storeCoverflowPosition = getStoreCoverflowPosition(index, 0, cardCount)!;
    return card;
  });
  previousButton.addClosestSelector('[data-store-coverflow-previous]');
  nextButton.addClosestSelector('[data-store-coverflow-next]');
  toggleButton.addClosestSelector('[data-store-coverflow-toggle]');
  toggleButton.dataset.storeCoverflowViewAllLabel = `View all ${cardCount}`;
  disclosureRail.setAnimations([{ cancel: vi.fn(), finished: Promise.resolve() }]);
  reveal.setAnimations([{ cancel: vi.fn(), finished: Promise.resolve() }]);
  const documentElement = new FakeElement();
  documentElement.toggleAttribute('data-store-coverflow-capable', true);
  vi.stubGlobal('Element', FakeElement);

  const dom = {
    groups: [
      {
        cards,
        controls,
        currentValue,
        disclosureRail,
        element,
        nextButton,
        positionedCards: new Set(cards.slice(0, 6)),
        previousButton,
        remainingValue,
        reveal,
        selectedCard: null,
        stage,
        state: { mode: 'preview', activeIndex: 0 },
        status,
        summary,
        toggleButton,
      },
    ],
  } as unknown as StoreCoverflowDom;
  const controller = createStoreCoverflowController(dom, documentElement as unknown as HTMLElement)!;

  return { cards, controller, element, nextButton, previousButton, stage, status, toggleButton };
}

describe('Store Coverflow helpers', () => {
  it('rechecks browser capability for each route activation', () => {
    const documentElement = new FakeElement();
    expect(ensureStoreCoverflowCapability(documentElement as unknown as HTMLElement, { supports: () => true })).toBe(
      true,
    );
    expect(documentElement.hasAttribute('data-store-coverflow-capable')).toBe(true);
    expect(ensureStoreCoverflowCapability(documentElement as unknown as HTMLElement, { supports: () => false })).toBe(
      false,
    );
    expect(documentElement.hasAttribute('data-store-coverflow-capable')).toBe(false);
  });

  it('wraps the complete canonical sequence and positions only six items', () => {
    expect(reduceStoreCoverflowState({ mode: 'preview', activeIndex: 0 }, { type: 'move', delta: -1 }, 53)).toEqual({
      mode: 'preview',
      activeIndex: 52,
    });
    expect(
      Array.from({ length: 53 }, (_, index) => getStoreCoverflowPosition(index, 0, 53)).filter(Boolean),
    ).toHaveLength(6);
  });

  it('recognizes only deliberate horizontal touch swipes', () => {
    expect(getStoreCoverflowSwipeDelta(-40, 20)).toBe(1);
    expect(getStoreCoverflowSwipeDelta(40, 20)).toBe(-1);
    expect(getStoreCoverflowSwipeDelta(39, 0)).toBe(0);
    expect(getStoreCoverflowSwipeDelta(50, 45)).toBe(0);
  });

  it('normalizes dominant wheel axes and preserves residual intent across a repeat gate', () => {
    expect(getStoreCoverflowWheelDelta({ deltaMode: 0, deltaX: 50, deltaY: 10, shiftKey: false }, 320)).toBe(50);
    expect(getStoreCoverflowWheelDelta({ deltaMode: 1, deltaX: 3, deltaY: 0, shiftKey: false }, 320)).toBe(48);
    expect(getStoreCoverflowWheelDelta({ deltaMode: 2, deltaX: -1, deltaY: 0, shiftKey: false }, 320)).toBe(-320);
    expect(getStoreCoverflowWheelDelta({ deltaMode: 0, deltaX: 0, deltaY: 48, shiftKey: false }, 320)).toBe(48);
    expect(getStoreCoverflowWheelDelta({ deltaMode: 0, deltaX: 0, deltaY: -52, shiftKey: true }, 320)).toBe(-52);
    expect(getStoreCoverflowWheelDelta({ deltaMode: 0, deltaX: 12, deltaY: 0, shiftKey: false }, 320)).toBe(12);
    expect(getStoreCoverflowWheelDelta({ deltaMode: 0, deltaX: 0, deltaY: 0, shiftKey: false }, 320)).toBeNull();

    const initial = { accumulatedDelta: 0, direction: 0 as const, lastEventAt: null, lastMoveAt: null };
    const first = advanceStoreCoverflowWheelGesture(initial, 30, 10);
    const moved = advanceStoreCoverflowWheelGesture(first.state, 20, 20);
    const residual = advanceStoreCoverflowWheelGesture(moved.state, 60, 130);
    const repeated = advanceStoreCoverflowWheelGesture(residual.state, 48, 260);
    const reversed = advanceStoreCoverflowWheelGesture(repeated.state, -48, 280);
    const afterGap = advanceStoreCoverflowWheelGesture(repeated.state, 48, 500);
    expect(first.move).toBe(0);
    expect(moved.move).toBe(1);
    expect(residual.move).toBe(0);
    expect(repeated.move).toBe(1);
    expect(reversed.move).toBe(-1);
    expect(afterGap.move).toBe(1);
    expect(moved.state.accumulatedDelta).toBe(2);
    expect(residual.state.accumulatedDelta).toBe(62);
  });

  it('allows repeated moves, gates only until 120ms, and resets after a 160ms gap or reversal', () => {
    const initial = { accumulatedDelta: 0, direction: 0 as const, lastEventAt: null, lastMoveAt: null };
    const first = advanceStoreCoverflowWheelGesture(initial, 48, 0);
    const gated = advanceStoreCoverflowWheelGesture(first.state, 48, 100);
    const afterGate = advanceStoreCoverflowWheelGesture(gated.state, 1, 120);
    const afterLongGap = advanceStoreCoverflowWheelGesture(afterGate.state, 1, 281);
    const reversed = advanceStoreCoverflowWheelGesture(afterLongGap.state, -48, 300);

    expect(first.move).toBe(1);
    expect(gated.move).toBe(0);
    expect(afterGate.move).toBe(1);
    expect(afterLongGap.move).toBe(0);
    expect(reversed.move).toBe(-1);
    expect(afterLongGap.state.accumulatedDelta).toBe(1);
  });

  it('rejects incomplete Coverflow markup', () => {
    const malformedGroup = {
      dataset: {},
      querySelector: () => null,
      querySelectorAll: () => [],
    };
    const root = {
      querySelectorAll: () => [malformedGroup],
    } as unknown as ParentNode;

    expect(readStoreCoverflowDom(null)).toBeNull();
    expect(readStoreCoverflowDom(root)).toBeNull();
  });
});

describe('Store Coverflow controller', () => {
  it('navigates, selects side covers, and cleans up listeners', () => {
    const { cards, controller, element, nextButton, stage, status, toggleButton } = createHarness();

    element.dispatch('click', nextButton);
    expect(cards[1]!.dataset.storeCoverflowPosition).toBe('active');
    expect(cards.filter((card) => card.dataset.storeCoverflowPosition)).toHaveLength(6);
    expect(status.textContent).toBe('Record 2 — Artist');
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');

    stage.dispatch('pointerdown', cards[2]!, { clientX: 10, clientY: 10 });
    const selection = element.dispatch('click', cards[2]!);
    expect(selection.preventDefault).toHaveBeenCalledOnce();
    expect(cards[2]!.dataset.storeCoverflowPosition).toBe('active');

    controller.cleanup();
    expect(element.listenerCount('click')).toBe(0);
    expect(stage.listenerCount('wheel')).toBe(0);
  });

  it('handles touch and intentional wheel without consuming vertical wheel input', () => {
    const { cards, controller, element, stage } = createHarness();

    stage.dispatch('pointerdown', cards[0]!, { clientX: 80, clientY: 20, pointerType: 'touch' });
    stage.dispatch('pointermove', cards[0]!, { clientX: 20, clientY: 25, pointerType: 'touch' });
    const pointerUp = stage.dispatch('pointerup', cards[0]!, { clientX: 20, clientY: 25, pointerType: 'touch' });
    expect(pointerUp.preventDefault).toHaveBeenCalledOnce();
    expect(cards[1]!.dataset.storeCoverflowPosition).toBe('active');
    const syntheticClick = element.dispatch('click', cards[0]!);
    expect(syntheticClick.preventDefault).toHaveBeenCalledOnce();

    stage.dispatch('pointerdown', cards[2]!, { clientX: 20, clientY: 20, pointerType: 'touch' });
    stage.dispatch('pointerup', cards[2]!, { clientX: 20, clientY: 20, pointerType: 'touch' });
    const sideTap = element.dispatch('click', cards[2]!);
    expect(sideTap.preventDefault).toHaveBeenCalledOnce();
    expect(cards[2]!.dataset.storeCoverflowPosition).toBe('active');

    const verticalWheel = stage.dispatch('wheel', stage, { deltaY: 48, timeStamp: 200 });
    expect(verticalWheel.preventDefault).toHaveBeenCalledOnce();
    expect(cards[3]!.dataset.storeCoverflowPosition).toBe('active');
    const horizontalWheel = stage.dispatch('wheel', stage, { deltaX: 48, deltaY: 2, timeStamp: 400 });
    expect(horizontalWheel.preventDefault).toHaveBeenCalledOnce();
    expect(cards[4]!.dataset.storeCoverflowPosition).toBe('active');
    const ctrlWheel = stage.dispatch('wheel', stage, { deltaY: 48, ctrlKey: true, timeStamp: 500 });
    expect(ctrlWheel.preventDefault).not.toHaveBeenCalled();
    expect(cards[4]!.dataset.storeCoverflowPosition).toBe('active');

    controller.cleanup();
  });

  it('handles focus-scoped arrow keys, follows card focus, retains control focus, and cleans up', () => {
    const { cards, controller, element, nextButton } = createHarness();

    const rightArrow = element.dispatch('keydown', cards[0]!, { key: 'ArrowRight' });
    expect(rightArrow.preventDefault).toHaveBeenCalledOnce();
    expect(cards[1]!.dataset.storeCoverflowPosition).toBe('active');
    expect(cards[1]!.focus).toHaveBeenCalledWith({ preventScroll: true });

    const leftArrow = element.dispatch('keydown', cards[1]!, { key: 'ArrowLeft' });
    expect(leftArrow.preventDefault).toHaveBeenCalledOnce();
    expect(cards[0]!.dataset.storeCoverflowPosition).toBe('active');

    const wrapped = element.dispatch('keydown', cards[0]!, { key: 'ArrowLeft' });
    expect(wrapped.preventDefault).toHaveBeenCalledOnce();
    expect(cards[7]!.dataset.storeCoverflowPosition).toBe('active');

    const modified = element.dispatch('keydown', cards[7]!, { key: 'ArrowRight', shiftKey: true });
    expect(modified.preventDefault).not.toHaveBeenCalled();
    expect(cards[7]!.dataset.storeCoverflowPosition).toBe('active');

    const controlArrow = element.dispatch('keydown', nextButton, { key: 'ArrowRight' });
    expect(controlArrow.preventDefault).toHaveBeenCalledOnce();
    expect(cards[0]!.dataset.storeCoverflowPosition).toBe('active');
    expect(nextButton.focus).not.toHaveBeenCalled();

    element.dispatch('click', nextButton);
    element.dispatch('keydown', nextButton, { key: 'ArrowRight' });
    expect(element.dataset.storeCoverflowMode).toBe('preview');

    controller.setSearchActive(true);
    const searchArrow = element.dispatch('keydown', nextButton, { key: 'ArrowRight' });
    expect(searchArrow.preventDefault).not.toHaveBeenCalled();
    controller.setSearchActive(false);
    controller.cleanup();
    expect(element.listenerCount('keydown')).toBe(0);
  });

  it('keeps disclosure and search modes exclusive', async () => {
    const { cards, controller, element, toggleButton } = createHarness();

    element.dispatch('click', toggleButton);
    await Promise.resolve();
    await Promise.resolve();
    expect(element.dataset.storeCoverflowMode).toBe('catalog');
    expect(cards[0]!.hasAttribute('data-store-coverflow-selected')).toBe(true);
    expect(toggleButton.getAttribute('aria-expanded')).toBe('true');

    controller.setSearchActive(true);
    expect(element.dataset.storeCoverflowMode).toBe('search-results');
    controller.setSearchActive(false);
    expect(element.dataset.storeCoverflowMode).toBe('catalog');
    controller.cleanup();
  });
});
