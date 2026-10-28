import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppBindings } from './platform/env';
import { commerceRuntimeConfigFromBindings } from './platform/env';
import type * as MerchantSync from './application/commerce/merchant-sync';

const f = vi.hoisted(() => ({
  sync: vi.fn(),
  map: vi.fn(),
  load: vi.fn(),
  offer: vi.fn(),
  stock: vi.fn(),
  holds: vi.fn(),
  availability: vi.fn(),
  verify: vi.fn(),
  upsert: vi.fn(),
  remove: vi.fn(),
  stripe: vi.fn(),
  providerConfig: vi.fn(),
  log: vi.fn(),
  checkoutEnabled: vi.fn(),
}));
vi.mock('./application/commerce/merchant-sync', () => ({
  runMerchantSynchronization: f.sync,
  createMerchantProductInput: f.map,
}));
vi.mock('./application/commerce/checkout', () => ({ readStoreOffer: f.offer }));
vi.mock('./application/commerce/checkout/feature-flags', () => ({
  createFeatureFlagReader: () => ({ isNativeCheckoutEnabled: f.checkoutEnabled }),
}));
vi.mock('./application/commerce/catalog-sync', () => ({
  CatalogReconciler: class {},
  createRuntimeCatalogProductProjectionReader: vi.fn(),
}));
vi.mock('./cms/published-merchant-catalog', () => ({ loadPublishedMerchantCatalog: f.load }));
vi.mock('./infrastructure/google-merchant', () => ({
  GoogleMerchantAdapter: class {
    constructor(config: unknown) {
      f.providerConfig(config);
    }
    verifySource = f.verify;
    upsert = f.upsert;
    remove = f.remove;
    checkQuota = vi.fn();
  },
  GoogleMerchantError: class extends Error {},
}));
vi.mock('./infrastructure/persistence/d1-merchant-sync-repository', () => ({ D1MerchantSyncRepository: class {} }));
vi.mock('./infrastructure/persistence/d1-checkout-stock-hold-repository', () => ({
  D1CheckoutStockHoldRepository: class {
    findEffectiveAvailability = f.holds;
  },
}));
vi.mock('./infrastructure/persistence/prisma', () => ({
  createPrismaClient: vi.fn(),
  PrismaStoreItemOptionRepository: class {},
  PrismaItemAvailabilityRepository: class {
    findByVariantId = f.availability;
  },
  PrismaStockRepository: class {
    findByVariantId = f.stock;
  },
  PrismaStoreOfferSnapshotRepository: class {},
  PrismaVariantStripeMappingRepository: class {},
}));
vi.mock('./infrastructure/stripe', () => ({ createStripeCatalogGateway: f.stripe }));
vi.mock('./platform/observability', () => ({ createBindingLogger: () => ({ info: f.log, warn: f.log }) }));

import { merchantConfiguration, runMerchantSchedule } from './merchant-schedule';

const bindings = (): AppBindings => ({
  PRODUCT_ENVIRONMENT: 'UAT',
  COMMERCE_DB: {} as D1Database,
  STRIPE_SECRET_KEY: 'unused',
  STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'unused',
  MERCHANT_SYNC_ENABLED: 'true',
  MERCHANT_ACCOUNT_ID: '123',
  MERCHANT_DATA_SOURCE_ID: '456',
  MERCHANT_SERVICE_ACCOUNT_JSON: JSON.stringify({
    client_email: 'uat@project.iam.gserviceaccount.com',
    private_key: 'test-only',
  }),
});
const item = {
  variantId: 'variant_record_standard',
  storeItemSlug: 'record',
  sourceKind: 'release',
  sourceId: 'record',
};
const media = {} as R2Bucket;
const input = { offerId: item.variantId };
const completed = { outcome: 'completed', checked: 1, upserted: 1, removed: 0, failed: 0 };

describe('Merchant schedule composition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    f.sync.mockReset();
    f.load.mockResolvedValue({
      identity: 'accepted',
      snapshot: { storeItems: [item] },
      isCurrent: vi.fn().mockResolvedValue(true),
    });
    f.stock.mockResolvedValue({ variantId: item.variantId, quantity: 5, onlineQuantity: 5, preorder: null });
    f.holds.mockResolvedValue(2);
    f.availability.mockResolvedValue({ status: 'available', canBuy: true });
    f.offer.mockResolvedValue({ variantId: item.variantId, storeItemSlug: item.storeItemSlug });
    f.map.mockReturnValue(input);
    f.checkoutEnabled.mockResolvedValue(true);
    f.sync.mockResolvedValue({ ...completed, outcome: 'skipped' });
  });

  it('performs no work while disabled, in Local, or without separate PRD activation', async () => {
    for (const env of [
      { ...bindings(), MERCHANT_SYNC_ENABLED: undefined },
      { ...bindings(), MERCHANT_SYNC_ENABLED: 'invalid' },
      { ...bindings(), PRODUCT_ENVIRONMENT: 'LOCAL' as const },
      { ...bindings(), PRODUCT_ENVIRONMENT: 'PRD' as const },
    ])
      await runMerchantSchedule(env, undefined, 0);
    expect(f.sync).not.toHaveBeenCalled();
    expect(f.providerConfig).not.toHaveBeenCalled();
  });

  it('selects the environment account mode and actual public product origin', () => {
    expect(merchantConfiguration(bindings())).toMatchObject({
      expectedTestAccount: true,
      publicOrigin: 'https://blackbox-records-web-uat.pages.dev',
    });
    expect(
      merchantConfiguration({ ...bindings(), PRODUCT_ENVIRONMENT: 'PRD', PRD_MERCHANT_SYNC_APPROVED: 'true' }),
    ).toMatchObject({ expectedTestAccount: false, publicOrigin: 'https://blackboxrecordsathens.com' });
  });

  it('clears all Merchant options when absent from current runtime configuration', () => {
    const current = commerceRuntimeConfigFromBindings({
      ...bindings(),
      MERCHANT_SYNC_ENABLED: undefined,
      MERCHANT_ACCOUNT_ID: undefined,
      MERCHANT_DATA_SOURCE_ID: undefined,
      MERCHANT_SERVICE_ACCOUNT_JSON: undefined,
      PRD_MERCHANT_SYNC_APPROVED: undefined,
    });
    for (const key of [
      'MERCHANT_SYNC_ENABLED',
      'MERCHANT_ACCOUNT_ID',
      'MERCHANT_DATA_SOURCE_ID',
      'MERCHANT_SERVICE_ACCOUNT_JSON',
      'PRD_MERCHANT_SYNC_APPROVED',
    ] as const)
      expect(current).toHaveProperty(key, undefined);
  });

  it('logs only a safe reason for invalid credentials, without starting sync', async () => {
    await runMerchantSchedule(
      { ...bindings(), MERCHANT_SERVICE_ACCOUNT_JSON: 'private-secret-invalid-json' },
      media,
      0,
    );
    expect(f.sync).not.toHaveBeenCalled();
    expect(JSON.stringify(f.log.mock.calls)).not.toContain('private-secret');
    expect(f.log).toHaveBeenCalledWith(expect.objectContaining({ safeReason: 'configuration_or_storage' }));
  });

  it('reuses effective holds and raw pre-order state and verifies Google only before a mutation', async () => {
    const raw = { shipEstimate: { kind: 'date', date: '2020-01-01' }, startedAt: '2019-01-01' };
    f.stock.mockResolvedValue({ variantId: item.variantId, quantity: 5, onlineQuantity: 5, preorder: raw });
    f.sync.mockImplementation(async (deps) => {
      await deps.readCatalog();
      await deps.readInput(item);
      expect(f.verify).not.toHaveBeenCalled();
      return completed;
    });
    await runMerchantSchedule(bindings(), media, 0);
    expect(f.map).toHaveBeenCalledWith(
      expect.anything(),
      item,
      expect.anything(),
      expect.objectContaining({ onlineQuantity: 2, preorder: raw }),
      expect.any(String),
    );
    expect(f.stripe).toHaveBeenCalledWith(expect.anything(), { timeout: 3000, maxNetworkRetries: 0 });
    expect(f.sync.mock.calls[0][0].scope).toEqual({ environment: 'uat', accountId: '123', dataSourceId: '456' });
  });

  it('checks source once per writing batch and rechecks stock after Google verification', async () => {
    f.sync.mockImplementation(async (deps) => {
      await deps.readCatalog();
      await deps.readInput(item);
      await deps.provider.upsert(input);
      f.holds.mockResolvedValue(0);
      await expect(deps.provider.upsert(input)).rejects.toThrow('Availability changed');
      return completed;
    });
    await runMerchantSchedule(bindings(), media, 0);
    expect(f.verify).toHaveBeenCalledTimes(1);
    expect(f.upsert).toHaveBeenCalledTimes(1);
  });

  it('preserves uncertainty for a mismatched offer even if the local variant is unavailable', async () => {
    f.offer.mockResolvedValue({ variantId: 'different', storeItemSlug: item.storeItemSlug });
    f.availability.mockResolvedValue({ status: 'sold_out', canBuy: false });
    f.sync.mockImplementation(async (deps) => {
      await deps.readCatalog();
      await expect(deps.readInput(item)).rejects.toThrow('identity is uncertain');
      return completed;
    });
    await runMerchantSchedule(bindings(), media, 0);
    expect(f.remove).not.toHaveBeenCalled();
  });

  it('removes offers when checkout closes and does not skip synchronization', async () => {
    f.checkoutEnabled.mockResolvedValue(false);
    f.sync.mockImplementation(async (deps) => {
      await deps.readCatalog();
      expect(await deps.readInput(item)).toBeNull();
      await deps.provider.remove(item.variantId);
      return { ...completed, upserted: 0, removed: 1 };
    });
    await runMerchantSchedule(bindings(), media, 0);
    expect(f.offer).not.toHaveBeenCalled();
    expect(f.remove).toHaveBeenCalledWith(item.variantId);
  });

  it('does not upsert if checkout closes during Google source verification', async () => {
    f.sync.mockImplementation(async (deps) => {
      await deps.readCatalog();
      await deps.readInput(item);
      f.checkoutEnabled.mockResolvedValue(false);
      await expect(deps.provider.upsert(input)).rejects.toThrow('Checkout closed');
      return completed;
    });
    await runMerchantSchedule(bindings(), media, 0);
    expect(f.upsert).not.toHaveBeenCalled();
  });

  it('preserves a managed offer when its strict checkout-gate read fails', async () => {
    const { runMerchantSynchronization } = await vi.importActual<typeof MerchantSync>(
      './application/commerce/merchant-sync',
    );
    f.checkoutEnabled.mockRejectedValue(new Error('Checkout flag evaluation is unavailable.'));
    const manageOffer = vi.fn();
    f.sync.mockImplementation(async (deps) =>
      runMerchantSynchronization({
        ...deps,
        repository: {
          claimRun: async () => ({ scope: deps.scope, token: 'test', cursor: null, quotaBlocked: false }),
          listManaged: async () => [{ ...item, inputHash: 'last-good', submittedAt: '2026-01-01T00:00:00Z' }],
          isClaimCurrent: async () => true,
          manageOffer,
          saveSubmitted: vi.fn(),
          removeManaged: vi.fn(),
          clearQuotaBlock: vi.fn(),
          deferQuota: vi.fn(),
          finishRun: async () => true,
        },
      }),
    );
    await runMerchantSchedule(bindings(), media, 0);
    expect(f.checkoutEnabled).toHaveBeenCalledWith({ throwOnError: true });
    expect(manageOffer).not.toHaveBeenCalled();
    expect(f.verify).not.toHaveBeenCalled();
    expect(f.remove).not.toHaveBeenCalled();
    expect(f.upsert).not.toHaveBeenCalled();
    expect(f.log).toHaveBeenCalledWith(expect.objectContaining({ failed: 1, safeReason: 'source_uncertain' }));
  });
});
