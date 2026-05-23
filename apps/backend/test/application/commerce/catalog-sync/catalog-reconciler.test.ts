import { describe, expect, it, vi } from 'vitest';

import {
  CatalogReconciler,
  createStripeCatalogLookupKey,
  type StripeCatalogEnvironment,
  type StripeCatalogGateway,
  type StripeCatalogIdentityMetadata,
  type StripeCatalogPrice,
  type StripeCatalogPriceCreateInput,
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
  sourceId: 'barren-point',
  sourceKind: 'release',
  storeItemSlug: storeItemSlug('disintegration-black-vinyl-lp'),
  variantId: variantId('variant_barren-point_standard'),
};

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
  public readonly archivePrice = vi.fn(async (priceId: string) => {
    const price = this.prices.get(priceId);

    if (!price) {
      throw new Error(`Missing price ${priceId}.`);
    }

    const archived = { ...price, active: false };
    this.prices.set(priceId, archived);

    return archived;
  });
  public readonly prices = new Map<string, StripeCatalogPrice>();
  public readonly updatePriceMetadata = vi.fn(async (priceId: string, metadata: StripeCatalogIdentityMetadata) => {
    const price = this.prices.get(priceId);

    if (!price) {
      throw new Error(`Missing price ${priceId}.`);
    }

    const updated = { ...price, metadata, productMetadata: metadata };
    this.prices.set(priceId, updated);

    return updated;
  });

  public async createSandboxPrice(input: StripeCatalogPriceCreateInput): Promise<StripeCatalogPrice> {
    const price = createCatalogPrice({
      amountMinor: input.amountMinor,
      currencyCode: input.currencyCode,
      environment: input.metadata.appEnv,
      priceId: 'price_test_disintegration_2800',
    });
    this.prices.set(price.priceId, price);

    return price;
  }

  public async listPricesByLookupKey(lookupKey: string): Promise<StripeCatalogPrice[]> {
    return [...this.prices.values()].filter((price) => price.lookupKey === lookupKey);
  }

  public async listPricesByMetadata(metadata: StripeCatalogIdentityMetadata): Promise<StripeCatalogPrice[]> {
    return [...this.prices.values()].filter(
      (price) => hasMetadata(price.metadata, metadata) || hasMetadata(price.productMetadata, metadata),
    );
  }

  public async retrievePrice(priceId: string): Promise<StripeCatalogPrice | null> {
    return this.prices.get(priceId) ?? null;
  }
}

function createCatalogPrice(input: {
  active?: boolean;
  amountMinor?: number;
  currencyCode?: string;
  environment?: StripeCatalogEnvironment;
  priceId: string;
}): StripeCatalogPrice {
  const environment = input.environment ?? 'sandbox';
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
    amountMinor: input.amountMinor ?? 2800,
    currencyCode: input.currencyCode ?? 'EUR',
    lookupKey,
    metadata,
    priceId: stripePriceId(input.priceId),
    productActive: true,
    productId: `prod_${input.priceId}`,
    productMetadata: metadata,
  };
}

function createReconciler(
  input: {
    environment?: StripeCatalogEnvironment;
    mappings?: InMemoryVariantMappings;
    snapshots?: InMemoryStoreOfferSnapshots;
    stripeCatalog?: InMemoryStripeCatalog;
  } = {},
) {
  const environment = input.environment ?? 'sandbox';
  const mappings = input.mappings ?? new InMemoryVariantMappings();
  const snapshots = input.snapshots ?? new InMemoryStoreOfferSnapshots();
  const stripeCatalog = input.stripeCatalog ?? new InMemoryStripeCatalog();
  const reconciler = new CatalogReconciler({
    environment,
    storeItems: new InMemoryStoreItems([storeItem]),
    storeOfferSnapshots: snapshots,
    stripeCatalog,
    variantStripeMappings: mappings,
  });

  return { mappings, reconciler, snapshots, stripeCatalog };
}

function hasMetadata(candidate: Record<string, string>, expected: Record<string, string>): boolean {
  return Object.entries(expected).every(([key, value]) => candidate[key] === value);
}

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
      expectedPrice: {
        amountMinor: 2800,
        currencyCode: 'EUR',
      },
      now: new Date('2026-05-23T10:00:00.000Z'),
    });

    expect(result.issues).toEqual([]);
    expect(result.actions).toEqual(
      expect.arrayContaining([
        { kind: 'archive_price', stripePriceId: oldPrice.priceId },
        { kind: 'create_sandbox_price' },
        { kind: 'update_mapping', stripePriceId: 'price_test_disintegration_2800' },
        { kind: 'update_snapshot' },
      ]),
    );
    expect(stripeCatalog.archivePrice).toHaveBeenCalledWith('price_test_disintegration_1000');
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
      stripeLookupKey: createStripeCatalogLookupKey('sandbox', storeItem),
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
      expectedPrice: {
        amountMinor: 2800,
        currencyCode: 'EUR',
      },
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
});
