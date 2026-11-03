import { afterEach, expect, test, vi } from 'vitest';
import { catalogNumberBackfillFixture } from './catalog-number-backfill.test-support';
import { stageUatPublishRequiredDetails } from './uat-publish-readiness';

afterEach(() => vi.restoreAllMocks());

function fixture() {
  const state = catalogNumberBackfillFixture(['caregivers', 'lotus', 'anarchotribal']);
  Object.assign(state.saved.get('draft-caregivers')!.data, { formats: ['Black Vinyl LP'] });
  Object.assign(state.saved.get('draft-lotus')!.data, { formats: ['Digital'] });
  Object.assign(state.saved.get('draft-anarchotribal')!.data, { formats: ['CD'], product_condition: 'used' });
  const distro = {
    id: 'cms-distro',
    slug: 'distro-record',
    liveRevisionId: 'live-distro',
    data: { product_condition: 'used' },
  };
  // The saved revision, rather than native listing data, determines what needs staging.
  state.saved.set('live-distro', { collection: 'distro', entryId: distro.id, data: { title: 'Private distro' } });
  state.find.mockImplementation(
    async (collection) => ({ items: collection === 'releases' ? state.items : [distro] }) as never,
  );
  state.update.mockImplementation(async (collection, id, input) => {
    const revision = [...state.saved.values()].find(
      (record) => record.collection === collection && record.entryId === id,
    )!;
    Object.assign(revision.data, input.data);
    return {} as never;
  });
  return state;
}

test('stages missing physical conditions privately, keeps Digital and Used unchanged, and becomes a no-op', async () => {
  const { saved, update } = fixture();
  const result = await stageUatPublishRequiredDetails({} as never, true);
  expect(result.checked).toEqual({ releases: 3, distro: 1 });
  expect(result.staged.filter((item) => item.field === 'product_condition')).toEqual([
    { collection: 'releases', slug: 'caregivers', field: 'product_condition' },
    { collection: 'distro', slug: 'distro-record', field: 'product_condition' },
  ]);
  expect(update).toHaveBeenCalledWith('releases', 'cms-caregivers', { data: { product_condition: 'new' } });
  expect(update).toHaveBeenCalledWith('distro', 'cms-distro', { data: { product_condition: 'new' } });
  expect(saved.get('draft-lotus')!.data.product_condition).toBeUndefined();
  expect(saved.get('draft-anarchotribal')!.data.product_condition).toBe('used');
  expect(saved.get('draft-caregivers')!.data.title).toBe('Private caregivers');
  expect(saved.get('live-distro')!.data.title).toBe('Private distro');
  update.mockClear();
  expect((await stageUatPublishRequiredDetails({} as never, true)).staged).toEqual([]);
  expect(update).not.toHaveBeenCalled();
});

test('reports unknown and invalid catalog numbers while staging known legacy assignments', async () => {
  const { saved, update } = catalogNumberBackfillFixture(['caregivers', 'unfinished-release', 'anarchotribal']);
  Object.assign(saved.get('draft-anarchotribal')!.data, { catalog_number: 'BBR#000' });
  const result = await stageUatPublishRequiredDetails({} as never, true);
  expect(result.checked).toEqual({ releases: 3, distro: 0 });
  expect(result.staged).toEqual([{ collection: 'releases', slug: 'caregivers', field: 'catalog_number' }]);
  expect(result.skipped).toEqual([
    { slug: 'unfinished-release', reason: expect.stringContaining('no owner-confirmed legacy assignment') },
    { slug: 'anarchotribal', reason: expect.stringContaining('Enter a catalog number') },
  ]);
  expect(update).toHaveBeenCalledExactlyOnceWith('releases', 'cms-caregivers', { data: { catalog_number: 'BBR#001' } });
  expect(saved.get('draft-anarchotribal')!.data.catalog_number).toBe('BBR#000');
});

test('reports catalog clashes without staging any numbers and still stages missing conditions', async () => {
  const { saved, update } = fixture();
  Object.assign(saved.get('draft-lotus')!.data, { catalog_number: 'BBR#001' });
  const result = await stageUatPublishRequiredDetails({} as never, true);
  expect(result.skipped).toEqual([
    { slug: 'catalog numbers', reason: expect.stringContaining('Catalog number BBR#001 is used by releases') },
  ]);
  expect(result.staged).toEqual([
    { collection: 'releases', slug: 'caregivers', field: 'product_condition' },
    { collection: 'distro', slug: 'distro-record', field: 'product_condition' },
  ]);
  expect(update).toHaveBeenCalledTimes(2);
  expect(update).toHaveBeenCalledWith('releases', 'cms-caregivers', { data: { product_condition: 'new' } });
  expect(update).toHaveBeenCalledWith('distro', 'cms-distro', { data: { product_condition: 'new' } });
  expect(saved.get('draft-caregivers')!.data.catalog_number).toBeUndefined();
  expect(saved.get('draft-anarchotribal')!.data.catalog_number).toBeUndefined();
  expect(saved.get('draft-lotus')!.data.catalog_number).toBe('BBR#001');
});

test('plans required details without writing or changing saved content by default', async () => {
  const { saved, update } = fixture();
  const before = structuredClone([...saved]);
  const result = await stageUatPublishRequiredDetails({} as never);
  expect(result.apply).toBe(false);
  expect(result.staged).toHaveLength(5);
  expect(update).not.toHaveBeenCalled();
  expect([...saved]).toEqual(before);
});
