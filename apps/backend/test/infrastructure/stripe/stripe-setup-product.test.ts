import type Stripe from 'stripe';
import { expect, it, vi } from 'vitest';
import { StripeCatalogGatewayClient } from '../../../src/infrastructure/stripe/stripe-catalog-gateway';
import {
  createStripeCatalogMutationContext,
  type StripeCatalogSetupProductInput,
} from '../../../src/application/commerce/catalog-sync';

function fixture(live = false) {
  const input: StripeCatalogSetupProductInput = {
    operationId: 'setup-one',
    confirmLiveSetup: live,
    metadata: {
      appEnv: live ? 'prd' : 'uat',
      variantId: 'variant_setup',
      storeItemSlug: 'setup',
      sourceKind: 'release',
      sourceId: 'setup',
    },
    projection: { name: 'Setup record', description: '', imageUrls: [], metadata: {}, taxCode: 'txcd_99999999' },
  };
  const context = createStripeCatalogMutationContext({
    action: 'create_catalog_price',
    environment: input.metadata.appEnv,
    variantId: input.metadata.variantId,
    identity: input.operationId,
    requestShape: input,
  });
  type Product = {
    id: string;
    active: boolean;
    livemode: boolean;
    tax_code: string;
    metadata: Record<string, string>;
    name: string;
    default_price: string | null;
  };
  let product: Product | null = null;
  let loseProductAcknowledgement = false;
  const createProduct = vi.fn(async (params: Stripe.ProductCreateParams) => {
    if (product) throw new Error('Duplicate Product creation');
    product = {
      ...params,
      id: params.id!,
      name: params.name,
      tax_code: String(params.tax_code),
      metadata: params.metadata as Record<string, string>,
      active: true,
      livemode: live,
      default_price: null,
    };
    if (loseProductAcknowledgement) {
      loseProductAcknowledgement = false;
      throw new Error('Product acknowledgement lost');
    }
    return structuredClone(product);
  });
  const retrieveProduct = vi.fn(async (_id: string) => {
    if (!product) throw Object.assign(new Error('Not found'), { statusCode: 404 });
    return structuredClone(product);
  });
  const updateProduct = vi.fn(async (_id: string, params: Stripe.ProductUpdateParams) => {
    product!.default_price = String(params.default_price);
    return structuredClone(product);
  });
  type Price = {
    id: string;
    product: string;
    active: boolean;
    livemode: boolean;
    type: string;
    currency: string;
    tax_behavior: string;
    unit_amount: number;
    custom_unit_amount: null;
    metadata: Record<string, string>;
  };
  const prices: Price[] = [];
  const createPrice = vi.fn(async (params: Stripe.PriceCreateParams) => {
    const price = {
      id: 'price_setup',
      product: String(params.product),
      active: true,
      livemode: live,
      type: 'one_time',
      currency: params.currency,
      tax_behavior: String(params.tax_behavior),
      unit_amount: params.unit_amount!,
      custom_unit_amount: null,
      metadata: params.metadata as Record<string, string>,
    };
    prices.push(price);
    return structuredClone(price);
  });
  const listPrices = vi.fn(async (params: Stripe.PriceListParams) => {
    expect(params.product).toBe(product!.id);
    return { data: prices.filter((price) => price.active === params.active), has_more: false };
  });
  const gateway = new StripeCatalogGatewayClient(
    {
      products: { create: createProduct, retrieve: retrieveProduct, update: updateProduct },
      prices: { create: createPrice, list: listPrices, retrieve: async () => structuredClone(prices[0]) },
    } as never,
    live,
  );
  return {
    gateway,
    input,
    context,
    createProduct,
    retrieveProduct,
    createPrice,
    updateProduct,
    loseAcknowledgement() {
      loseProductAcknowledgement = true;
    },
    product() {
      return product!;
    },
  };
}

it.each([false, true])('recovers initial Product and Price without an idempotency cache (live=%s)', async (live) => {
  const f = fixture(live);
  f.loseAcknowledgement();
  await expect(f.gateway.ensureSetupProduct(f.input, f.context)).rejects.toThrow('acknowledgement lost');
  const product = await f.gateway.ensureSetupProduct(f.input, f.context);
  expect(f.createProduct).toHaveBeenCalledTimes(1);
  expect(f.retrieveProduct.mock.calls.every(([id]) => id === product.productId)).toBe(true);
  const priceInput = {
    kind: 'fixed' as const,
    amountMinor: 2500,
    currencyCode: 'EUR',
    lookupKey: 'setup',
    metadata: f.input.metadata,
    productName: f.input.projection.name,
    productId: product.productId,
    expectedDefaultPriceId: null,
    operationId: f.input.operationId,
  };
  const price = await f.gateway.createReplacementPrice(priceInput, f.context);
  await f.gateway.selectReplacementPrice(priceInput, price.priceId, f.context);
  await f.gateway.ensureSetupProduct(f.input, f.context);
  await f.gateway.createReplacementPrice(priceInput, f.context);
  await f.gateway.selectReplacementPrice(priceInput, price.priceId, f.context);
  expect(f.createProduct).toHaveBeenCalledTimes(1);
  expect(f.createPrice).toHaveBeenCalledTimes(1);
  expect(f.updateProduct).toHaveBeenCalledTimes(1);
  expect(f.product().default_price).toBe(price.priceId);
});

it('rejects missing live confirmation, wrong key mode, changed setup input, and paused Products', async () => {
  const f = fixture(true);
  await expect(f.gateway.ensureSetupProduct({ ...f.input, confirmLiveSetup: false }, f.context)).rejects.toThrow(
    'unconfirmed',
  );
  await expect(
    f.gateway.ensureSetupProduct({ ...f.input, metadata: { ...f.input.metadata, appEnv: 'uat' } }, f.context),
  ).rejects.toThrow('unconfirmed');
  expect(f.retrieveProduct).not.toHaveBeenCalled();
  expect(f.createProduct).not.toHaveBeenCalled();
  await f.gateway.ensureSetupProduct(f.input, f.context);
  await expect(
    f.gateway.ensureSetupProduct({ ...f.input, operationId: 'different-operation' }, f.context),
  ).rejects.toThrow('conflicts');
  await expect(
    f.gateway.ensureSetupProduct(f.input, { ...f.context, requestShapeFingerprint: 'changed' }),
  ).rejects.toThrow('conflicts');
  f.product().active = false;
  await expect(f.gateway.ensureSetupProduct(f.input, f.context)).rejects.toThrow('conflicts');
  expect(f.createProduct).toHaveBeenCalledTimes(1);
});

it('does not create a Product after an uncertain retrieval failure', async () => {
  const f = fixture();
  f.retrieveProduct.mockRejectedValueOnce(Object.assign(new Error('Provider unavailable'), { statusCode: 503 }));
  await expect(f.gateway.ensureSetupProduct(f.input, f.context)).rejects.toThrow('Provider unavailable');
  expect(f.createProduct).not.toHaveBeenCalled();
});
