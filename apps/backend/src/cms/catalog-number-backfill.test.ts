import { afterEach, expect, test, vi } from 'vitest';
import { ContentRepository, RevisionRepository } from 'emdash';
import { backfillReleaseCatalogNumbers } from './catalog-number-backfill';

afterEach(() => vi.restoreAllMocks());

function fixture(slugs = ['caregivers', 'anarchotribal', 'disintegration', 'lotus']) {
  const items = slugs.map((slug) => ({ id: `cms-${slug}`, slug, draftRevisionId: `draft-${slug}`, data: {} }));
  const saved = new Map(
    items.map((item) => [
      item.draftRevisionId,
      { collection: 'releases', entryId: item.id, data: { title: `Private ${item.slug}` } },
    ]),
  );
  const find = vi.spyOn(ContentRepository.prototype, 'findMany').mockResolvedValue({ items } as never);
  vi.spyOn(RevisionRepository.prototype, 'findById').mockImplementation(async (id) => saved.get(id) as never);
  const update = vi.spyOn(ContentRepository.prototype, 'updateDraftAware').mockResolvedValue({} as never);
  return { items, saved, find, update };
}

test('backfill checks the whole inventory by default and stages only missing fields through native draft-aware writes', async () => {
  const { update, saved } = fixture();
  const before = structuredClone([...saved]);
  const plan = await backfillReleaseCatalogNumbers({} as never);
  expect(plan.drafts.map((draft) => draft.catalogNumber)).toEqual(['BBR#001', 'BBR#003', 'BBR#002', 'BBR#004']);
  expect(update).not.toHaveBeenCalled();
  await backfillReleaseCatalogNumbers({} as never, true);
  expect(update).toHaveBeenCalledTimes(4);
  expect(update).toHaveBeenNthCalledWith(1, 'releases', 'cms-caregivers', { data: { catalog_number: 'BBR#001' } });
  expect(update).toHaveBeenNthCalledWith(2, 'releases', 'cms-anarchotribal', { data: { catalog_number: 'BBR#003' } });
  expect(update).toHaveBeenNthCalledWith(3, 'releases', 'cms-disintegration', { data: { catalog_number: 'BBR#002' } });
  expect(update).toHaveBeenNthCalledWith(4, 'releases', 'cms-lotus', { data: { catalog_number: 'BBR#004' } });
  expect([...saved]).toEqual(before);
});

test('backfill is idempotent for complete drafts, reads all pages and fails before writing unknown identities or clashes', async () => {
  const { items, saved, find, update } = fixture(['caregivers', 'fictional-unmapped-release']);
  find
    .mockResolvedValueOnce({ items: items.slice(0, 1), nextCursor: 'next' } as never)
    .mockResolvedValueOnce({ items: items.slice(1) } as never);
  await expect(backfillReleaseCatalogNumbers({} as never, true)).rejects.toThrow(
    '"fictional-unmapped-release" has no catalog number',
  );
  expect(find).toHaveBeenNthCalledWith(2, 'releases', { limit: 100, cursor: 'next' });
  expect(update).not.toHaveBeenCalled();
  const unmapped = saved.get('draft-fictional-unmapped-release')!;
  Object.assign(unmapped.data, { catalog_number: 'BBR#001' });
  await expect(backfillReleaseCatalogNumbers({} as never, true)).rejects.toThrow(
    'Catalog number BBR#001 is used by releases',
  );
  expect(update).not.toHaveBeenCalled();
  Object.assign(unmapped.data, { catalog_number: 'BBR#004' });
  Object.assign(saved.get('draft-caregivers')!.data, { catalog_number: 'BBR#001' });
  expect((await backfillReleaseCatalogNumbers({} as never, true)).drafts).toEqual([]);
  expect(update).not.toHaveBeenCalled();
  Object.assign(unmapped.data, { catalog_number: 'BBR#000' });
  await expect(backfillReleaseCatalogNumbers({} as never, true)).rejects.toThrow('Enter a catalog number');
});
