import { describe, expect, it, vi } from 'vitest';

import {
  CatalogReconciler,
  createStripeCatalogLookupKey,
  createStripeCatalogMetadata,
  createStripeCatalogMutationContext,
  deriveStripeCatalogChildMutationContext,
  type StripeCatalogEnvironment,
  type StripeCatalogGateway,
  type StripeCatalogMutationContext,
  type StripeCatalogExpectedPrice,
  type StripeCatalogPrice,
  type StripeCatalogPriceCreateInput,
  type StripeCatalogProductProjection,
  type StripeCatalogProductProjectionUpdateInput,
} from './';
import type {
  StoreItemOptionRecord,
  StoreItemOptionRepository,
  StoreItemSourceRef,
  StoreOfferSnapshotRecord,
  StoreOfferSnapshotRepository,
  StoreOfferSnapshotState,
  VariantStripeMappingRecord,
  VariantStripeMappingRepository,
} from '../../../domain/commerce/repositories/spi';
import { storeItemSlug, stripePriceId, variantId } from '../../../../test/support/commerce-value-objects';

const storeItem: StoreItemOptionRecord = {
  sourceId: 'disintegration',
  sourceKind: 'release',
  storeItemSlug: storeItemSlug('disintegration-black-vinyl-lp'),
  variantId: variantId('variant_disintegration-black-vinyl-lp_standard'),
};
const unavailableStoreItem: StoreItemOptionRecord = {
  sourceId: 'noise-without-decay',
  sourceKind: 'distro',
  storeItemSlug: storeItemSlug('noise-without-decay'),
  variantId: variantId('variant_noise-without-decay_standard'),
};

function fixedExpectedPrice(amountMinor = 2800, revision?: string): StripeCatalogExpectedPrice {
  return {
    amountMinor,
    currencyCode: 'EUR',
    kind: 'fixed',
    ...(revision ? { revision } : {}),
  };
}

class InMemoryStoreItems implements StoreItemOptionRepository {
  public constructor(private readonly records: StoreItemOptionRecord[]) {}

  public async findBySource(source: StoreItemSourceRef): Promise<StoreItemOptionRecord | null> {
    return (
      this.records.find((record) => record.sourceKind === source.sourceKind && record.sourceId === source.sourceId) ??
      null
    );
  }

  public async findByStoreItemSlug(slug: string): Promise<StoreItemOptionRecord | null> {
    return this.records.find((record) => record.storeItemSlug === slug) ?? null;
  }

  public async findByVariantId(id: string): Promise<StoreItemOptionRecord | null> {
    return this.records.find((record) => record.variantId === id) ?? null;
  }

  public async search(_query: string | null, limit: number): Promise<StoreItemOptionRecord[]> {
    return this.records.slice(0, limit);
  }
}

class InMemoryVariantMappings implements VariantStripeMappingRepository {
  public readonly records = new Map<string, VariantStripeMappingRecord>();
  public async findByStripeProductId(productId: string) {
    return [...this.records.values()].find((record) => record.stripeProductId === productId) ?? null;
  }

  public async findByVariantId(id: string): Promise<VariantStripeMappingRecord | null> {
    return this.records.get(id) ?? null;
  }

  public async save(record: VariantStripeMappingRecord): Promise<VariantStripeMappingRecord> {
    this.records.set(record.variantId, record);
    return record;
  }
}

class InMemoryStoreOfferSnapshots implements StoreOfferSnapshotRepository {
  public readonly records = new Map<string, StoreOfferSnapshotRecord>();

  public async findByStoreItemSlug(slug: string): Promise<StoreOfferSnapshotRecord | null> {
    return [...this.records.values()].find((record) => record.storeItemSlug === slug) ?? null;
  }

  public async findByVariantId(id: string): Promise<StoreOfferSnapshotRecord | null> {
    return this.records.get(id) ?? null;
  }

  public async save(snapshot: StoreOfferSnapshotState): Promise<StoreOfferSnapshotRecord> {
    this.records.set(snapshot.variantId, snapshot);
    return snapshot;
  }
}

class InMemoryStripeCatalog implements StripeCatalogGateway {
  public readonly defaultPrices = new Map<string, StripeCatalogPrice>();
  public async retrieveDefaultPrice(productId: string): Promise<StripeCatalogPrice | null> {
    return this.defaultPrices.get(productId) ?? null;
  }
  public readonly prices = new Map<string, StripeCatalogPrice>();
  public readonly updatePriceLookupKey = vi.fn();
  public readonly updatePriceMetadata = vi.fn();
  public readonly listPricesByLookupKey = vi.fn();
  public readonly listPricesByMetadata = vi.fn();
  public readonly listOwnedPrices = vi.fn();
  public readonly updateProductProjection = vi.fn(
    async (
      productId: string,
      input: StripeCatalogProductProjectionUpdateInput,
      _context?: StripeCatalogMutationContext,
    ) => {
      const price = [...this.prices.values()].find((candidate) => candidate.productId === productId);

      if (!price) {
        throw new Error(`Missing product ${productId}.`);
      }

      const updatedPrice = {
        ...price,
        productDescription: input.projection.description,
        productImages: input.projection.imageUrls,
        productMetadata: {
          ...input.projection.metadata,
          ...input.stripeMetadata,
        },
        productName: input.projection.name,
        productTaxCode: input.projection.taxCode,
      };
      this.prices.set(price.priceId, updatedPrice);

      return {
        active: updatedPrice.productActive,
        idempotentReplayed: true,
        metadata: updatedPrice.productMetadata,
        name: updatedPrice.productName,
        productId,
        requestId: 'req_update_product_projection',
      };
    },
  );

  public readonly createCatalogPrice = vi.fn(
    async (
      input: StripeCatalogPriceCreateInput,
      _context?: StripeCatalogMutationContext,
    ): Promise<StripeCatalogPrice> => {
      const pricePrefix = input.metadata.appEnv === 'prd' ? 'price_live' : 'price_test';
      const createdStoreItem: StoreItemOptionRecord = {
        sourceId: input.metadata.sourceId,
        sourceKind: input.metadata.sourceKind === 'distro' ? 'distro' : 'release',
        storeItemSlug: storeItemSlug(input.metadata.storeItemSlug),
        variantId: variantId(input.metadata.variantId),
      };
      const price = createCatalogPrice({
        amountMinor: input.kind === 'fixed' ? input.amountMinor : undefined,
        customUnitAmount:
          input.kind === 'pay_what_you_want'
            ? {
                maximumAmountMinor: input.maximumAmountMinor,
                minimumAmountMinor: input.minimumAmountMinor,
                presetAmountMinor: input.presetAmountMinor,
              }
            : null,
        currencyCode: input.currencyCode,
        environment: input.metadata.appEnv,
        priceId:
          input.kind === 'pay_what_you_want'
            ? `${pricePrefix}_${input.metadata.sourceId}_pay_what_you_want`
            : `${pricePrefix}_${input.metadata.sourceId}_${input.amountMinor}`,
        priceKind: input.kind,
        productProjection: input.productProjection ?? null,
        storeItem: createdStoreItem,
      });
      this.prices.set(price.priceId, price);

      return price;
    },
  );

  public async retrievePrice(priceId: string): Promise<StripeCatalogPrice | null> {
    return this.prices.get(priceId) ?? null;
  }
}

function createCatalogPrice(input: {
  active?: boolean;
  amountMinor?: number;
  customUnitAmount?: StripeCatalogPrice['customUnitAmount'];
  currencyCode?: string;
  environment?: StripeCatalogEnvironment;
  priceId: string;
  priceKind?: StripeCatalogPrice['priceKind'];
  productActive?: boolean;
  productProjection?: StripeCatalogProductProjection | null;
  storeItem?: StoreItemOptionRecord;
}): StripeCatalogPrice {
  const environment = input.environment ?? 'uat';
  const catalogStoreItem = input.storeItem ?? storeItem;
  const lookupKey = createStripeCatalogLookupKey(environment, catalogStoreItem);
  const metadata = {
    appEnv: environment,
    sourceId: catalogStoreItem.sourceId,
    sourceKind: catalogStoreItem.sourceKind,
    storeItemSlug: catalogStoreItem.storeItemSlug,
    variantId: catalogStoreItem.variantId,
  };

  return {
    active: input.active ?? true,
    taxBehavior: 'inclusive',
    amountMinor: input.priceKind === 'pay_what_you_want' ? null : (input.amountMinor ?? 2800),
    currencyCode: input.currencyCode ?? 'EUR',
    customUnitAmount: input.customUnitAmount ?? null,
    lookupKey,
    metadata,
    priceKind: input.priceKind ?? 'fixed',
    priceId: stripePriceId(input.priceId),
    productActive: input.productActive ?? true,
    productDescription: input.productProjection?.description ?? 'Disintegration by Afterwise.',
    productId: `prod_${input.priceId}`,
    productImages: input.productProjection?.imageUrls ?? [
      'https://blackbox-records-web.pages.dev/assets/catalog/releases/disintegration.jpg',
    ],
    productMetadata: {
      ...(input.productProjection?.metadata ?? {}),
      ...metadata,
    },
    productName: input.productProjection?.name ?? 'BlackBox Records - Disintegration - Black Vinyl LP',
    productTaxCode: input.productProjection?.taxCode ?? 'txcd_99999999',
  };
}

function createReconciler(
  input: {
    creationMutationScope?: string;
    environment?: StripeCatalogEnvironment;
    mappings?: InMemoryVariantMappings;
    snapshots?: InMemoryStoreOfferSnapshots;
    storeItems?: StoreItemOptionRecord[];
    stripeCatalog?: InMemoryStripeCatalog;
  } = {},
) {
  const environment = input.environment ?? 'uat';
  const mappings = input.mappings ?? new InMemoryVariantMappings();
  const snapshots = input.snapshots ?? new InMemoryStoreOfferSnapshots();
  const stripeCatalog = input.stripeCatalog ?? new InMemoryStripeCatalog();
  const reconciler = new CatalogReconciler({
    creationMutationScope: input.creationMutationScope,
    environment,
    storeItems: new InMemoryStoreItems(input.storeItems ?? [storeItem]),
    storeOfferSnapshots: snapshots,
    stripeCatalog,
    variantStripeMappings: mappings,
  });

  return { mappings, reconciler, snapshots, stripeCatalog };
}

describe('Stripe catalog identity helpers', () => {
  it('builds canonical lookup keys and required metadata for UAT and PRD', () => {
    expect(createStripeCatalogLookupKey('uat', storeItem)).toBe(
      'blackbox:uat:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
    );
    expect(createStripeCatalogLookupKey('prd', storeItem)).toBe(
      'blackbox:prd:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
    );
    expect(createStripeCatalogMetadata('uat', storeItem)).toEqual({
      appEnv: 'uat',
      sourceId: 'disintegration',
      sourceKind: 'release',
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });
  });

  it('builds deterministic idempotency keys that change with logical mutation identity', () => {
    const baseInput = {
      action: 'create_catalog_price' as const,
      environment: 'uat' as const,
      identity: 'revision_disintegration-black-vinyl-lp-2800-eur',
      requestShape: {
        amountMinor: 2800,
        currencyCode: 'EUR',
        productProjection: { name: 'BlackBox Records - Disintegration - Black Vinyl LP' },
      },
      variantId: storeItem.variantId,
    };
    const first = createStripeCatalogMutationContext(baseInput);
    const same = createStripeCatalogMutationContext(baseInput);
    const changedAmount = createStripeCatalogMutationContext({
      ...baseInput,
      requestShape: { ...baseInput.requestShape, amountMinor: 2900 },
    });
    const changedCurrency = createStripeCatalogMutationContext({
      ...baseInput,
      requestShape: { ...baseInput.requestShape, currencyCode: 'USD' },
    });
    const changedProductProjection = createStripeCatalogMutationContext({
      ...baseInput,
      requestShape: {
        ...baseInput.requestShape,
        productProjection: { name: 'BlackBox Records - Disintegration - White Vinyl LP' },
      },
    });
    const changedPurpose = createStripeCatalogMutationContext({
      ...baseInput,
      action: 'archive_price',
      identity: 'price_test_disintegration_2800',
    });
    const changedRepairTarget = createStripeCatalogMutationContext({
      ...baseInput,
      identity: 'revision_disintegration-black-vinyl-lp-2800-eur:replace_mapping_price_old',
    });
    const changedScope = createStripeCatalogMutationContext({
      ...baseInput,
      scope: 'promotion-run-456',
    });
    const longKey = createStripeCatalogMutationContext({
      ...baseInput,
      identity: 'x'.repeat(400),
      variantId: `variant_${'long'.repeat(100)}`,
    });

    expect(first).toEqual(same);
    expect(first.idempotencyKey.length).toBeLessThanOrEqual(255);
    expect(longKey.idempotencyKey.length).toBeLessThanOrEqual(255);
    expect(changedAmount.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(changedCurrency.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(changedProductProjection.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(changedPurpose.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(changedRepairTarget.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(changedScope.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(createStripeCatalogMutationContext({ ...baseInput, scope: 'promotion-run-456' })).toEqual(changedScope);
    expect(deriveStripeCatalogChildMutationContext(first, 'price')?.idempotencyKey).toBe(
      `${first.idempotencyKey}:price`,
    );
    expect(deriveStripeCatalogChildMutationContext(longKey, 'price')?.idempotencyKey.length).toBeLessThanOrEqual(255);
  });
});

function boundCatalog() {
  const state = createReconciler();
  const price = createCatalogPrice({ priceId: 'price_current' });
  state.stripeCatalog.prices.set(price.priceId, price);
  state.stripeCatalog.defaultPrices.set(price.productId!, price);
  state.mappings.records.set(storeItem.variantId, {
    variantId: storeItem.variantId,
    stripePriceId: price.priceId,
    stripeProductId: price.productId,
  });
  return { ...state, price };
}

describe('CatalogReconciler', () => {
  it('uses the Product default and refreshes D1 while older Prices stay active', async () => {
    const { reconciler, stripeCatalog, mappings, snapshots, price } = boundCatalog();
    const replacement = {
      ...price,
      priceId: stripePriceId('price_replacement'),
      amountMinor: 3100,
      lookupKey: null,
      metadata: {},
    };
    stripeCatalog.prices.set(replacement.priceId, replacement);
    stripeCatalog.defaultPrices.set(price.productId!, replacement);
    const result = await reconciler.reconcileVariant(storeItem, { apply: true, applyProductProjection: false });
    expect(result.issues).toEqual([]);
    expect(result.resolvedPrice?.priceId).toBe(replacement.priceId);
    expect(mappings.records.get(storeItem.variantId)).toMatchObject({
      stripeProductId: price.productId,
      stripePriceId: replacement.priceId,
    });
    expect(snapshots.records.get(storeItem.variantId)?.amountMinor).toBe(3100);
    expect(price.active).toBe(true);
    expect(stripeCatalog.updatePriceLookupKey).not.toHaveBeenCalled();
    expect(stripeCatalog.updatePriceMetadata).not.toHaveBeenCalled();
  });

  it('never scans account Prices for bound items and ignores unrelated foreign objects', async () => {
    const { reconciler, stripeCatalog } = boundCatalog();
    const lookup = vi.spyOn(stripeCatalog, 'listPricesByLookupKey');
    const metadata = vi.spyOn(stripeCatalog, 'listPricesByMetadata');
    const owned = vi.spyOn(stripeCatalog, 'listOwnedPrices');
    const foreign = createCatalogPrice({ priceId: 'price_foreign', environment: 'prd' });
    stripeCatalog.prices.set(foreign.priceId, foreign);
    const result = await reconciler.verifyBuyableCatalog({ apply: true });
    expect(result.issues).toEqual([]);
    expect(lookup).not.toHaveBeenCalled();
    expect(metadata).not.toHaveBeenCalled();
    expect(owned).not.toHaveBeenCalled();
  });

  it.each([
    ['inactive_price', { active: false }],
    ['inactive_product', { productActive: false }],
    ['wrong_currency', { currencyCode: 'USD' }],
    ['wrong_tax_behavior', { taxBehavior: 'exclusive' }],
    ['wrong_tax_code', { productTaxCode: 'txcd_wrong' }],
    ['wrong_amount', { amountMinor: -1 }],
    ['wrong_variant_identity', { productMetadata: { appEnv: 'prd' } }],
    ['wrong_variant_identity', { lookupKey: 'blackbox:uat:other:variant_other_standard' }],
  ] as const)('rejects %s without saving or creating a replacement', async (code, fields) => {
    const { reconciler, stripeCatalog, snapshots, price } = boundCatalog();
    stripeCatalog.defaultPrices.set(price.productId!, { ...price, ...fields });
    const result = await reconciler.reconcileVariant(storeItem, { apply: true, expectedPrice: fixedExpectedPrice() });
    expect(result.issues.some((issue) => issue.code === code)).toBe(true);
    expect(snapshots.records.size).toBe(0);
    expect(stripeCatalog.createCatalogPrice).not.toHaveBeenCalled();
  });

  it('fails a missing default instead of selecting another active Price', async () => {
    const { reconciler, stripeCatalog, price } = boundCatalog();
    stripeCatalog.defaultPrices.delete(price.productId!);
    const result = await reconciler.reconcileVariant(storeItem, { apply: true, expectedPrice: fixedExpectedPrice() });
    expect(result.resolvedPrice).toBeNull();
    expect(result.issues).toEqual([
      {
        code: 'missing_price',
        detail: `No unambiguous active Stripe Price matches ${result.lookupKey}. Stripe returned 0 candidate Prices.`,
        driftCategory: 'price_authority',
        storeItemSlug: storeItem.storeItemSlug,
        variantId: storeItem.variantId,
      },
    ]);
    expect(result.issueCount).toBe(1);
    expect(stripeCatalog.createCatalogPrice).not.toHaveBeenCalled();
  });

  it('plans bootstrap in a dry-run while reporting the missing Price without writes', async () => {
    const { reconciler, stripeCatalog, mappings, snapshots } = createReconciler();
    const result = await reconciler.reconcileVariant(storeItem, { apply: false, expectedPrice: fixedExpectedPrice() });
    expect(result.actions).toEqual([
      {
        kind: 'create_catalog_price',
        idempotencyKey: expect.any(String),
        requestShapeFingerprint: expect.any(String),
        requestId: null,
        replayed: null,
      },
    ]);
    expect(result.resolvedPrice).toBeNull();
    expect(result.issues).toEqual([
      {
        code: 'missing_price',
        detail: `No unambiguous active Stripe Price matches ${result.lookupKey}. Stripe returned 0 candidate Prices.`,
        driftCategory: 'price_authority',
        storeItemSlug: storeItem.storeItemSlug,
        variantId: storeItem.variantId,
      },
    ]);
    expect(result.issueCount).toBe(1);
    expect(stripeCatalog.createCatalogPrice).not.toHaveBeenCalled();
    expect(stripeCatalog.updateProductProjection).not.toHaveBeenCalled();
    expect(mappings.records.size).toBe(0);
    expect(snapshots.records.size).toBe(0);
  });

  it('backfills a trusted Product binding without changing the selling amount', async () => {
    const { reconciler, mappings, price } = boundCatalog();
    mappings.records.set(storeItem.variantId, { variantId: storeItem.variantId, stripePriceId: price.priceId });
    await reconciler.reconcileVariant(storeItem, { apply: true });
    expect(mappings.records.get(storeItem.variantId)?.stripeProductId).toBe(price.productId);
  });

  it('dry-run reads current authority without mutations', async () => {
    const { reconciler, snapshots, price } = boundCatalog();
    const result = await reconciler.reconcileVariant(storeItem, { apply: false, expectedPrice: fixedExpectedPrice(1) });
    expect(result.resolvedPrice?.amountMinor).toBe(price.amountMinor);
    expect(snapshots.records.size).toBe(0);
  });

  it('repeated and delayed refreshes read the latest default without provider mutations', async () => {
    const { reconciler, stripeCatalog, snapshots, price } = boundCatalog();
    await reconciler.reconcileVariant(storeItem, { apply: true });
    stripeCatalog.defaultPrices.set(price.productId!, { ...price, amountMinor: 3200 });
    await reconciler.reconcileVariant(storeItem, { apply: true });
    const replay = await reconciler.reconcileVariant(storeItem, { apply: true });
    expect(snapshots.records.get(storeItem.variantId)?.amountMinor).toBe(3200);
    expect(replay.actions).toEqual([]);
  });

  it('preserves custom amount authority and nullable listing amount', async () => {
    const { reconciler, stripeCatalog, snapshots, price } = boundCatalog();
    stripeCatalog.defaultPrices.set(price.productId!, {
      ...price,
      amountMinor: null,
      priceKind: 'pay_what_you_want',
      customUnitAmount: { minimumAmountMinor: 100, presetAmountMinor: 500, maximumAmountMinor: 10000 },
    });
    const result = await reconciler.reconcileVariant(storeItem, { apply: true });
    expect(result.issues).toEqual([]);
    expect(snapshots.records.get(storeItem.variantId)?.amountMinor).toBeNull();
  });

  it('bootstraps new UAT items but never invents PRD selling prices', async () => {
    const uat = createReconciler();
    await uat.reconciler.reconcileVariant(storeItem, { apply: true, expectedPrice: fixedExpectedPrice() });
    expect(uat.stripeCatalog.createCatalogPrice).toHaveBeenCalledTimes(1);
    const prd = createReconciler({ environment: 'prd' });
    const result = await prd.reconciler.reconcileVariant(storeItem, {
      apply: true,
      expectedPrice: fixedExpectedPrice(),
    });
    expect(result.issues.some((issue) => issue.code === 'missing_price')).toBe(true);
    expect(prd.stripeCatalog.createCatalogPrice).not.toHaveBeenCalled();
  });

  it('requires every listed item to have valid authority', async () => {
    const { reconciler } = createReconciler({ storeItems: [storeItem, unavailableStoreItem] });
    const result = await reconciler.verifyBuyableCatalog({ apply: false, expectedPrices: new Map() });
    expect(result.results).toHaveLength(2);
    expect(result.results.every((entry) => entry.issues.some((issue) => issue.code === 'missing_price'))).toBe(true);
  });

  it('waits for each listed item and forwards its expected inputs in repository order', async () => {
    const { reconciler } = createReconciler({ storeItems: [storeItem, unavailableStoreItem] });
    const expectedPrice = fixedExpectedPrice();
    const productProjection: StripeCatalogProductProjection = {
      description: 'Approved presentation',
      imageUrls: [],
      metadata: {},
      name: 'Item',
      taxCode: null,
    };
    const now = new Date('2026-10-10T00:00:00Z');
    const firstResult = await reconciler.reconcileVariant(storeItem, { apply: false });
    const pending = Promise.withResolvers<typeof firstResult>();
    const reconcile = vi.spyOn(reconciler, 'reconcileVariant').mockImplementationOnce(() => pending.promise);
    const run = reconciler.verifyBuyableCatalog({
      apply: false,
      now,
      expectedPrices: new Map([[storeItem.variantId, expectedPrice]]),
      expectedProductProjections: new Map([[storeItem.variantId, productProjection]]),
    });
    await vi.waitFor(() => expect(reconcile).toHaveBeenCalledTimes(1));
    expect(reconcile).toHaveBeenNthCalledWith(1, storeItem, { apply: false, expectedPrice, productProjection, now });
    pending.resolve(firstResult);
    const result = await run;
    expect(reconcile).toHaveBeenNthCalledWith(2, unavailableStoreItem, {
      apply: false,
      expectedPrice: null,
      productProjection: null,
      now,
    });
    expect(result.results.map((entry) => entry.storeItem)).toEqual([storeItem, unavailableStoreItem]);
  });
});
