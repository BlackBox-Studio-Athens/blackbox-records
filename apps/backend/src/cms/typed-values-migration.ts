import { ContentRepository, SchemaRegistry } from 'emdash';
import type { EmDashRuntime } from 'emdash/middleware';
import { convertTypedValues } from '@blackbox/content-model';
import { readSavedContentRecords } from './saved-content-records';

/** Stage private revisions only. Editorial writes must be paused for the operation. */
export async function migrateTypedValues(db: EmDashRuntime['db'], apply = false) {
  if (apply) {
    const schema = new SchemaRegistry(db);
    if (
      (await schema.getField('artists', 'country'))?.type !== 'json' ||
      (await schema.getField('distro', 'format'))?.type !== 'string' ||
      (await schema.getField('distro', 'format_override'))?.type !== 'string' ||
      (await schema.getField('socials', 'visible'))?.type !== 'boolean'
    )
      throw new Error('Prepare the CMS catalog schema before applying the typed-value migration.');
  }
  const content = new ContentRepository(db);
  const drafts: { collection: string; slug: string; id: string }[] = [];
  const problems: { collection: string; slug: string; field: string }[] = [];
  for (const collection of ['artists', 'releases', 'distro', 'navigation', 'socials', 'services'] as const) {
    for await (const record of readSavedContentRecords(db, collection)) {
      const converted = convertTypedValues(collection, record.data);
      if (converted.problems.length) {
        problems.push(...converted.problems.map((field) => ({ collection, slug: record.slug, field })));
        continue;
      }
      if (JSON.stringify(converted.data) === JSON.stringify(record.data)) continue;
      if (apply) {
        const current = await content.findById(collection, record.id);
        if (!current || (current.draftRevisionId ?? current.liveRevisionId) !== record.revisionId)
          throw new Error(`Content changed during migration: ${collection}/${record.slug}`);
        const revision = await content.restoreDraftRevision(
          collection,
          record.id,
          converted.data,
          null as unknown as string,
        );
        if (!revision) throw new Error(`Could not stage draft: ${collection}/${record.slug}`);
      }
      drafts.push({ collection, slug: record.slug, id: record.id });
    }
  }
  return { apply, drafts, problems };
}
