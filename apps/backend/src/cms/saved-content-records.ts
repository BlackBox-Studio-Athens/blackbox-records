import { ContentRepository, RevisionRepository } from 'emdash';
import type { EmDashRuntime } from 'emdash/middleware';

export async function* readSavedContentRecords(db: EmDashRuntime['db'], collection: 'releases' | 'distro') {
  const content = new ContentRepository(db);
  const revisions = new RevisionRepository(db);
  const label = collection === 'releases' ? 'Release' : 'Distro item';
  let cursor: string | undefined;
  do {
    const page = await content.findMany(collection, { limit: 100, ...(cursor ? { cursor } : {}) });
    for (const item of page.items) {
      const revisionId = item.draftRevisionId ?? item.liveRevisionId;
      const revision = revisionId ? await revisions.findById(revisionId) : null;
      if (revisionId && (!revision || revision.entryId !== item.id || revision.collection !== collection))
        throw new Error(`${label} "${item.slug}" has an unavailable saved revision.`);
      if (!item.slug) throw new Error(`${label} ${item.id} has no stable slug.`);
      yield { collection, id: item.id, slug: item.slug, data: revision?.data ?? item.data };
    }
    cursor = page.nextCursor;
  } while (cursor);
}
