import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as React from 'react';
import type * as CheckoutApi from './public-checkout-api';

const hooks = vi.hoisted(() => ({
  cursor: 0,
  slots: [] as unknown[],
  effect: undefined as (() => () => void) | undefined,
  dependencies: [] as unknown[],
  read: vi.fn(),
}));
// Exercise controlled renders, including responses that ignore AbortSignal.
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof React>()),
  useState: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = initial;
    return [
      hooks.slots[index],
      (value: unknown) => {
        hooks.slots[index] = typeof value === 'function' ? value(hooks.slots[index]) : value;
      },
    ];
  },
  useRef: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = { current: initial };
    return hooks.slots[index];
  },
  useEffect: (effect: typeof hooks.effect, dependencies: unknown[]) => {
    hooks.effect = effect;
    hooks.dependencies = dependencies;
  },
}));
vi.mock('./public-checkout-api', async (importOriginal) => ({
  ...(await importOriginal<typeof CheckoutApi>()),
  readDeliveryQuote: hooks.read,
}));
import { useDeliveryQuote } from './DeliverySummary';
import { PublicCheckoutApiError } from './public-checkout-api';

const lines = (quantity: number) => [{ storeItemSlug: 'record', variantId: 'variant_record', quantity }];
let cleanup: (() => void) | undefined;
let previousDependencies: unknown[] | undefined;
function render(quantity: number | null = 1) {
  hooks.cursor = 0;
  const state = useDeliveryQuote(quantity === null ? [] : lines(quantity));
  if (!previousDependencies || hooks.dependencies.some((value, index) => value !== previousDependencies![index])) {
    cleanup?.();
    previousDependencies = hooks.dependencies;
    cleanup = hooks.effect!();
  }
  return state;
}
function deferred() {
  let resolve!: (result: unknown) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  previousDependencies = undefined;
  vi.useRealTimers();
  hooks.slots = [];
  hooks.read.mockReset();
});

describe('delivery quote lifecycle', () => {
  it('requests the first nonempty cart immediately and only once across equivalent renders', async () => {
    vi.useFakeTimers();
    hooks.read.mockResolvedValue({ quote: { totalAmountMinor: 2300 } });
    render();
    expect(hooks.read).toHaveBeenCalledTimes(1);
    expect(hooks.read.mock.calls[0]![0]).toEqual(lines(1));
    render();
    await vi.advanceTimersByTimeAsync(500);
    expect(render().totalDisplay).toBe('€23.00');
    expect(hooks.read).toHaveBeenCalledTimes(1);
  });

  it('requests only settled quantities and ignores late success and failure for an abandoned cart', async () => {
    vi.useFakeTimers();
    const pending = [deferred(), deferred(), deferred()];
    hooks.read
      .mockImplementationOnce(() => pending[0]!.promise)
      .mockImplementationOnce(() => pending[1]!.promise)
      .mockImplementationOnce(() => pending[2]!.promise);
    render(1);
    expect(hooks.read).toHaveBeenCalledTimes(1);
    const firstSignal = hooks.read.mock.calls[0]![1] as AbortSignal;
    await vi.advanceTimersByTimeAsync(100);
    render(2);
    expect(firstSignal.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(249);
    expect(hooks.read).toHaveBeenCalledTimes(1);
    render(3);
    await vi.advanceTimersByTimeAsync(249);
    expect(hooks.read).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(hooks.read.mock.calls[1]![0]).toEqual(lines(3));
    render(3);
    await vi.advanceTimersByTimeAsync(500);
    expect(hooks.read).toHaveBeenCalledTimes(2);
    render(4);
    await vi.advanceTimersByTimeAsync(250);
    pending[2]!.resolve({ quote: { totalAmountMinor: 4000 } });
    await Promise.resolve();
    pending[0]!.resolve({ quote: { totalAmountMinor: 2000 } });
    pending[1]!.reject(new PublicCheckoutApiError(503, 'Unavailable'));
    await Promise.resolve();
    expect(render(4)).toMatchObject({ loading: false, error: null, quote: { totalAmountMinor: 4000 } });
  });

  it.each([0, 408, 429, 500, 503])(
    'recovers from status %i, blocks duplicate retries, and permits another failed retry',
    async (status) => {
      vi.useFakeTimers();
      const pending = deferred();
      hooks.read
        .mockRejectedValueOnce(new PublicCheckoutApiError(status, 'Failed'))
        .mockRejectedValueOnce(new PublicCheckoutApiError(status, 'Still failed'))
        .mockReturnValueOnce(pending.promise);
      render();
      await vi.advanceTimersByTimeAsync(250);
      const failure = render();
      expect(failure).toMatchObject({ loading: false, error: 'temporary', quote: null, totalDisplay: null });
      failure.retry();
      failure.retry();
      expect(render()).toMatchObject({ loading: true, retrying: true, quote: null });
      await vi.advanceTimersByTimeAsync(250);
      const failedAgain = render();
      expect(hooks.read).toHaveBeenCalledTimes(2);
      expect(failedAgain.error).toBe('temporary');
      failedAgain.retry();
      const inFlight = render();
      inFlight.retry();
      await vi.advanceTimersByTimeAsync(250);
      expect(render()).toMatchObject({ loading: true, quote: null, totalDisplay: null });
      expect(hooks.read).toHaveBeenCalledTimes(3);
      pending.resolve({ quote: { totalAmountMinor: 2300 } });
      await Promise.resolve();
      expect(render()).toMatchObject({ loading: false, retrying: false, error: null, totalDisplay: '€23.00' });
      expect(hooks.read.mock.calls.every(([requested]) => JSON.stringify(requested) === JSON.stringify(lines(1)))).toBe(
        true,
      );
    },
  );

  it.each([null, 400, 422])(
    'does not offer a transient retry for an authoritative unavailable cart (%s)',
    async (status) => {
      vi.useFakeTimers();
      if (status === null) hooks.read.mockResolvedValue({ quote: null });
      else hooks.read.mockRejectedValue(new PublicCheckoutApiError(status, 'Invalid cart'));
      render();
      await vi.advanceTimersByTimeAsync(250);
      const state = render();
      expect(state).toMatchObject({ loading: false, error: 'unavailable', quote: null });
      state.retry();
      render();
      await vi.advanceTimersByTimeAsync(500);
      expect(hooks.read).toHaveBeenCalledTimes(1);
    },
  );

  it('invalidates a successful quote immediately when quantities change, including after retry', async () => {
    vi.useFakeTimers();
    hooks.read
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ quote: { totalAmountMinor: 2300 } })
      .mockResolvedValueOnce({ quote: { totalAmountMinor: 4300 } });
    render();
    await vi.advanceTimersByTimeAsync(250);
    render().retry();
    render();
    await vi.advanceTimersByTimeAsync(250);
    expect(render().totalDisplay).toBe('€23.00');
    expect(render(2)).toMatchObject({ loading: true, retrying: false, quote: null, totalDisplay: null });
    await vi.advanceTimersByTimeAsync(250);
    expect(render(2).totalDisplay).toBe('€43.00');
  });

  it('aborts an in-flight retry on cart change and ignores its late response', async () => {
    vi.useFakeTimers();
    const stale = deferred();
    hooks.read
      .mockRejectedValueOnce(new PublicCheckoutApiError(503, 'Failed'))
      .mockReturnValueOnce(stale.promise)
      .mockResolvedValueOnce({ quote: { totalAmountMinor: 4300 } });
    render();
    await vi.advanceTimersByTimeAsync(250);
    render().retry();
    render();
    await vi.advanceTimersByTimeAsync(250);
    render(2);
    expect((hooks.read.mock.calls[1]![1] as AbortSignal).aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(250);
    stale.resolve({ quote: { totalAmountMinor: 2300 } });
    await Promise.resolve();
    expect(render(2)).toMatchObject({ loading: false, totalDisplay: '€43.00' });
  });

  it('does not request an empty cart and ignores responses after unmount', async () => {
    vi.useFakeTimers();
    render(null);
    await vi.advanceTimersByTimeAsync(500);
    expect(hooks.read).not.toHaveBeenCalled();
    const pending = deferred();
    hooks.read.mockReturnValue(pending.promise);
    render();
    expect(hooks.read).toHaveBeenCalledTimes(1);
    cleanup!();
    expect((hooks.read.mock.calls[0]![1] as AbortSignal).aborted).toBe(true);
    const before = [...hooks.slots];
    pending.resolve({ quote: { totalAmountMinor: 2300 } });
    await Promise.resolve();
    expect(hooks.slots).toEqual(before);
  });

  it('cancels a pending quantity timer on unmount', async () => {
    vi.useFakeTimers();
    hooks.read.mockResolvedValue({ quote: { totalAmountMinor: 2300 } });
    render();
    await Promise.resolve();
    render(2);
    cleanup!();
    await vi.advanceTimersByTimeAsync(500);
    expect(hooks.read).toHaveBeenCalledTimes(1);
  });
});
