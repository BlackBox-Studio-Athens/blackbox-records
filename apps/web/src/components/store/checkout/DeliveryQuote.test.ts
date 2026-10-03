import { afterEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({
  effect: undefined as (() => () => void) | undefined,
  result: null as unknown,
  read: vi.fn(),
}));
vi.mock('react', () => ({
  useState: () => [
    hooks.result,
    (result: unknown) => {
      hooks.result = result;
    },
  ],
  useEffect: (effect: typeof hooks.effect) => {
    hooks.effect = effect;
  },
}));
vi.mock('./public-checkout-api', () => ({ readDeliveryQuote: hooks.read }));
import { useDeliveryQuote } from './DeliverySummary';

afterEach(() => {
  vi.useRealTimers();
  hooks.result = null;
  hooks.read.mockReset();
});

describe('delivery quote lifecycle', () => {
  it('requests only settled quantities, aborts stale work, and keeps the latest result', async () => {
    vi.useFakeTimers();
    const lines = (quantity: number) => [{ storeItemSlug: 'record', variantId: 'variant_record', quantity }];
    const pending: Array<(result: unknown) => void> = [];
    hooks.read.mockImplementation(
      () =>
        new Promise((resolve) => {
          pending.push(resolve);
        }),
    );
    const activate = (quantity: number) => {
      const state = useDeliveryQuote(lines(quantity));
      expect(state.loading).toBe(true);
      return hooks.effect!()!;
    };
    let cleanup = activate(1);
    await vi.advanceTimersByTimeAsync(100);
    cleanup();
    cleanup = activate(2);
    await vi.advanceTimersByTimeAsync(249);
    expect(hooks.read).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(hooks.read).toHaveBeenCalledTimes(1);
    expect(hooks.read.mock.calls[0]![0]).toEqual(lines(2));
    const firstSignal = hooks.read.mock.calls[0]![1] as AbortSignal;
    cleanup();
    expect(firstSignal.aborted).toBe(true);
    cleanup = activate(3);
    await vi.advanceTimersByTimeAsync(250);
    pending[1]!({ quote: { totalAmountMinor: 3000 } });
    await Promise.resolve();
    pending[0]!({ quote: { totalAmountMinor: 2000 } });
    await Promise.resolve();
    expect(useDeliveryQuote(lines(3))).toMatchObject({ loading: false, quote: { totalAmountMinor: 3000 } });
    expect(hooks.read).toHaveBeenCalledTimes(2);
    cleanup();
  });

  it('does not request an empty cart and aborts on unmount', async () => {
    vi.useFakeTimers();
    expect(useDeliveryQuote([]).loading).toBe(false);
    const cleanup = hooks.effect!()!;
    await vi.advanceTimersByTimeAsync(500);
    expect(hooks.read).not.toHaveBeenCalled();
    cleanup();
  });
});
