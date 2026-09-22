import { SchemaRegistry } from 'emdash';
import { scalarProseFields } from '@blackbox/content-model';
import type { EmDashRuntime } from 'emdash/middleware';

// Explicit setup operation, never run as a side effect of browsing.
export async function prepareCatalogSchema(runtime: EmDashRuntime) {
  const registry = new SchemaRegistry(runtime.db);
  for (const [collection, fields] of Object.entries(scalarProseFields)) {
    for (const field of fields) {
      const slug = `${field}_rich`;
      const existing = await registry.getField(collection, slug);
      if (!existing)
        await registry.createField(collection, { slug, label: field, type: 'portableText', required: false });
      else if (existing.type !== 'portableText') throw new Error(`Unexpected field type: ${collection}.${slug}`);
    }
  }
  for (const collection of ['releases', 'distro']) {
    const existing = await registry.getField(collection, 'tracklist');
    if (!existing)
      await registry.createField(collection, { slug: 'tracklist', label: 'Tracklist', type: 'json', required: false });
    else if (existing.type !== 'json') throw new Error(`Unexpected field type: ${collection}.tracklist`);
  }
  const group = await registry.getField('distro', 'group');
  if (group && !group.indexed) await registry.updateField('distro', 'group', { indexed: true });
  for (const slug of ['artists', 'releases', 'distro', 'news']) {
    const collection = await registry.getCollection(slug);
    if (collection && collection.titleField !== 'title') await registry.updateCollection(slug, { titleField: 'title' });
  }
  return Response.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
