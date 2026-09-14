import { expect, it, vi } from 'vitest';
import { StripeCatalogGatewayClient } from '../../../src/infrastructure/stripe/stripe-catalog-gateway';
import {
  createStripeCatalogMutationContext,
  type StripeCatalogPriceChangeInput,
} from '../../../src/application/commerce/catalog-sync';
import { parseStripePriceId } from '../../../src/domain/commerce';

function fixture(kind: 'fixed' | 'pay_what_you_want' = 'fixed') {
  const metadata = {
    appEnv: 'uat' as const,
    sourceKind: 'release' as const,
    sourceId: 'record',
    storeItemSlug: 'record',
    variantId: 'variant_record',
  };
  const product = {
    tax_code: 'txcd_99999999',
    id: 'prod_bound',
    active: true,
    livemode: false,
    metadata,
    default_price: 'price_old',
  };
  const input: StripeCatalogPriceChangeInput = {
    productId: product.id,
    expectedDefaultPriceId: 'price_old',
    operationId: 'operation-one',
    metadata,
    lookupKey: 'blackbox:uat:record:variant_record',
    productName: 'Record',
    currencyCode: 'EUR',
    ...(kind === 'fixed'
      ? { kind, amountMinor: 2500 }
      : { kind, minimumAmountMinor: 500, presetAmountMinor: 2500, maximumAmountMinor: 10000 }),
  };
  const context = createStripeCatalogMutationContext({
    action: 'create_catalog_price',
    environment: 'uat',
    variantId: metadata.variantId,
    identity: input.operationId,
    requestShape: input,
  });
  type Price = {
    id: string;
    active: boolean;
    product: string;
    livemode: boolean;
    type: string;
    metadata: Record<string, string>;
    currency: string;
    tax_behavior: string;
    unit_amount: number | null;
    custom_unit_amount: null | { minimum: number; maximum: number; preset: number };
  };
  const prices: Price[] = [];
  const create = vi.fn(async (params) => {
    const price: Price = {
      ...params,
      id: 'price_new',
      livemode: false,
      type: 'one_time',
      unit_amount: params.unit_amount ?? null,
      custom_unit_amount: params.custom_unit_amount ?? null,
    };
    prices.push(price);
    return structuredClone(price);
  });
  const list = vi.fn(async ({ active }) => ({
    data: prices.filter((price) => price.active === active),
    has_more: false,
  }));
  const update = vi.fn(async (_id, params) => {
    product.default_price = params.default_price;
    return structuredClone(product);
  });
  const retrieveProduct = vi.fn(async () => structuredClone(product));
  const gateway = new StripeCatalogGatewayClient({
    products: { retrieve: retrieveProduct, update },
    prices: { list, create, retrieve: async (id: string) => structuredClone(prices.find((price) => price.id === id)) },
  } as never);
  return { gateway, input, context, product, prices, create, list, update, retrieveProduct };
}

it.each(['fixed', 'pay_what_you_want'] as const)(
  'recovers and selects one bound %s replacement without changing historical prices',
  async (kind) => {
    const f = fixture(kind);
    const price = await f.gateway.createReplacementPrice(f.input, f.context);
    expect(price).toMatchObject({ priceKind: kind, productId: 'prod_bound', priceId: 'price_new' });
    expect(f.product.default_price).toBe('price_old');
    expect(f.create.mock.calls[0][0]).toMatchObject({
      product: 'prod_bound',
      tax_behavior: 'inclusive',
      lookup_key: undefined,
      transfer_lookup_key: undefined,
    });
    await f.gateway.createReplacementPrice(f.input, f.context);
    expect(f.create).toHaveBeenCalledTimes(1);
    expect(f.list.mock.calls.every(([params]) => params.product === 'prod_bound')).toBe(true);
    await f.gateway.selectReplacementPrice(f.input, price.priceId, f.context);
    await f.gateway.selectReplacementPrice(f.input, price.priceId, f.context);
    expect(f.update).toHaveBeenCalledTimes(1);
    expect(f.update.mock.calls[0].slice(0, 2)).toEqual(['prod_bound', { default_price: 'price_new' }]);
    expect(f.prices).toHaveLength(1);
  },
);

it('rejects archived, changed-input, ambiguous, and wrong-environment recovery without creating another Price', async () => {
  const f = fixture();
  await f.gateway.createReplacementPrice(f.input, f.context);
  f.prices[0].active = false;
  await expect(f.gateway.createReplacementPrice(f.input, f.context)).rejects.toThrow('conflicts');
  f.prices[0].active = true;
  await expect(
    f.gateway.createReplacementPrice({ ...f.input, kind: 'fixed', amountMinor: 3000 }, f.context),
  ).rejects.toThrow('conflicts');
  f.prices.push({ ...f.prices[0], id: 'price_duplicate' });
  await expect(f.gateway.createReplacementPrice(f.input, f.context)).rejects.toThrow('Multiple');
  f.product.livemode = true;
  await expect(f.gateway.createReplacementPrice(f.input, f.context)).rejects.toThrow('identity');
  expect(f.create).toHaveBeenCalledTimes(1);
  expect(f.update).not.toHaveBeenCalled();
});

it('detects external default changes before and after selection', async () => {
  const f = fixture();
  await f.gateway.createReplacementPrice(f.input, f.context);
  f.product.default_price = 'price_external';
  await expect(f.gateway.selectReplacementPrice(f.input, parseStripePriceId('price_new'), f.context)).rejects.toThrow(
    'changed',
  );
  expect(f.update).not.toHaveBeenCalled();
  f.product.default_price = 'price_old';
  f.update.mockImplementationOnce(async () => ({ ...f.product, default_price: 'price_new' }));
  await expect(f.gateway.selectReplacementPrice(f.input, parseStripePriceId('price_new'), f.context)).rejects.toThrow(
    'during selection',
  );
});

it('stops recovery at the page budget and rejects invalid money before provider access', async () => {
  const f = fixture();
  await expect(
    f.gateway.createReplacementPrice({ ...f.input, kind: 'fixed', amountMinor: 0 }, f.context),
  ).rejects.toThrow('amount');
  expect(f.retrieveProduct).not.toHaveBeenCalled();
  f.list.mockImplementation(async () => ({
    data: [{ id: crypto.randomUUID(), active: true, metadata: {} }] as never,
    has_more: true,
  }));
  await expect(f.gateway.createReplacementPrice(f.input, f.context)).rejects.toThrow('budget');
  expect(f.list).toHaveBeenCalledTimes(3);
  expect(f.create).not.toHaveBeenCalled();
});
it('rejects an unapproved Product tax code before replacement creation or default selection', async () => {
  const f = fixture();
  f.product.tax_code = 'txcd_unapproved';
  await expect(f.gateway.createReplacementPrice(f.input, f.context)).rejects.toThrow('Bound Product');
  expect(f.create).not.toHaveBeenCalled();
  f.product.tax_code = 'txcd_99999999';
  const price = await f.gateway.createReplacementPrice(f.input, f.context);
  f.product.tax_code = 'txcd_unapproved';
  await expect(f.gateway.selectReplacementPrice(f.input, price.priceId, f.context)).rejects.toThrow('Bound Product');
  expect(f.update).not.toHaveBeenCalled();
});

it('refuses an unrecognized Price during initial setup instead of creating another', async () => {
  const f = fixture();
  await f.gateway.createReplacementPrice(f.input, f.context);
  await expect(
    f.gateway.createReplacementPrice({ ...f.input, operationId: 'new-setup', expectedDefaultPriceId: null }, f.context),
  ).rejects.toThrow('unrecognized');
  expect(f.create).toHaveBeenCalledTimes(1);
  expect(f.update).not.toHaveBeenCalled();
});
