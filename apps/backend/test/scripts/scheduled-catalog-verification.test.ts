import { beforeEach, describe, expect, it, vi } from 'vitest';

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

function createBindings(appEnv: AppBindings['APP_ENV']): AppBindings {
  return {
    APP_ENV: appEnv,
    COMMERCE_DB: {} as AppBindings['COMMERCE_DB'],
    STRIPE_SECRET_KEY: 'sk_test_scheduled',
  } as AppBindings;
}

describe('runScheduledCatalogVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scheduledMocks.verifyBuyableCatalog.mockResolvedValue({
      issues: [],
    });
  });

  it('applies non-production scheduled catalog reconciliation and disconnects Prisma', async () => {
    await runScheduledCatalogVerification(createBindings('sandbox'));

    expect(scheduledMocks.verifyBuyableCatalog).toHaveBeenCalledWith({ apply: true });
    expect(scheduledMocks.disconnect).toHaveBeenCalledOnce();
  });

  it('runs production scheduled verification as report-only', async () => {
    await runScheduledCatalogVerification(createBindings('production'));

    expect(scheduledMocks.verifyBuyableCatalog).toHaveBeenCalledWith({ apply: false });
    expect(scheduledMocks.disconnect).toHaveBeenCalledOnce();
  });

  it('warns when scheduled verification reports catalog drift', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    scheduledMocks.verifyBuyableCatalog.mockResolvedValue({
      issues: [{}],
    });

    try {
      await runScheduledCatalogVerification(createBindings('sandbox'));
      expect(warn).toHaveBeenCalledWith('Scheduled Stripe catalog verification found 1 issue(s) in sandbox.');
    } finally {
      warn.mockRestore();
    }
  });
});
