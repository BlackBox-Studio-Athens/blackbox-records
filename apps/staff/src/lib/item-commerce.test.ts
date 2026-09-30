import { afterEach, expect, test, vi } from 'vitest';
import {
  applyPriceDraft,
  euroMinor,
  planItemPublication,
  PriceConflictError,
  shopIntent,
  samePrice,
  type PriceDraft,
  type PriceDraftInput,
} from './item-commerce';
import { InternalStockApiError } from './backend/internal-stock-api';

afterEach(() => vi.unstubAllGlobals());

test('converts EUR input exactly and rejects ambiguous or unsupported amounts', () => {
  expect(euroMinor('27')).toBe(2700);
  expect(euroMinor('27,05')).toBe(2705);
  expect(euroMinor('0.29')).toBe(29);
  expect(euroMinor('999999.99')).toBe(99999999);
  for (const value of ['0', '-1', '1.001', '1e3', 'NaN', '', '1000000', '1,000.00'])
    expect(() => euroMinor(value)).toThrow();
});

test('plans one publish run: price first, then the shop path for items on sale', () => {
  const none = { contentChanged: false, priceDraft: false, shop: 'none', dependencies: false } as const;
  expect(planItemPublication(none)).toEqual([]);
  expect(planItemPublication({ ...none, priceDraft: true, shop: 'sync' })).toEqual(['price']);
  expect(planItemPublication({ ...none, contentChanged: true })).toEqual(['content']);
  expect(planItemPublication({ ...none, contentChanged: true, priceDraft: true, shop: 'sync' })).toEqual([
    'price',
    'item',
  ]);
  expect(planItemPublication({ ...none, shop: 'activate' })).toEqual(['item']);
  expect(planItemPublication({ ...none, contentChanged: true, shop: 'sync', dependencies: true })).toEqual([
    'content',
    'item',
  ]);
});

test('only a withheld item with a price can start selling, and only when ticked', () => {
  expect(shopIntent('on_sale', false)).toBe('sync');
  expect(shopIntent('on_sale', true)).toBe('sync');
  expect(shopIntent('ready_to_sell', false)).toBe('none');
  expect(shopIntent('ready_to_sell', true)).toBe('activate');
  expect(shopIntent('not_ready', true)).toBe('none');
});

test('compares fixed and pay-what-you-want prices by every amount', () => {
  const fixed = { kind: 'fixed', currencyCode: 'EUR', amountMinor: 2400 } as const;
  const open = {
    kind: 'pay_what_you_want',
    currencyCode: 'EUR',
    minimumAmountMinor: 500,
    presetAmountMinor: 900,
    maximumAmountMinor: 2000,
  } as const;
  expect(samePrice(fixed, { ...fixed })).toBe(true);
  expect(samePrice(fixed, { ...fixed, amountMinor: 2200 })).toBe(false);
  expect(samePrice(open, { ...open, maximumAmountMinor: 2500 })).toBe(false);
  expect(samePrice(fixed, { ...open, presetAmountMinor: 2400 })).toBe(false);
});

const draft: PriceDraft = {
  collection: 'releases',
  recordId: 'low-tide',
  price: { kind: 'fixed', currencyCode: 'EUR', amountMinor: 2400 },
  liveAmountWhenStaged: 2200,
  attempt: null,
  revision: 'r1',
  updatedBy: null,
  updatedAt: '2026-09-30T12:00:00.000Z',
};
const ready = (amountMinor: number, expectedRevision = 4) => ({
  state: 'ready' as const,
  detail: {
    expectedRevision,
    variantId: 'variant',
    requiresLiveConfirmation: false,
    price: { kind: 'fixed' as const, currencyCode: 'EUR' as const, amountMinor },
  },
});

function draftServer() {
  const calls: { method: string; body: unknown }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      const body = init.body
        ? JSON.parse(String(init.body))
        : Object.fromEntries(new URL(url, 'http://staff.invalid').searchParams);
      calls.push({ method: String(init.method), body });
      const data =
        init.method === 'PUT'
          ? { item: { ...body.draft, revision: 'r2', updatedBy: null, updatedAt: '2026-09-30T12:00:00.000Z' } }
          : { deleted: true };
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    }),
  );
  return calls;
}

test('stores the operation before the price command and clears the draft once it completes', async () => {
  const calls = draftServer();
  const changePrice = vi.fn(async () => ({ status: 'completed' as const, operationId: 'op', variantId: 'variant' }));
  const api = { readSelling: vi.fn(async () => ready(2200)), changePrice, initializePrice: vi.fn() };
  expect(await applyPriceDraft('', api as never, 'variant', draft)).toBe('completed');
  const saved = calls[0]!.body as { draft: PriceDraftInput; revision: string };
  expect(calls[0]!.method).toBe('PUT');
  expect(saved.revision).toBe('r1');
  expect(saved.draft.attempt).toMatchObject({ command: 'change', expectedRevision: 4 });
  expect(changePrice).toHaveBeenCalledWith('variant', {
    operationId: saved.draft.attempt!.operationId,
    expectedRevision: 4,
    price: draft.price,
    confirmLivePriceChange: true,
  });
  expect(calls[1]).toEqual({
    method: 'DELETE',
    body: { collection: 'releases', recordId: 'low-tide', revision: 'r2' },
  });
});

test('retries resend the stored command, and a live price that already matches clears the draft', async () => {
  const calls = draftServer();
  const retained: PriceDraft = {
    ...draft,
    attempt: { command: 'change', operationId: '6f9f3a8e-1c4b-4b4e-9a53-3a0f7f1b2c3d', expectedRevision: 3 },
  };
  const changePrice = vi.fn(async () => ({ status: 'pending' as const, operationId: 'op', variantId: 'variant' }));
  const api = { readSelling: vi.fn(async () => ready(2200, 9)), changePrice, initializePrice: vi.fn() };
  expect(await applyPriceDraft('', api as never, 'variant', retained)).toBe('pending');
  expect(calls).toEqual([]);
  expect(changePrice).toHaveBeenCalledWith('variant', expect.objectContaining({ expectedRevision: 3 }));

  api.readSelling.mockResolvedValue(ready(2400));
  expect(await applyPriceDraft('', api as never, 'variant', retained)).toBe('completed');
  expect(changePrice).toHaveBeenCalledTimes(1);
  expect(calls.map((call) => call.method)).toEqual(['DELETE']);
});

test('a live price changed by someone else stops before any command', async () => {
  draftServer();
  const changePrice = vi.fn();
  const api = { readSelling: vi.fn(async () => ready(2600)), changePrice, initializePrice: vi.fn() };
  await expect(applyPriceDraft('', api as never, 'variant', draft)).rejects.toBeInstanceOf(PriceConflictError);
  expect(changePrice).not.toHaveBeenCalled();
});

test('a rejected command forgets its attempt so the next publish re-reads the live price', async () => {
  const calls = draftServer();
  const api = {
    readSelling: vi.fn(async () => ready(2200)),
    changePrice: vi.fn(async () => {
      throw new InternalStockApiError(409, 'conflict');
    }),
    initializePrice: vi.fn(),
  };
  await expect(applyPriceDraft('', api as never, 'variant', draft)).rejects.toBeInstanceOf(PriceConflictError);
  const forgotten = calls.at(-1)!.body as { draft: PriceDraftInput };
  expect(forgotten.draft.attempt).toBeNull();
});

test('a retained operation stops with the server reason instead of pointing at a missing control', async () => {
  draftServer();
  const changePrice = vi.fn();
  const api = {
    readSelling: vi.fn(async () => ({
      state: 'blocked' as const,
      reason: 'Finish the retained operation before starting another change.',
      action: 'price_change' as const,
      operationId: 'op-7',
      pending: null,
    })),
    changePrice,
    initializePrice: vi.fn(),
  };
  await expect(applyPriceDraft('', api as never, 'variant', draft)).rejects.toThrow(
    'Finish the retained operation before starting another change.',
  );
  expect(changePrice).not.toHaveBeenCalled();
});
