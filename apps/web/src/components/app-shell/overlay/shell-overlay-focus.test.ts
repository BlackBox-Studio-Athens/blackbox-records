import { describe, expect, it, vi } from 'vitest';

import {
  findStoreCartFocusReturnTarget,
  resolveStoreCartOpener,
  restoreConnectedOverlayTriggerFocus,
  scheduleOverlayContentFocus,
  scheduleOverlayTriggerFocusRestore,
} from './shell-overlay-focus';

type FakeFocusableElement = Pick<HTMLElement, 'focus' | 'isConnected'> & {
  focus: ReturnType<typeof vi.fn<() => void>>;
};

type FakeScrollContainer = Pick<HTMLElement, 'scrollTo' | 'isConnected'> & {
  scrollTo: ReturnType<typeof vi.fn<(options: ScrollToOptions) => void>>;
  contains: (node: unknown) => boolean;
  ownerDocument: { activeElement: unknown };
};

function createScheduler() {
  const callbacks = new Map<number, FrameRequestCallback>();
  let nextId = 1;

  return {
    flush: (id = nextId - 1) => {
      callbacks.get(id)?.(performance.now());
    },
    requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => {
      const id = nextId;
      nextId += 1;
      callbacks.set(id, callback);
      return id;
    }),
  };
}

function createFocusableElement({ isConnected = true } = {}): FakeFocusableElement {
  return {
    focus: vi.fn<() => void>(),
    isConnected,
  };
}

const detailLink = { id: 'detail-link' };

function createScrollContainer(): FakeScrollContainer {
  return {
    contains: (node) => node === detailLink,
    isConnected: true,
    ownerDocument: { activeElement: null },
    scrollTo: vi.fn<(options: ScrollToOptions) => void>(),
  };
}

describe('restoreConnectedOverlayTriggerFocus', () => {
  it('focuses a connected trigger element', () => {
    const triggerElement = createFocusableElement();

    restoreConnectedOverlayTriggerFocus(triggerElement);

    expect(triggerElement.focus).toHaveBeenCalledOnce();
  });

  it('does not focus a disconnected trigger element', () => {
    const triggerElement = createFocusableElement({ isConnected: false });

    restoreConnectedOverlayTriggerFocus(triggerElement);

    expect(triggerElement.focus).not.toHaveBeenCalled();
  });
});

describe('overlay focus scheduling', () => {
  it('does not focus or scroll a connected exit panel after its overlay closes', () => {
    const scheduler = createScheduler();
    const closeButton = createFocusableElement();
    const scrollContainer = createScrollContainer();
    let open = true;
    scheduleOverlayContentFocus({
      getCloseButton: () => closeButton,
      getScrollContainer: () => scrollContainer as unknown as HTMLElement,
      isOverlayOpen: () => open,
      scheduler,
    });
    open = false;
    scheduler.flush();
    expect(scrollContainer.scrollTo).not.toHaveBeenCalled();
    expect(closeButton.focus).not.toHaveBeenCalled();
  });
  it('restores trigger focus on the next animation frame', () => {
    const scheduler = createScheduler();
    const triggerElement = createFocusableElement();

    scheduleOverlayTriggerFocusRestore({
      getTriggerElement: () => triggerElement,
      scheduler,
    });

    expect(triggerElement.focus).not.toHaveBeenCalled();

    scheduler.flush();

    expect(triggerElement.focus).toHaveBeenCalledOnce();
  });

  it('scrolls the overlay to the top and focuses the close button on the next animation frame', () => {
    const scheduler = createScheduler();
    const closeButton = createFocusableElement();
    const scrollContainer = createScrollContainer();

    scheduleOverlayContentFocus({
      getCloseButton: () => closeButton,
      getScrollContainer: () => scrollContainer as unknown as HTMLElement,
      scheduler,
    });

    scheduler.flush();

    expect(scrollContainer.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
    expect(closeButton.focus).toHaveBeenCalledOnce();
    expect(closeButton.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('keeps focus and scroll the shopper already moved into the detail', () => {
    const scheduler = createScheduler();
    const closeButton = createFocusableElement();
    const scrollContainer = createScrollContainer();

    scheduleOverlayContentFocus({
      getCloseButton: () => closeButton,
      getScrollContainer: () => scrollContainer as unknown as HTMLElement,
      scheduler,
    });
    scrollContainer.ownerDocument.activeElement = detailLink;
    scheduler.flush();

    expect(scrollContainer.scrollTo).not.toHaveBeenCalled();
    expect(closeButton.focus).not.toHaveBeenCalled();
  });

  it.each(['removed', 'disconnected'] as const)('does not move the page after the overlay is %s', (state) => {
    const scheduler = createScheduler();
    const closeButton = createFocusableElement();
    const scrollContainer = createScrollContainer();
    let currentContainer: FakeScrollContainer | null = scrollContainer;
    const scrollDocument = vi.fn();
    vi.stubGlobal('window', { scrollTo: scrollDocument });

    try {
      scheduleOverlayContentFocus({
        getCloseButton: () => closeButton,
        getScrollContainer: () => currentContainer as unknown as HTMLElement | null,
        scheduler,
      });
      if (state === 'removed') currentContainer = null;
      else Object.assign(scrollContainer, { isConnected: false });

      scheduler.flush();

      expect(scrollDocument).not.toHaveBeenCalled();
      expect(scrollContainer.scrollTo).not.toHaveBeenCalled();
      expect(closeButton.focus).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('findStoreCartFocusReturnTarget', () => {
  function createRoot(elements: Record<string, object>) {
    return {
      querySelector: <ElementType extends Element = Element>(selector: string) =>
        (elements[selector] ?? null) as ElementType | null,
    };
  }

  it('returns focus to the header cart control when it is rendered', () => {
    const trigger = { id: 'trigger' };
    const main = { id: 'main' };

    expect(
      findStoreCartFocusReturnTarget(
        createRoot({ '[data-store-cart-trigger]': trigger, 'main[data-app-shell-main]': main }),
      ),
    ).toBe(trigger);
  });

  it('returns focus to the control that opened the drawer while it is still connected', () => {
    const opener = createFocusableElement();
    const trigger = { id: 'trigger' };

    expect(findStoreCartFocusReturnTarget(createRoot({ '[data-store-cart-trigger]': trigger }), opener)).toBe(opener);
    expect(
      findStoreCartFocusReturnTarget(
        createRoot({ '[data-store-cart-trigger]': trigger }),
        createFocusableElement({ isConnected: false }),
      ),
    ).toBe(trigger);
  });

  it('falls back to the main landmark when the cart control is not rendered', () => {
    const main = { id: 'main' };

    expect(findStoreCartFocusReturnTarget(createRoot({ 'main[data-app-shell-main]': main }))).toBe(main);
  });
});

describe('resolveStoreCartOpener', () => {
  const body = { id: 'body' } as unknown as Element;
  const focused = { id: 'focused' } as unknown as Element;

  it('prefers the tapped cart control, which iOS Safari leaves unfocused', () => {
    const buy = { id: 'buy' };
    const closest = vi.fn(() => buy);

    expect(resolveStoreCartOpener({ closest } as unknown as EventTarget, body, body)).toBe(buy);
    expect(closest).toHaveBeenCalledWith(
      '[data-store-card-buy], [data-store-item-add-to-cart], [data-store-cart-trigger]',
    );
  });

  it('falls back to the focused element, never the body', () => {
    const unrelated = { closest: () => null } as unknown as EventTarget;

    expect(resolveStoreCartOpener(unrelated, focused, body)).toBe(focused);
    expect(resolveStoreCartOpener(null, focused, body)).toBe(focused);
    expect(resolveStoreCartOpener(null, body, body)).toBeNull();
  });
});
