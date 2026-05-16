import { describe, expect, it, vi } from 'vitest';

import { restoreConnectedPlayerTriggerFocus, schedulePlayerModalCloseButtonFocus } from './shell-player-focus';

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

describe('restoreConnectedPlayerTriggerFocus', () => {
  it('focuses a connected player trigger', () => {
    const triggerElement = {
      focus: vi.fn(),
      isConnected: true,
    };

    restoreConnectedPlayerTriggerFocus(triggerElement);

    expect(triggerElement.focus).toHaveBeenCalledOnce();
  });

  it('does not focus a disconnected player trigger', () => {
    const triggerElement = {
      focus: vi.fn(),
      isConnected: false,
    };

    restoreConnectedPlayerTriggerFocus(triggerElement);

    expect(triggerElement.focus).not.toHaveBeenCalled();
  });
});
