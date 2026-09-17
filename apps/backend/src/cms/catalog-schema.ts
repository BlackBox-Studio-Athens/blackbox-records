import { SchemaRegistry } from 'emdash';
import type { EmDashRuntime } from 'emdash/middleware';

// Explicit setup operation, never run as a side effect of browsing.
export async function prepareCatalogSchema(runtime: EmDashRuntime) {
  const registry = new SchemaRegistry(runtime.db);
  const group = await registry.getField('distro', 'group');
  if (group && !group.indexed) await registry.updateField('distro', 'group', { indexed: true });
  for (const slug of ['artists', 'releases', 'distro', 'news']) {
    const collection = await registry.getCollection(slug);
    if (collection && collection.titleField !== 'title') await registry.updateCollection(slug, { titleField: 'title' });
  }
  return Response.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
