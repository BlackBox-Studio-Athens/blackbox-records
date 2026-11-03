import { vi } from 'vitest';
import { ContentRepository, RevisionRepository } from 'emdash';

export function catalogNumberBackfillFixture(slugs = ['caregivers', 'anarchotribal', 'disintegration', 'lotus']) {
  const items = slugs.map((slug) => ({ id: `cms-${slug}`, slug, draftRevisionId: `draft-${slug}`, data: {} }));
  const saved = new Map(
    items.map((item) => [
      item.draftRevisionId,
      { collection: 'releases', entryId: item.id, data: { title: `Private ${item.slug}` } as Record<string, unknown> },
    ]),
  );
  const find = vi.spyOn(ContentRepository.prototype, 'findMany').mockImplementation(async (collection) => {
    return { items: collection === 'releases' ? items : [] } as never;
  });
  vi.spyOn(RevisionRepository.prototype, 'findById').mockImplementation(async (id) => saved.get(id) as never);
  const update = vi.spyOn(ContentRepository.prototype, 'updateDraftAware').mockResolvedValue({} as never);
  return { items, saved, find, update };
}
