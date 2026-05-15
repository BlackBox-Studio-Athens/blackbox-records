import { describe, expect, it, vi } from 'vitest';

import { schedulePlayerModalCloseButtonFocus } from './shell-player-focus';

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

describe('schedulePlayerModalCloseButtonFocus', () => {
  it('focuses the modal close button on the next animation frame', () => {
    const scheduler = createScheduler();
    const closeButton = {
      focus: vi.fn(),
    };

    schedulePlayerModalCloseButtonFocus({
      getCloseButton: () => closeButton,
      scheduler,
    });

    expect(closeButton.focus).not.toHaveBeenCalled();

    scheduler.flush();

    expect(closeButton.focus).toHaveBeenCalledOnce();
  });

  it('allows the close button to be absent when the scheduled frame runs', () => {
    const scheduler = createScheduler();

    schedulePlayerModalCloseButtonFocus({
      getCloseButton: () => null,
      scheduler,
    });

    expect(() => scheduler.flush()).not.toThrow();
  });
});
