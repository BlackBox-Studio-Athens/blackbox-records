import { spawnSync } from 'node:child_process';
import { afterEach, expect, it, vi } from 'vitest';
import { CatalogReconciler } from '../../src/application/commerce/catalog-sync';
import { verifyStripeCatalog } from '../../../../scripts/stripe-catalog-verify';

vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }));
vi.mock('../../../../scripts/stripe-catalog-contract', () => ({
  loadStripeCatalogStoreItemContracts: () => {
    throw new Error('Repository migration input must not be loaded');
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const record = {
  storeItemSlug: 'member-created-item',
  variantId: 'variant_member-created-item_standard',
  sourceId: 'new-editorial-record',
  sourceKind: 'distro',
  cmsSourceId: 'cms-new-record',
  itemType: 'Vinyl 12-inch',
  priceKind: 'fixed',
  catalogAvailability: 'published',
  catalogRevision: 2,
  productProjection: JSON.stringify({
    name: 'Member title',
    description: 'Published copy',
    imageUrls: [],
    metadata: {},
    taxCode: null,
  }),
};

function d1(rows: unknown[]) {
  return {
    status: 0,
    stdout: JSON.stringify([{ success: true, results: rows }]),
    stderr: '',
    pid: 1,
    output: [],
  } as unknown as ReturnType<typeof spawnSync>;
}

it('checks persisted published items without loading repository contracts or imposing repository prices', async () => {
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fixture');
  vi.mocked(spawnSync)
    .mockReturnValueOnce(d1([record]))
    .mockReturnValueOnce(d1([{ ...record, amountMinor: 3700 }]));
  const verify = vi
    .spyOn(CatalogReconciler.prototype, 'verifyBuyableCatalog')
    .mockResolvedValue({ dryRun: true, environment: 'uat', issues: [], results: [] });
  await verifyStripeCatalog({ apply: false, environment: 'uat', promotionContext: null });
  expect(verify).toHaveBeenCalledWith({
    apply: false,
    expectedProductProjections: new Map([[record.variantId, JSON.parse(record.productProjection)]]),
  });
  expect(spawnSync).toHaveBeenCalledTimes(2);
  expect(JSON.stringify(vi.mocked(spawnSync).mock.calls)).toContain("catalogAvailability = 'published'");
  expect(JSON.stringify(vi.mocked(spawnSync).mock.calls)).not.toMatch(/INSERT|UPDATE|DELETE/);
});

it('fails closed on incomplete runtime setup before provider inspection', async () => {
  vi.mocked(spawnSync).mockReturnValueOnce(d1([{ ...record, cmsSourceId: null }]));
  await expect(verifyStripeCatalog({ apply: false, environment: 'uat', promotionContext: null })).rejects.toThrow(
    'Runtime catalog setup is incomplete',
  );
});

it('fails closed when a runtime identity disappears during verification', async () => {
  vi.mocked(spawnSync)
    .mockReturnValueOnce(d1([record]))
    .mockReturnValueOnce(d1([]));
  await expect(verifyStripeCatalog({ apply: false, environment: 'uat', promotionContext: null })).rejects.toThrow(
    'Runtime catalog identities changed',
  );
});
