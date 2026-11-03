import { ContentRepository } from 'emdash';
import type { EmDashRuntime } from 'emdash/middleware';
import { catalogNumberSchema, legacyReleaseCatalogNumber, releaseCatalogNumberClashes } from '@blackbox/content-model';
import { readSavedContentRecords } from './saved-content-records';

/** Explicit operator step. Stage private revisions; never publish or rewrite history. Pause editorial writes while applying. */
export async function backfillReleaseCatalogNumbers(
  db: EmDashRuntime['db'],
  apply = false,
  options: { skipUnknown?: boolean } = {},
) {
  const content = new ContentRepository(db);
  const records = [];
  const skipped: { slug: string; reason: string }[] = [];
  let releasesChecked = 0;
  for await (const { id, slug, data } of readSavedContentRecords(db, 'releases')) {
    releasesChecked++;
    const missing = data.catalog_number === undefined || data.catalog_number === null || data.catalog_number === '';
    try {
      const catalogNumber = missing ? legacyReleaseCatalogNumber(slug) : catalogNumberSchema.parse(data.catalog_number);
      records.push({
        collection: 'releases',
        id,
        slug,
        data: { ...data, catalog_number: catalogNumber },
        missing,
      });
    } catch (error) {
      if (!options.skipUnknown) throw error;
      skipped.push({ slug, reason: error instanceof Error ? error.message : String(error) });
    }
  }
  const clashes = releaseCatalogNumberClashes(records);
  if (clashes.length) {
    if (!options.skipUnknown) throw new Error(clashes.map((clash) => clash.message).join('\n'));
    skipped.push(...clashes.map(({ message }) => ({ slug: 'catalog numbers', reason: message })));
    return { apply, releasesChecked, drafts: [], skipped };
  }
  const plan = records
    .filter((record) => record.missing)
    .map(({ id, slug, data }) => ({ id, slug, catalogNumber: data.catalog_number }));
  // Validate the whole inventory before any write; native draft-aware staging preserves unrelated pending edits.
  if (apply)
    for (const record of plan)
      await content.updateDraftAware('releases', record.id, { data: { catalog_number: record.catalogNumber } });
  return { apply, releasesChecked, drafts: plan, skipped };
}
