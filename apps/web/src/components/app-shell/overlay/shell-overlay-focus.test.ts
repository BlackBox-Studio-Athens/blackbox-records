import { describe, expect, it, vi } from 'vitest';

import {
  restoreConnectedOverlayTriggerFocus,
  scheduleOverlayContentFocus,
  scheduleOverlayTriggerFocusRestore,
} from './shell-overlay-focus';

type FakeFocusableElement = Pick<HTMLElement, 'focus' | 'isConnected'> & {
  focus: ReturnType<typeof vi.fn<() => void>>;
};

type FakeScrollContainer = Pick<HTMLElement, 'scrollTo'> & {
  scrollTo: ReturnType<typeof vi.fn<(options: ScrollToOptions) => void>>;
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

function createScrollContainer(): FakeScrollContainer {
  return {
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
      getScrollContainer: () => scrollContainer,
      scheduler,
    });

    scheduler.flush();

    expect(scrollContainer.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
    expect(closeButton.focus).toHaveBeenCalledOnce();
  });
});
