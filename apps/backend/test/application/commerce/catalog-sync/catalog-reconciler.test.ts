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
            ? `${pricePrefix}_disintegration_pay_what_you_want`
            : `${pricePrefix}_disintegration_${input.amountMinor}`,
        priceKind: input.kind,
        productProjection: input.productProjection ?? null,
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
}): StripeCatalogPrice {
  const environment = input.environment ?? 'uat';
  const lookupKey = createStripeCatalogLookupKey(environment, storeItem);
  const metadata = {
    appEnv: environment,
    sourceId: storeItem.sourceId,
    sourceKind: storeItem.sourceKind,
    storeItemSlug: storeItem.storeItemSlug,
    variantId: storeItem.variantId,
  };

  return {
    active: input.active ?? true,
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
      'https://blackbox-records-web.pages.dev/admin/media/releases/disintegration.jpg',
    ],
    productMetadata: {
      ...(input.productProjection?.metadata ?? {}),
      ...metadata,
    },
    productName: input.productProjection?.name ?? 'BlackBox Records - Disintegration - Black Vinyl LP',
    productTaxCode: input.productProjection?.taxCode ?? null,
  };
}

function createReconciler(
  input: {
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
    expect(deriveStripeCatalogChildMutationContext(first, 'price')?.idempotencyKey).toBe(
      `${first.idempotencyKey}:price`,
    );
    expect(deriveStripeCatalogChildMutationContext(longKey, 'price')?.idempotencyKey.length).toBeLessThanOrEqual(255);
  });
});

describe('CatalogReconciler', () => {
  it('creates a corrected sandbox Price, archives the stale Price, and refreshes D1 authority in apply mode', async () => {
    const oldPrice = createCatalogPrice({ amountMinor: 1000, priceId: 'price_test_disintegration_1000' });
    const { mappings, reconciler, snapshots, stripeCatalog } = createReconciler();
    stripeCatalog.prices.set(oldPrice.priceId, oldPrice);
    mappings.records.set(storeItem.variantId, {
      stripePriceId: oldPrice.priceId,
      variantId: storeItem.variantId,
    });

    const result = await reconciler.reconcileVariant(storeItem, {
      apply: true,
      expectedPrice: fixedExpectedPrice(2800, 'disintegration-black-vinyl-lp-2800-eur'),
      now: new Date('2026-05-23T10:00:00.000Z'),
    });

    expect(result.issues).toEqual([]);
    expect(result.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'archive_price', stripePriceId: oldPrice.priceId }),
        expect.objectContaining({ kind: 'create_catalog_price' }),
        { kind: 'update_mapping', stripePriceId: 'price_test_disintegration_2800' },
        { kind: 'update_snapshot' },
      ]),
    );
    expect(stripeCatalog.archivePrice).toHaveBeenCalledWith(
      'price_test_disintegration_1000',
      expect.objectContaining({
        idempotencyKey: expect.stringContaining('archive_price'),
      }),
    );
    expect(mappings.records.get(storeItem.variantId)?.stripePriceId).toBe('price_test_disintegration_2800');
    expect(snapshots.records.get(storeItem.variantId)).toMatchObject({
      amountMinor: 2800,
      currencyCode: 'EUR',
      stripePriceId: 'price_test_disintegration_2800',
    });
  });

  it('reports stale snapshots in dry-run without mutating D1', async () => {
    const price = createCatalogPrice({ priceId: 'price_test_disintegration_2800' });
    const { mappings, reconciler, snapshots, stripeCatalog } = createReconciler();
    stripeCatalog.prices.set(price.priceId, price);
    mappings.records.set(storeItem.variantId, {
      stripePriceId: price.priceId,
      variantId: storeItem.variantId,
    });
    snapshots.records.set(storeItem.variantId, {
      amountMinor: 2800,
      currencyCode: 'EUR',
      freshUntil: new Date('2026-05-22T10:00:00.000Z'),
      priceActive: true,
      productActive: true,
      storeItemSlug: storeItem.storeItemSlug,
      stripeLookupKey: createStripeCatalogLookupKey('uat', storeItem),
      stripePriceId: price.priceId,
      syncedAt: new Date('2026-05-21T10:00:00.000Z'),
      variantId: storeItem.variantId,
    });

    const result = await reconciler.reconcileVariant(storeItem, {
      apply: false,
      now: new Date('2026-05-23T10:00:00.000Z'),
    });

    expect(result.issues).toEqual([
      expect.objectContaining({
        code: 'snapshot_stale',
      }),
    ]);
    expect(result.actions).toEqual([{ kind: 'update_snapshot' }]);
    expect(snapshots.records.get(storeItem.variantId)?.freshUntil.toISOString()).toBe('2026-05-22T10:00:00.000Z');
  });

  it('replaces fixed Stripe Prices with custom pay-what-you-want Prices without writing fixed snapshots', async () => {
    const fixedPrice = createCatalogPrice({ amountMinor: 1000, priceId: 'price_test_disintegration_1000' });
    const { mappings, reconciler, snapshots, stripeCatalog } = createReconciler();
    stripeCatalog.prices.set(fixedPrice.priceId, fixedPrice);
    mappings.records.set(storeItem.variantId, {
      stripePriceId: fixedPrice.priceId,
      variantId: storeItem.variantId,
    });

    const result = await reconciler.reconcileVariant(storeItem, {
      apply: true,
      expectedPrice: {
        currencyCode: 'EUR',
        kind: 'pay_what_you_want',
        maximumAmountMinor: 10000,
        minimumAmountMinor: 100,
        presetAmountMinor: 500,
        revision: 'disintegration-black-vinyl-lp-pay-what-you-want-100-500-10000-eur',
      },
      now: new Date('2026-05-23T10:00:00.000Z'),
    });

    expect(result.issues).toEqual([]);
    expect(stripeCatalog.archivePrice).toHaveBeenCalledWith(
      fixedPrice.priceId,
      expect.objectContaining({
        idempotencyKey: expect.stringContaining('archive_price'),
      }),
    );
    expect(stripeCatalog.createCatalogPrice).toHaveBeenCalledWith(
      expect.objectContaining({
        currencyCode: 'EUR',
        kind: 'pay_what_you_want',
        maximumAmountMinor: 10000,
        minimumAmountMinor: 100,
        presetAmountMinor: 500,
      }),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining('pay-what-you-want-100-500-10000-eur'),
      }),
    );
    expect(result.resolvedPrice).toMatchObject({
      customUnitAmount: {
        maximumAmountMinor: 10000,
        minimumAmountMinor: 100,
        presetAmountMinor: 500,
      },
      priceKind: 'pay_what_you_want',
    });
    expect(result.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'archive_price', stripePriceId: fixedPrice.priceId }),
        expect.objectContaining({ kind: 'create_catalog_price' }),
        { kind: 'update_mapping', stripePriceId: 'price_test_disintegration_pay_what_you_want' },
      ]),
    );
    expect(result.actions).not.toEqual(expect.arrayContaining([{ kind: 'update_snapshot' }]));
    expect(snapshots.records.has(storeItem.variantId)).toBe(false);
  });

  it('repairs a stale D1 mapping when a correct active Price already exists', async () => {
    const stalePrice = {
      ...createCatalogPrice({ amountMinor: 1000, priceId: 'price_test_legacy_1000' }),
      lookupKey: 'blackbox_uat_disintegration_black_vinyl_lp_eur_1000',
      metadata: {},
      productMetadata: {},
    };
    const correctedPrice = createCatalogPrice({ priceId: 'price_test_disintegration_2800' });
    const { mappings, reconciler, snapshots, stripeCatalog } = createReconciler();
    stripeCatalog.prices.set(stalePrice.priceId, stalePrice);
    stripeCatalog.prices.set(correctedPrice.priceId, correctedPrice);
    mappings.records.set(storeItem.variantId, {
      stripePriceId: stalePrice.priceId,
      variantId: storeItem.variantId,
    });

    const result = await reconciler.reconcileVariant(storeItem, {
      apply: true,
      expectedPrice: fixedExpectedPrice(2800, 'disintegration-black-vinyl-lp-2800-eur'),
      now: new Date('2026-05-23T10:00:00.000Z'),
    });

    expect(result.issues).toEqual([expect.objectContaining({ code: 'wrong_variant_identity' })]);
    expect(result.actions).toEqual(
      expect.arrayContaining([
        { kind: 'update_mapping', stripePriceId: correctedPrice.priceId },
        { kind: 'update_snapshot' },
      ]),
    );
    expect(mappings.records.get(storeItem.variantId)?.stripePriceId).toBe(correctedPrice.priceId);
    expect(snapshots.records.get(storeItem.variantId)).toMatchObject({
      amountMinor: 2800,
      currencyCode: 'EUR',
      stripePriceId: correctedPrice.priceId,
    });
  });

  it('plans Product Projection updates separately from Price Authority', async () => {
    const price = {
      ...createCatalogPrice({ priceId: 'price_test_disintegration_2800' }),
      productDescription: 'Dashboard-edited description.',
      productImages: ['https://example.com/dashboard-image.jpg'],
      productName: 'Dashboard edited name',
    };
    const { reconciler, stripeCatalog } = createReconciler();
    stripeCatalog.prices.set(price.priceId, price);

    const result = await reconciler.reconcileVariant(storeItem, {
      apply: false,
      productProjection: {
        description: 'Disintegration by Afterwise.',
        imageUrls: ['https://blackbox-records-web.pages.dev/admin/media/releases/disintegration.jpg'],
        metadata: {
          sourceId: storeItem.sourceId,
          sourceKind: storeItem.sourceKind,
          storeItemSlug: storeItem.storeItemSlug,
          variantId: storeItem.variantId,
        },
        name: 'BlackBox Records - Disintegration - Black Vinyl LP',
        taxCode: null,
      },
    });

    expect(result.issues).toEqual([
      expect.objectContaining({
        code: 'product_projection_mismatch',
        driftCategory: 'product_projection',
      }),
    ]);
    expect(result.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'update_product_projection', productId: price.productId }),
      ]),
    );
    expect(result.actions).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'create_catalog_price' }),
        expect.objectContaining({ kind: 'archive_price', stripePriceId: price.priceId }),
      ]),
    );
  });

  it('keeps dry-run verification mutation-free for Stripe and D1 write paths', async () => {
    const price = {
      ...createCatalogPrice({ amountMinor: 1000, priceId: 'price_test_disintegration_1000' }),
      productDescription: 'Dashboard-edited description.',
    };
    const { mappings, reconciler, snapshots, stripeCatalog } = createReconciler();
    stripeCatalog.prices.set(price.priceId, price);
    mappings.records.set(storeItem.variantId, {
      stripePriceId: price.priceId,
      variantId: storeItem.variantId,
    });
    snapshots.records.set(storeItem.variantId, {
      amountMinor: 1000,
      currencyCode: 'EUR',
      freshUntil: new Date('2026-05-22T10:00:00.000Z'),
      priceActive: true,
      productActive: true,
      storeItemSlug: storeItem.storeItemSlug,
      stripeLookupKey: createStripeCatalogLookupKey('uat', storeItem),
      stripePriceId: price.priceId,
      syncedAt: new Date('2026-05-21T10:00:00.000Z'),
      variantId: storeItem.variantId,
    });

    const result = await reconciler.reconcileVariant(storeItem, {
      apply: false,
      expectedPrice: fixedExpectedPrice(),
      now: new Date('2026-05-23T10:00:00.000Z'),
      productProjection: {
        description: 'Disintegration by Afterwise.',
        imageUrls: ['https://blackbox-records-web.pages.dev/admin/media/releases/disintegration.jpg'],
        metadata: {
          sourceId: storeItem.sourceId,
          sourceKind: storeItem.sourceKind,
          storeItemSlug: storeItem.storeItemSlug,
          variantId: storeItem.variantId,
        },
        name: 'BlackBox Records - Disintegration - Black Vinyl LP',
        taxCode: null,
      },
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'product_projection_mismatch' }),
        expect.objectContaining({ code: 'snapshot_stale' }),
        expect.objectContaining({ code: 'wrong_amount' }),
      ]),
    );
    expect(result.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'archive_price', idempotencyKey: expect.stringContaining('archive_price') }),
        expect.objectContaining({
          kind: 'create_catalog_price',
          idempotencyKey: expect.stringContaining('create_catalog_price'),
        }),
        expect.objectContaining({ kind: 'update_product_projection', productId: price.productId }),
        { kind: 'update_snapshot' },
      ]),
    );
    expect(stripeCatalog.archivePrice).not.toHaveBeenCalled();
    expect(stripeCatalog.createCatalogPrice).not.toHaveBeenCalled();
    expect(stripeCatalog.updatePriceMetadata).not.toHaveBeenCalled();
    expect(stripeCatalog.updateProductProjection).not.toHaveBeenCalled();
    expect(mappings.records.get(storeItem.variantId)?.stripePriceId).toBe(price.priceId);
    expect(snapshots.records.get(storeItem.variantId)?.freshUntil.toISOString()).toBe('2026-05-22T10:00:00.000Z');
  });

  it('reports non-checkout variants without forcing Price Authority alignment', async () => {
    const { mappings, reconciler } = createReconciler({ storeItems: [storeItem, unavailableStoreItem] });
    mappings.records.set(unavailableStoreItem.variantId, {
      stripePriceId: stripePriceId('price_test_stale_unavailable'),
      variantId: unavailableStoreItem.variantId,
    });

    const result = await reconciler.verifyBuyableCatalog({
      apply: false,
      expectedPrices: new Map([[storeItem.variantId, fixedExpectedPrice()]]),
    });
    const unavailableResult = result.results.find(
      (item) => item.storeItem.variantId === unavailableStoreItem.variantId,
    );

    expect(unavailableResult).toMatchObject({
      actions: [],
      issueCount: 0,
      resolvedPrice: null,
    });
    expect(result.issues).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ variantId: unavailableStoreItem.variantId })]),
    );
  });

  it('reports malformed, legacy, foreign, and owned-orphan catalog identities without cleanup mutation', async () => {
    const { reconciler, stripeCatalog } = createReconciler();
    const currentPrice = createCatalogPrice({ priceId: 'price_test_disintegration_2800' });
    const orphanMetadata = {
      appEnv: 'uat' as const,
      sourceId: 'orphan-release',
      sourceKind: 'release' as const,
      storeItemSlug: 'orphan-release-black-vinyl-lp',
      variantId: 'variant_orphan-release-black-vinyl-lp_standard',
    };
    stripeCatalog.prices.set(currentPrice.priceId, currentPrice);
    stripeCatalog.prices.set('price_malformed', {
      ...createCatalogPrice({ priceId: 'price_malformed' }),
      lookupKey: 'blackbox:uat:missing-variant',
      metadata: {},
      productMetadata: {},
    });
    stripeCatalog.prices.set('price_legacy', {
      ...createCatalogPrice({ priceId: 'price_legacy' }),
      lookupKey: 'blackbox:sandbox:disintegration-black-vinyl-lp:variant_disintegration-black-vinyl-lp_standard',
      metadata: {
        ...createStripeCatalogMetadata('uat', storeItem),
        appEnv: 'sandbox',
      },
    });
    stripeCatalog.prices.set('price_foreign', createCatalogPrice({ environment: 'prd', priceId: 'price_foreign' }));
    stripeCatalog.prices.set('price_orphan', {
      ...createCatalogPrice({ priceId: 'price_orphan' }),
      lookupKey: 'blackbox:uat:orphan-release-black-vinyl-lp:variant_orphan-release-black-vinyl-lp_standard',
      metadata: orphanMetadata,
      productMetadata: orphanMetadata,
    });
    stripeCatalog.prices.set('price_partial_metadata_12345678', {
      ...createCatalogPrice({ priceId: 'price_partial_metadata_12345678' }),
      lookupKey: null,
      metadata: { appEnv: 'uat' },
      productMetadata: {},
    });
    stripeCatalog.prices.set('price_source_only_metadata_87654321', {
      ...createCatalogPrice({ priceId: 'price_source_only_metadata_87654321' }),
      lookupKey: null,
      metadata: { sourceId: 'orphan-release', sourceKind: 'release' },
      productMetadata: {},
    });
    stripeCatalog.prices.set('price_unowned', {
      ...createCatalogPrice({ priceId: 'price_unowned' }),
      lookupKey: null,
      metadata: {},
      productMetadata: {},
    });
    stripeCatalog.products.set('prod_orphan', {
      active: true,
      metadata: orphanMetadata,
      name: 'Orphan Release',
      productId: 'prod_orphan',
    });
    stripeCatalog.products.set('prod_partial_metadata_12345678', {
      active: true,
      metadata: { appEnv: 'uat' },
      name: 'Partial Product',
      productId: 'prod_partial_metadata_12345678',
    });
    stripeCatalog.products.set('prod_source_only_metadata_87654321', {
      active: true,
      metadata: { sourceId: 'orphan-release', sourceKind: 'release' },
      name: 'Source-only Product',
      productId: 'prod_source_only_metadata_87654321',
    });

    const result = await reconciler.verifyBuyableCatalog({
      apply: false,
      expectedPrices: new Map([[storeItem.variantId, fixedExpectedPrice()]]),
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'malformed_catalog_identity', driftCategory: 'catalog_identity' }),
        expect.objectContaining({ code: 'legacy_environment_identity', driftCategory: 'catalog_identity' }),
        expect.objectContaining({ code: 'foreign_environment_identity', driftCategory: 'catalog_identity' }),
        expect.objectContaining({ code: 'owned_orphan_price', driftCategory: 'catalog_identity' }),
        expect.objectContaining({ code: 'owned_orphan_product', driftCategory: 'catalog_identity' }),
      ]),
    );
    expect(result.issues).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ detail: expect.stringContaining('price_unowned') })]),
    );
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ detail: expect.stringContaining('price_...4321') }),
        expect.objectContaining({ detail: expect.stringContaining('prod_...4321') }),
      ]),
    );
    expect(stripeCatalog.archivePrice).not.toHaveBeenCalled();
    expect(stripeCatalog.updatePriceMetadata).not.toHaveBeenCalled();
    expect(stripeCatalog.updateProductProjection).not.toHaveBeenCalled();
  });

  it('aborts apply-mode mutation when global owned-object drift exists', async () => {
    const { reconciler, stripeCatalog } = createReconciler();
    stripeCatalog.prices.set(
      'price_test_disintegration_1000',
      createCatalogPrice({ amountMinor: 1000, priceId: 'price_test_disintegration_1000' }),
    );
    stripeCatalog.prices.set('price_orphan', {
      ...createCatalogPrice({ priceId: 'price_orphan' }),
      lookupKey: 'blackbox:uat:orphan-release-black-vinyl-lp:variant_orphan-release-black-vinyl-lp_standard',
      metadata: {
        appEnv: 'uat',
        sourceId: 'orphan-release',
        sourceKind: 'release',
        storeItemSlug: 'orphan-release-black-vinyl-lp',
        variantId: 'variant_orphan-release-black-vinyl-lp_standard',
      },
      productMetadata: {
        appEnv: 'uat',
        sourceId: 'orphan-release',
        sourceKind: 'release',
        storeItemSlug: 'orphan-release-black-vinyl-lp',
        variantId: 'variant_orphan-release-black-vinyl-lp_standard',
      },
    });

    const result = await reconciler.verifyBuyableCatalog({
      apply: true,
      expectedPrices: new Map([[storeItem.variantId, fixedExpectedPrice()]]),
    });

    expect(result.dryRun).toBe(true);
    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'owned_orphan_price' })]));
    expect(result.results[0]?.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'archive_price' }),
        expect.objectContaining({ kind: 'create_catalog_price' }),
      ]),
    );
    expect(stripeCatalog.archivePrice).not.toHaveBeenCalled();
    expect(stripeCatalog.createCatalogPrice).not.toHaveBeenCalled();
    expect(stripeCatalog.updatePriceMetadata).not.toHaveBeenCalled();
    expect(stripeCatalog.updateProductProjection).not.toHaveBeenCalled();
  });

  it('reports owned objects outside the expected environment catalog as orphan drift', async () => {
    const { reconciler, stripeCatalog } = createReconciler({ environment: 'prd' });
    stripeCatalog.prices.set(
      'price_live_unexpected_prd',
      createCatalogPrice({ environment: 'prd', priceId: 'price_live_unexpected_prd' }),
    );

    const result = await reconciler.verifyBuyableCatalog({
      apply: false,
      expectedPrices: new Map(),
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'owned_orphan_price', variantId: storeItem.variantId }),
        expect.objectContaining({ code: 'owned_orphan_product', variantId: storeItem.variantId }),
      ]),
    );
  });

  it('reports mixed lookup and metadata identities as malformed catalog identity', async () => {
    const { reconciler, stripeCatalog } = createReconciler();
    stripeCatalog.prices.set('price_mixed_identity', {
      ...createCatalogPrice({ priceId: 'price_mixed_identity' }),
      metadata: {
        appEnv: 'uat',
        sourceId: 'orphan-release',
        sourceKind: 'release',
        storeItemSlug: 'orphan-release-black-vinyl-lp',
        variantId: 'variant_orphan-release-black-vinyl-lp_standard',
      },
    });

    const result = await reconciler.verifyBuyableCatalog({
      apply: false,
      expectedPrices: new Map([[storeItem.variantId, fixedExpectedPrice()]]),
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'malformed_catalog_identity' })]),
    );
  });

  it('applies sandbox Product Projection updates with idempotency keys', async () => {
    const price = {
      ...createCatalogPrice({ priceId: 'price_test_disintegration_2800' }),
      productDescription: 'Dashboard-edited description.',
    };
    const { reconciler, stripeCatalog } = createReconciler();
    stripeCatalog.prices.set(price.priceId, price);

    const result = await reconciler.reconcileVariant(storeItem, {
      apply: true,
      productProjection: {
        description: 'Disintegration by Afterwise.',
        imageUrls: ['https://blackbox-records-web.pages.dev/admin/media/releases/disintegration.jpg'],
        metadata: {
          sourceId: storeItem.sourceId,
          sourceKind: storeItem.sourceKind,
          storeItemSlug: storeItem.storeItemSlug,
          variantId: storeItem.variantId,
        },
        name: 'BlackBox Records - Disintegration - Black Vinyl LP',
        taxCode: null,
      },
    });

    expect(stripeCatalog.updateProductProjection).toHaveBeenCalledWith(
      price.productId,
      expect.any(Object),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining('update_product_projection'),
      }),
    );
    expect(result.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'update_product_projection',
          replayed: true,
          requestId: 'req_update_product_projection',
        }),
      ]),
    );
  });

  it('fails closed when multiple active Stripe Prices match one Store Item variant', async () => {
    const { reconciler, stripeCatalog } = createReconciler();
    stripeCatalog.prices.set('price_test_one', createCatalogPrice({ priceId: 'price_test_one' }));
    stripeCatalog.prices.set('price_test_two', createCatalogPrice({ priceId: 'price_test_two' }));

    const result = await reconciler.reconcileVariant(storeItem, { apply: false });

    expect(result.resolvedPrice).toBeNull();
    expect(result.issues).toEqual([
      expect.objectContaining({ code: 'ambiguous_active_price' }),
      expect.objectContaining({ code: 'missing_price' }),
    ]);
  });

  it('salts create idempotency when replacing an inactive mapped Product', async () => {
    const stalePrice = createCatalogPrice({
      priceId: 'price_test_inactive_product',
      productActive: false,
    });
    const { mappings, reconciler, stripeCatalog } = createReconciler();
    stripeCatalog.prices.set(stalePrice.priceId, stalePrice);
    mappings.records.set(storeItem.variantId, {
      stripePriceId: stalePrice.priceId,
      variantId: storeItem.variantId,
    });

    const result = await reconciler.reconcileVariant(storeItem, {
      apply: true,
      expectedPrice: fixedExpectedPrice(2800, 'disintegration-black-vinyl-lp-2800-eur'),
      now: new Date('2026-05-23T10:00:00.000Z'),
    });

    expect(result.issues).toEqual([]);
    expect(stripeCatalog.createCatalogPrice).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining(
          'revision_disintegration-black-vinyl-lp-2800-eur:replace_price_v2_price_test_inactive_product_price_active_product_inactive',
        ),
      }),
    );
    expect(result.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'create_catalog_price' }),
        { kind: 'update_mapping', stripePriceId: 'price_test_disintegration_2800' },
        { kind: 'update_snapshot' },
      ]),
    );
  });

  it('salts create idempotency when a stale D1 mapping cannot be retrieved from Stripe', async () => {
    const { mappings, reconciler, stripeCatalog } = createReconciler();
    mappings.records.set(storeItem.variantId, {
      stripePriceId: stripePriceId('price_test_missing_in_stripe'),
      variantId: storeItem.variantId,
    });

    const result = await reconciler.reconcileVariant(storeItem, {
      apply: true,
      expectedPrice: fixedExpectedPrice(2800, 'disintegration-black-vinyl-lp-2800-eur'),
      now: new Date('2026-05-23T10:00:00.000Z'),
    });

    expect(result.issues).toEqual([]);
    expect(stripeCatalog.createCatalogPrice).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining(
          'revision_disintegration-black-vinyl-lp-2800-eur:replace_mapping_price_test_missing_in_stripe',
        ),
      }),
    );
  });

  it('applies production replacement Prices only through app-owned active matches', async () => {
    const oldPrice = createCatalogPrice({
      amountMinor: 1000,
      environment: 'prd',
      priceId: 'price_live_disintegration_1000',
    });
    const { mappings, reconciler, snapshots, stripeCatalog } = createReconciler({ environment: 'prd' });
    stripeCatalog.prices.set(oldPrice.priceId, oldPrice);
    mappings.records.set(storeItem.variantId, {
      stripePriceId: oldPrice.priceId,
      variantId: storeItem.variantId,
    });

    const result = await reconciler.reconcileVariant(storeItem, {
      apply: true,
      expectedPrice: fixedExpectedPrice(2800, 'disintegration-black-vinyl-lp-2800-eur'),
      now: new Date('2026-05-23T10:00:00.000Z'),
    });

    expect(result.issues).toEqual([]);
    expect(result.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'archive_price', stripePriceId: oldPrice.priceId }),
        expect.objectContaining({ kind: 'create_catalog_price' }),
        { kind: 'update_mapping', stripePriceId: 'price_live_disintegration_2800' },
        { kind: 'update_snapshot' },
      ]),
    );
    expect(stripeCatalog.archivePrice).toHaveBeenCalledWith(
      oldPrice.priceId,
      expect.objectContaining({
        idempotencyKey: expect.stringContaining('prd'),
      }),
    );
    expect(stripeCatalog.createCatalogPrice).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining('revision_disintegration-black-vinyl-lp-2800-eur'),
      }),
    );
    expect(mappings.records.get(storeItem.variantId)?.stripePriceId).toBe('price_live_disintegration_2800');
    expect(snapshots.records.get(storeItem.variantId)).toMatchObject({
      amountMinor: 2800,
      currencyCode: 'EUR',
      stripePriceId: 'price_live_disintegration_2800',
    });
  });

  it('does not mutate production metadata when the resolved Price is ambiguous or not app-owned', async () => {
    const wrongPrice = {
      ...createCatalogPrice({
        environment: 'prd',
        priceId: 'price_live_wrong_owner',
      }),
      lookupKey: 'other-app:production:disintegration-black-vinyl-lp',
      metadata: {},
      productMetadata: {},
    };
    const { mappings, reconciler, stripeCatalog } = createReconciler({ environment: 'prd' });
    stripeCatalog.prices.set(wrongPrice.priceId, wrongPrice);
    mappings.records.set(storeItem.variantId, {
      stripePriceId: wrongPrice.priceId,
      variantId: storeItem.variantId,
    });

    const result = await reconciler.reconcileVariant(storeItem, {
      apply: true,
      expectedPrice: fixedExpectedPrice(),
    });

    expect(result.issues).toEqual([
      expect.objectContaining({ code: 'wrong_variant_identity' }),
      expect.objectContaining({ code: 'missing_price' }),
    ]);
    expect(stripeCatalog.createCatalogPrice).not.toHaveBeenCalled();
    expect(stripeCatalog.archivePrice).not.toHaveBeenCalled();
    expect(stripeCatalog.updatePriceMetadata).not.toHaveBeenCalled();
    expect(stripeCatalog.updateProductProjection).not.toHaveBeenCalled();
  });
});
