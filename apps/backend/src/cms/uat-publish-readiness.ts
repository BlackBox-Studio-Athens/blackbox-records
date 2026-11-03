import { ContentRepository } from 'emdash';
import type { EmDashRuntime } from 'emdash/middleware';
import { getPublicationProductConditionIssues } from '@blackbox/content-model';
import { backfillReleaseCatalogNumbers } from './catalog-number-backfill';
import { readSavedContentRecords } from './saved-content-records';

export async function stageUatPublishRequiredDetails(db: EmDashRuntime['db'], apply = false) {
  const catalog = await backfillReleaseCatalogNumbers(db, apply, { skipUnknown: true });
  const staged: { collection: 'releases' | 'distro'; slug: string; field: 'catalog_number' | 'product_condition' }[] =
    catalog.drafts.map(({ slug }) => ({ collection: 'releases', slug, field: 'catalog_number' }));
  const checked = { releases: 0, distro: 0 };
  const content = new ContentRepository(db);
  for (const collection of ['releases', 'distro'] as const) {
    for await (const record of readSavedContentRecords(db, collection)) {
      checked[collection]++;
      if (getPublicationProductConditionIssues(collection, record.data).length === 0) continue;
      if (apply) await content.updateDraftAware(collection, record.id, { data: { product_condition: 'new' } });
      staged.push({ collection, slug: record.slug, field: 'product_condition' });
    }
  }
  return { apply, checked, staged, skipped: catalog.skipped };
}
