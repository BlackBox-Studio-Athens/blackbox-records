import { describe, expect, it, vi } from 'vitest';

import {
  CatalogReconciler,
  createStripeCatalogLookupKey,
  createStripeCatalogMetadata,
  createStripeCatalogMutationContext,
  deriveStripeCatalogChildMutationContext,
  type StripeCatalogEnvironment,
  type StripeCatalogGateway,
  type StripeCatalogIdentityMetadata,
  type StripeCatalogMutationContext,
  type StripeCatalogExpectedPrice,
  type StripeCatalogPrice,
  type StripeCatalogPriceCreateInput,
  type StripeCatalogProductProjection,
  type StripeCatalogProductProjectionUpdateInput,
} from '../../../../src/application/commerce/catalog-sync';
import type {
  StoreItemOptionRecord,
  StoreItemOptionRepository,
  StoreItemSourceRef,
  StoreOfferSnapshotRecord,
  StoreOfferSnapshotRepository,
  StoreOfferSnapshotState,
  VariantStripeMappingRecord,
  VariantStripeMappingRepository,
} from '../../../../src/domain/commerce/repositories/spi';
import { storeItemSlug, stripePriceId, variantId } from '../../../support/commerce-value-objects';

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
  public readonly archivePrice = vi.fn(async (priceId: string, _context?: StripeCatalogMutationContext) => {
    const price = this.prices.get(priceId);

    if (!price) {
      throw new Error(`Missing price ${priceId}.`);
    }

    const archived = { ...price, active: false };
    this.prices.set(priceId, archived);

    return archived;
  });
  public readonly prices = new Map<string, StripeCatalogPrice>();
  public readonly products = new Map<
    string,
    {
      active: boolean;
      idempotentReplayed?: boolean | null;
      metadata: Record<string, string>;
      name: string | null;
      productId: string;
      requestId?: string | null;
    }
  >();
  public readonly updatePriceLookupKey = vi.fn(
    async (priceId: string, lookupKey: string, _context?: StripeCatalogMutationContext) => {
      const price = this.prices.get(priceId);

      if (!price) {
        throw new Error(`Missing price ${priceId}.`);
      }

      const updated = { ...price, lookupKey };
      this.prices.set(priceId, updated);

      return updated;
    },
  );
  public readonly updatePriceMetadata = vi.fn(
    async (priceId: string, metadata: StripeCatalogIdentityMetadata, _context?: StripeCatalogMutationContext) => {
      const price = this.prices.get(priceId);

      if (!price) {
        throw new Error(`Missing price ${priceId}.`);
      }

      const updated = { ...price, metadata, productMetadata: metadata };
      this.prices.set(priceId, updated);

      return updated;
    },
  );
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

  public async listPricesByLookupKey(lookupKey: string): Promise<StripeCatalogPrice[]> {
    return [...this.prices.values()].filter((price) => price.lookupKey === lookupKey);
  }

  public async listPricesByMetadata(metadata: StripeCatalogIdentityMetadata): Promise<StripeCatalogPrice[]> {
    return [...this.prices.values()].filter(
      (price) => hasMetadata(price.metadata, metadata) || hasMetadata(price.productMetadata, metadata),
    );
  }

  public async listOwnedPrices(_environment: StripeCatalogEnvironment): Promise<StripeCatalogPrice[]> {
    return [...this.prices.values()].filter(
      (price) =>
        price.active &&
        (price.lookupKey?.startsWith('blackbox:') ||
          hasCatalogMetadataHint(price.metadata) ||
          hasCatalogMetadataHint(price.productMetadata)),
    );
  }

  public async listOwnedProducts(_environment: StripeCatalogEnvironment) {
    const priceProducts = [...this.prices.values()]
      .filter((price) => price.productActive && price.productId && hasCatalogMetadataHint(price.productMetadata))
      .map((price) => ({
        active: price.productActive,
        metadata: price.productMetadata,
        name: price.productName,
        productId: price.productId!,
      }));

    return [
      ...this.products.values().filter((product) => hasCatalogMetadataHint(product.metadata)),
      ...priceProducts.filter((priceProduct) => !this.products.has(priceProduct.productId)),
    ];
  }

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

function hasMetadata(candidate: Record<string, string>, expected: Record<string, string>): boolean {
  return Object.entries(expected).every(([key, value]) => candidate[key] === value);
}

function hasCatalogMetadataHint(metadata: Record<string, string>): boolean {
  return Boolean(
    metadata.appEnv || metadata.sourceId || metadata.sourceKind || metadata.storeItemSlug || metadata.variantId,
  );
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
    expect(result.issues.some((issue) => issue.code === 'missing_price')).toBe(true);
    expect(stripeCatalog.createCatalogPrice).not.toHaveBeenCalled();
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
    const result = await reconciler.verifyBuyableCatalog({ apply: false });
    expect(result.results).toHaveLength(2);
    expect(result.results.every((entry) => entry.issues.some((issue) => issue.code === 'missing_price'))).toBe(true);
  });
});
