import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import { connectShellPortalTarget } from './shell-portal-targets';

function createScheduler() {
  const callbacks = new Map<number, FrameRequestCallback>();
  let nextId = 1;

  return {
    cancelAnimationFrame: vi.fn((id: number) => {
      callbacks.delete(id);
    }),
    flush: (id: number, time = 0) => {
      callbacks.get(id)?.(time);
    },
    requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => {
      const id = nextId;
      nextId += 1;
      callbacks.set(id, callback);
      return id;
    }),
  };
}

describe('connectShellPortalTarget', () => {
  it('clears the portal target and skips scheduling when the active route does not match', () => {
    const setTarget = vi.fn();
    const queryTarget = vi.fn();
    const scheduler = createScheduler();

    const disconnect = connectShellPortalTarget({
      activePathname: '/services/',
      queryTarget,
      scheduler,
      setTarget,
      targetPathname: '/artists/',
    });

    expect(disconnect).toBeUndefined();
    expect(setTarget).toHaveBeenCalledWith(null);
    expect(queryTarget).not.toHaveBeenCalled();
    expect(scheduler.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('syncs the portal target immediately and again on the next frame for active routes', () => {
    const firstTarget = { id: 'first' } as HTMLElement;
    const secondTarget = { id: 'second' } as HTMLElement;
    const setTarget = vi.fn();
    const queryTarget = vi
      .fn<() => HTMLElement | null>()
      .mockReturnValueOnce(firstTarget)
      .mockReturnValueOnce(secondTarget);
    const scheduler = createScheduler();

    connectShellPortalTarget({
      activePathname: '/artists/',
      queryTarget,
      scheduler,
      setTarget,
      targetPathname: '/artists/',
    });

    expect(setTarget).toHaveBeenCalledWith(firstTarget);
    expect(scheduler.requestAnimationFrame).toHaveBeenCalledTimes(1);

    scheduler.flush(1);

    expect(setTarget).toHaveBeenLastCalledWith(secondTarget);
  });

  it('cancels the scheduled frame when disconnected', () => {
    const scheduler = createScheduler();
    const disconnect = connectShellPortalTarget({
      activePathname: '/services/',
      queryTarget: vi.fn(),
      scheduler,
      setTarget: vi.fn(),
      targetPathname: '/services/',
    });

    disconnect?.();

    expect(scheduler.cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
});
