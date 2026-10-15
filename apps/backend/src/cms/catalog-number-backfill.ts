import { ContentRepository, RevisionRepository } from 'emdash';
import type { EmDashRuntime } from 'emdash/middleware';
import { catalogNumberSchema, legacyReleaseCatalogNumber, releaseCatalogNumberClashes } from '@blackbox/content-model';

/** Explicit operator step. Stage private revisions; never publish or rewrite history. Pause editorial writes while applying. */
export async function backfillReleaseCatalogNumbers(db: EmDashRuntime['db'], apply = false) {
  const content = new ContentRepository(db);
  const revisions = new RevisionRepository(db);
  const records = [];
  let cursor: string | undefined;
  do {
    const page = await content.findMany('releases', { limit: 100, ...(cursor ? { cursor } : {}) });
    for (const item of page.items) {
      const revisionId = item.draftRevisionId ?? item.liveRevisionId;
      const revision = revisionId ? await revisions.findById(revisionId) : null;
      if (revisionId && (!revision || revision.entryId !== item.id || revision.collection !== 'releases'))
        throw new Error(`Release "${item.slug}" has an unavailable saved revision.`);
      const data = revision?.data ?? item.data;
      const slug = item.slug;
      if (!slug) throw new Error(`Release ${item.id} has no stable slug.`);
      const missing = data.catalog_number === undefined || data.catalog_number === null || data.catalog_number === '';
      const catalogNumber = missing ? legacyReleaseCatalogNumber(slug) : catalogNumberSchema.parse(data.catalog_number);
      records.push({
        collection: 'releases',
        id: item.id,
        slug,
        data: { ...data, catalog_number: catalogNumber },
        missing,
      });
    }
    cursor = page.nextCursor;
  } while (cursor);
  const clashes = releaseCatalogNumberClashes(records);
  if (clashes.length) throw new Error(clashes.map((clash) => clash.message).join('\n'));
  const plan = records
    .filter((record) => record.missing)
    .map(({ id, slug, data }) => ({ id, slug, catalogNumber: data.catalog_number }));
  // Validate the whole inventory before any write; native draft-aware staging preserves unrelated pending edits.
  if (apply)
    for (const record of plan)
      await content.updateDraftAware('releases', record.id, { data: { catalog_number: record.catalogNumber } });
  return { apply, releasesChecked: records.length, drafts: plan };
}
