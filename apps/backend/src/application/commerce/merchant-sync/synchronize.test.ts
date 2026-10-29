import { describe, expect, it, vi } from 'vitest';
import type { MerchantProductInput } from './product';
import {
  runMerchantSynchronization,
  type MerchantCatalogItem,
  type MerchantManagedOffer,
  type MerchantRunClaim,
  type MerchantSyncRepository,
} from './synchronize';

const at = new Date('2026-10-27T12:00:00Z');
const scope = { environment: 'UAT', accountId: '123', dataSourceId: '456' };
const item = (id: string): MerchantCatalogItem => ({ variantId: id, storeItemSlug: `item-${id}` });
const input = (id: string): MerchantProductInput => ({
  offerId: id,
  contentLanguage: 'en',
  feedLabel: 'GR',
  productAttributes: {
    title: 'Record',
    description: 'Record',
    link: 'https://example.com/store/record/',
    imageLink: 'https://example.com/record.jpg',
    availability: 'IN_STOCK',
    condition: 'NEW',
    price: { amountMicros: '20000000', currencyCode: 'EUR' },
  },
});

function fixture(ids = ['a']) {
  const managed = new Map<string, MerchantManagedOffer>();
  let cursor: string | null = null;
  const claim: MerchantRunClaim = { scope, token: 'claim', cursor, quotaBlocked: false };
  const repository = {
    claimRun: vi.fn<MerchantSyncRepository['claimRun']>(async () => ({ ...claim, cursor })),
    listManaged: vi.fn<MerchantSyncRepository['listManaged']>(async () => [...managed.values()]),
    isClaimCurrent: vi.fn<MerchantSyncRepository['isClaimCurrent']>(async () => true),
    manageOffer: vi.fn<MerchantSyncRepository['manageOffer']>(async (_claim, value) => {
      managed.set(value.variantId, {
        ...value,
        inputHash: null,
        submittedAt: managed.get(value.variantId)?.submittedAt ?? null,
      });
      return true;
    }),
    saveSubmitted: vi.fn<MerchantSyncRepository['saveSubmitted']>(async (_claim, id, hash, now) => {
      managed.set(id, { ...managed.get(id)!, inputHash: hash, submittedAt: now.toISOString() });
      return true;
    }),
    removeManaged: vi.fn<MerchantSyncRepository['removeManaged']>(async (_claim, id) => managed.delete(id)),
    clearQuotaBlock: vi.fn<MerchantSyncRepository['clearQuotaBlock']>(async () => true),
    deferQuota: vi.fn<MerchantSyncRepository['deferQuota']>(async () => true),
    finishRun: vi.fn<MerchantSyncRepository['finishRun']>(async (_claim, next) => {
      cursor = next;
      return true;
    }),
  } satisfies MerchantSyncRepository;
  const deps = {
    repository,
    scope,
    now: at,
    currentTime: () => at,
    provider: { upsert: vi.fn(async (_input: MerchantProductInput) => {}), remove: vi.fn(async (_id: string) => {}) },
    readCatalog: vi.fn(async () => ({ revision: 'accepted-1', items: ids.map(item) })),
    readInput: vi.fn(async (value: MerchantCatalogItem): Promise<MerchantProductInput | null> =>
      input(value.variantId),
    ),
    isCurrent: vi.fn(async () => true),
  };
  return { deps, managed };
}

describe('bounded Merchant reconciliation', () => {
  it('rotates across accepted and managed identities, advances failures and checks at most two', async () => {
    const { deps, managed } = fixture(['a', 'b', 'c', 'd', 'e', 'f']);
    managed.set('g', { ...item('g'), inputHash: null, submittedAt: null });
    deps.readInput.mockImplementation(async (value) => {
      if (value.variantId === 'a') throw new Error('Unknown price');
      return input(value.variantId);
    });
    expect(await runMerchantSynchronization(deps)).toMatchObject({ checked: 2, upserted: 1, failed: 1 });
    expect(deps.readInput.mock.calls.map(([value]) => value.variantId)).toEqual(['a', 'b']);
    deps.readInput.mockClear();
    await runMerchantSynchronization(deps);
    expect(deps.readInput.mock.calls.map(([value]) => value.variantId)).toEqual(['c', 'd']);
    await runMerchantSynchronization(deps);
    await runMerchantSynchronization(deps);
    expect(deps.provider.remove).toHaveBeenCalledWith('g');
  });

  it('preserves managed offers when the accepted inventory read fails or repeats an identity', async () => {
    const { deps, managed } = fixture();
    managed.set('old', { ...item('old'), inputHash: null, submittedAt: null });
    deps.readCatalog.mockRejectedValueOnce(new Error('Incomplete page'));
    expect(await runMerchantSynchronization(deps)).toMatchObject({ outcome: 'failed', checked: 0 });
    deps.readCatalog.mockResolvedValue({ revision: 'accepted-1', items: [item('a'), item('a')] });
    expect(await runMerchantSynchronization(deps)).toMatchObject({ outcome: 'failed', checked: 0 });
    expect(deps.provider.remove).not.toHaveBeenCalled();
    expect(deps.provider.upsert).not.toHaveBeenCalled();
  });

  it('rejects repeated slugs and an inventory beyond the explicit cap before effects', async () => {
    const { deps } = fixture();
    deps.readCatalog.mockResolvedValueOnce({
      revision: 'accepted-1',
      items: [item('a'), { ...item('b'), storeItemSlug: 'item-a' }],
    });
    expect(await runMerchantSynchronization(deps)).toMatchObject({ outcome: 'failed', checked: 0 });
    deps.readCatalog.mockResolvedValueOnce({
      revision: 'accepted-1',
      items: Array.from({ length: 1001 }, (_, id) => item(String(id))),
    });
    expect(await runMerchantSynchronization(deps)).toMatchObject({ outcome: 'failed', checked: 0 });
    expect(deps.provider.upsert).not.toHaveBeenCalled();
  });

  it('does not refresh an unchanged offer until seven days and rechecks current input each pass', async () => {
    const { deps } = fixture();
    await runMerchantSynchronization(deps);
    deps.currentTime = () => new Date(at.getTime() + 7 * 86400000 - 1);
    expect(await runMerchantSynchronization(deps)).toMatchObject({ checked: 1, upserted: 0 });
    deps.currentTime = () => new Date(at.getTime() + 7 * 86400000);
    expect(await runMerchantSynchronization(deps)).toMatchObject({ upserted: 1 });
    expect(deps.readInput).toHaveBeenCalledTimes(3);
    expect(deps.provider.upsert).toHaveBeenCalledTimes(2);
  });

  it('retains first-insert ownership across a lost success save, then removes a withdrawn offer', async () => {
    const { deps, managed } = fixture();
    deps.repository.saveSubmitted.mockRejectedValueOnce(new Error('D1 unavailable'));
    expect(await runMerchantSynchronization(deps)).toMatchObject({ failed: 1 });
    expect(managed.get('a')).toMatchObject({ inputHash: null, submittedAt: null });
    deps.readCatalog.mockResolvedValue({ revision: 'accepted-2', items: [] });
    expect(await runMerchantSynchronization(deps)).toMatchObject({ removed: 1 });
    expect(deps.provider.remove).toHaveBeenCalledWith('a');
    expect(managed.size).toBe(0);
  });

  it('removes verified ineligible offers and reinserts the same identity when eligible', async () => {
    const { deps } = fixture();
    await runMerchantSynchronization(deps);
    deps.readInput.mockResolvedValueOnce(null);
    expect(await runMerchantSynchronization(deps)).toMatchObject({ removed: 1 });
    expect(await runMerchantSynchronization(deps)).toMatchObject({ upserted: 1 });
    expect(deps.provider.upsert.mock.calls.map(([value]) => value.offerId)).toEqual(['a', 'a']);
  });

  it('resubmits the current input after an uncertain update even if it reverts to the prior successful hash', async () => {
    const { deps, managed } = fixture();
    await runMerchantSynchronization(deps);
    const changed = input('a');
    changed.productAttributes.price.amountMicros = '30000000';
    deps.readInput.mockResolvedValueOnce(changed);
    deps.repository.saveSubmitted.mockRejectedValueOnce(new Error('Lost update save'));
    expect(await runMerchantSynchronization(deps)).toMatchObject({ failed: 1 });
    expect(managed.get('a')?.inputHash).toBeNull();
    expect(await runMerchantSynchronization(deps)).toMatchObject({ upserted: 1 });
    expect(deps.provider.upsert.mock.calls.map(([value]) => value.productAttributes.price.amountMicros)).toEqual([
      '20000000',
      '30000000',
      '20000000',
    ]);
  });

  it('reinserts a restocked offer after an accepted deletion whose ledger cleanup fails', async () => {
    const { deps, managed } = fixture();
    await runMerchantSynchronization(deps);
    deps.readInput.mockResolvedValueOnce(null);
    deps.repository.removeManaged.mockRejectedValueOnce(new Error('Lost delete save'));
    expect(await runMerchantSynchronization(deps)).toMatchObject({ failed: 1 });
    expect(deps.provider.remove).toHaveBeenCalledWith('a');
    expect(managed.get('a')?.inputHash).toBeNull();
    expect(await runMerchantSynchronization(deps)).toMatchObject({ upserted: 1 });
    expect(deps.provider.upsert).toHaveBeenCalledTimes(2);
  });

  it('never changes provider state after a publication switch or lost claim', async () => {
    const { deps } = fixture();
    deps.isCurrent.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    expect(await runMerchantSynchronization(deps)).toMatchObject({ outcome: 'superseded' });
    expect(deps.provider.upsert).not.toHaveBeenCalled();
    deps.repository.isClaimCurrent.mockResolvedValue(false);
    expect(await runMerchantSynchronization(deps)).toMatchObject({ outcome: 'lease_lost' });
    expect(deps.provider.remove).not.toHaveBeenCalled();
  });

  it('stops a batch on source authentication/quota failure without retrying in this run', async () => {
    const { deps } = fixture(['a', 'b']);
    const failure = new Error('Do not expose provider message');
    deps.provider.upsert.mockRejectedValueOnce(failure);
    const result = await runMerchantSynchronization({
      ...deps,
      isSourceFailure: (error) => error === failure,
      errorReason: () => 'quota',
    });
    expect(result).toMatchObject({ outcome: 'source_stopped', checked: 1, failed: 1, safeReason: 'quota' });
    expect(deps.provider.upsert).toHaveBeenCalledTimes(1);
  });

  it('skips preparation and reads when not due; prepares only after the claim', async () => {
    const { deps } = fixture();
    deps.repository.claimRun.mockResolvedValueOnce(null);
    const prepare = vi.fn(async () => {});
    expect(await runMerchantSynchronization({ ...deps, prepare })).toMatchObject({ outcome: 'skipped' });
    expect(prepare).not.toHaveBeenCalled();
    expect(deps.readCatalog).not.toHaveBeenCalled();
    await runMerchantSynchronization({ ...deps, prepare });
    expect(prepare).toHaveBeenCalledOnce();
  });

  it('persists a quota stop until the next noon UTC instead of retrying the batch', async () => {
    const { deps } = fixture(['a', 'b']);
    const quota = new Error('Quota');
    deps.provider.upsert.mockRejectedValueOnce(quota);
    expect(await runMerchantSynchronization({ ...deps, isQuotaFailure: (error) => error === quota })).toMatchObject({
      outcome: 'source_stopped',
      checked: 1,
    });
    expect(deps.repository.deferQuota).toHaveBeenCalledWith(expect.anything(), new Date('2026-10-28T12:00:00Z'), at);
    expect(deps.provider.upsert).toHaveBeenCalledTimes(1);
  });

  it('requires successful quota verification before clearing a retained block and writing again', async () => {
    const { deps } = fixture();
    const claim: MerchantRunClaim = { scope, token: 'claim', cursor: null, quotaBlocked: true };
    deps.repository.claimRun.mockResolvedValue(claim);
    const checkQuota = vi.fn(async () => {
      throw new Error('Quota read failed');
    });
    expect(await runMerchantSynchronization({ ...deps, checkQuota })).toMatchObject({ outcome: 'failed' });
    expect(deps.repository.clearQuotaBlock).not.toHaveBeenCalled();
    expect(deps.provider.upsert).not.toHaveBeenCalled();
    const events: string[] = [];
    deps.provider.upsert.mockImplementation(async () => {
      events.push('write');
    });
    deps.repository.clearQuotaBlock.mockImplementation(async () => {
      events.push('clear');
      return true;
    });
    await runMerchantSynchronization({
      ...deps,
      checkQuota: async () => {
        events.push('check');
      },
    });
    expect(events).toEqual(['check', 'clear', 'write']);
  });
});
