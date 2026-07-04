import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const scheduledMocks = vi.hoisted(() => ({
  createStripeCatalogGateway: vi.fn(() => ({})),
  disconnect: vi.fn(),
  verifyBuyableCatalog: vi.fn(),
}));

vi.mock('../../src/application/commerce/catalog-sync', () => ({
  CatalogReconciler: vi.fn(function CatalogReconciler() {
    return {
      verifyBuyableCatalog: scheduledMocks.verifyBuyableCatalog,
    };
  }),
  createCurrentCatalogExpectedProductProjectionMap: vi.fn(
    () =>
      new Map([
        [
          'variant_disintegration-black-vinyl-lp_standard',
          {
            name: 'BlackBox Records - Disintegration - Black Vinyl LP',
          },
        ],
      ]),
  ),
  createCurrentCatalogExpectedSandboxPriceMap: vi.fn((environment: string) =>
    environment === 'uat'
      ? new Map([['variant_disintegration-black-vinyl-lp_standard', { amountMinor: 2800 }]])
      : new Map(),
  ),
}));

vi.mock('../../src/infrastructure/persistence/prisma', () => ({
  createPrismaClient: vi.fn(() => ({
    $disconnect: scheduledMocks.disconnect,
  })),
  PrismaStoreItemOptionRepository: vi.fn(function PrismaStoreItemOptionRepository() {
    return {};
  }),
  PrismaStoreOfferSnapshotRepository: vi.fn(function PrismaStoreOfferSnapshotRepository() {
    return {};
  }),
  PrismaVariantStripeMappingRepository: vi.fn(function PrismaVariantStripeMappingRepository() {
    return {};
  }),
}));

vi.mock('../../src/infrastructure/stripe', () => ({
  createStripeCatalogGateway: scheduledMocks.createStripeCatalogGateway,
}));

import { runScheduledCatalogVerification } from '../../src/interfaces/scheduled/catalog-verification';
import type { AppBindings } from '../../src/env';

function createBindings(appEnv: AppBindings['PRODUCT_ENVIRONMENT']): AppBindings {
  return {
    PRODUCT_ENVIRONMENT: appEnv,
    COMMERCE_DB: {} as AppBindings['COMMERCE_DB'],
    STRIPE_SECRET_KEY: 'sk_test_scheduled',
  } as AppBindings;
}

describe('runScheduledCatalogVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    scheduledMocks.verifyBuyableCatalog.mockResolvedValue({
      issues: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs UAT scheduled catalog reconciliation as report-only and disconnects Prisma', async () => {
    await runScheduledCatalogVerification(createBindings('UAT'));

    expect(scheduledMocks.verifyBuyableCatalog).toHaveBeenCalledWith({
      apply: false,
      expectedPrices: expect.any(Map),
      expectedProductProjections: expect.any(Map),
    });
    expect(
      scheduledMocks.verifyBuyableCatalog.mock.calls[0]?.[0].expectedProductProjections.get(
        'variant_disintegration-black-vinyl-lp_standard',
      ),
    ).toMatchObject({
      name: 'BlackBox Records - Disintegration - Black Vinyl LP',
    });
    expect(scheduledMocks.disconnect).toHaveBeenCalledOnce();
  });

  it('runs production scheduled verification as report-only', async () => {
    await runScheduledCatalogVerification(createBindings('PRD'));

    expect(scheduledMocks.verifyBuyableCatalog).toHaveBeenCalledWith({
      apply: false,
      expectedPrices: expect.any(Map),
      expectedProductProjections: expect.any(Map),
    });
    expect(scheduledMocks.verifyBuyableCatalog.mock.calls[0]?.[0].expectedPrices.size).toBe(0);
    expect(scheduledMocks.disconnect).toHaveBeenCalledOnce();
  });

  it('warns when scheduled verification reports catalog drift', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    scheduledMocks.verifyBuyableCatalog.mockResolvedValue({
      issues: [
        {
          driftCategory: 'product_projection',
        },
        {
          driftCategory: 'price_authority',
        },
      ],
    });

    try {
      await runScheduledCatalogVerification(createBindings('UAT'));
      expect(warn).toHaveBeenCalledWith(
        expect.objectContaining({
          d1ReadinessIssues: 0,
          catalogIdentityIssues: 0,
          event: 'catalog_verification_scheduled_issue_summary',
          issueCount: 2,
          outcome: 'issues_found',
          priceAuthorityIssues: 1,
          productEnvironment: 'UAT',
          productProjectionIssues: 1,
          safeReason: 'catalog_drift',
          storeOfferSnapshotIssues: 0,
          workerDeploymentTarget: 'uat',
        }),
      );
    } finally {
      warn.mockRestore();
    }
  });
});
