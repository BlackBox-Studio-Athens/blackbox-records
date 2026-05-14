import { describe, expect, it, vi } from 'vitest';

import {
  clearRouteLoadingTimer,
  ROUTE_LOADING_RESET_DELAY_MS,
  scheduleRouteLoadingStop,
} from './route-loading-indicator';

function createScheduler() {
  const callbacks = new Map<number, () => void>();
  let nextId = 1;

  return {
    clearTimeout: vi.fn((id: number) => {
      callbacks.delete(id);
    }),
    flush: (id: number) => {
      callbacks.get(id)?.();
    },
    setTimeout: vi.fn((callback: () => void) => {
      const id = nextId;
      nextId += 1;
      callbacks.set(id, callback);
      return id;
    }),
  };
}

describe('route loading indicator timers', () => {
  it('clears an existing route loading timer', () => {
    const scheduler = createScheduler();
    const timerRef = { current: 7 };

    clearRouteLoadingTimer(timerRef, scheduler);

    expect(scheduler.clearTimeout).toHaveBeenCalledWith(7);
    expect(timerRef.current).toBeNull();
  });

  it('does nothing when there is no existing timer', () => {
    const scheduler = createScheduler();
    const timerRef = { current: null };

    clearRouteLoadingTimer(timerRef, scheduler);

    expect(scheduler.clearTimeout).not.toHaveBeenCalled();
    expect(timerRef.current).toBeNull();
  });

  it('schedules route loading to close after the default reset delay', () => {
    const scheduler = createScheduler();
    const setRouteLoading = vi.fn();
    const timerRef = { current: null };

    scheduleRouteLoadingStop({ scheduler, setRouteLoading, timerRef });

    expect(scheduler.setTimeout).toHaveBeenCalledWith(expect.any(Function), ROUTE_LOADING_RESET_DELAY_MS);
    expect(timerRef.current).toBe(1);

    scheduler.flush(1);

    expect(setRouteLoading).toHaveBeenCalledWith(false);
    expect(timerRef.current).toBeNull();
  });

  it('replaces a pending timer before scheduling the next close', () => {
    const scheduler = createScheduler();
    const timerRef = { current: 4 };

    scheduleRouteLoadingStop({ scheduler, setRouteLoading: vi.fn(), timerRef });

    expect(scheduler.clearTimeout).toHaveBeenCalledWith(4);
    expect(timerRef.current).toBe(1);
  });
});
