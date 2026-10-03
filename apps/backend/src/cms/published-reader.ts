import { AsyncLocalStorage } from 'node:async_hooks';
import { publishedCollection, type PublicContent } from '@blackbox/content-model';

export const publishedContext = new AsyncLocalStorage<{
  snapshot: PublicContent;
  mediaBase: string;
  images?: Parameters<typeof publishedCollection>[3];
}>();

type Entry = { id: string; collection: string; data: Record<string, unknown> };
type Projection = { entries: Entry[]; byId: Map<string, Entry> };
const projections = new WeakMap<PublicContent, Map<string, Map<string, Projection>>>();

function collectionProjection(collection: string): Projection {
  const context = publishedContext.getStore();
  if (!context) throw new Error('Published content context required.');
  // Even an empty override object identifies a staff preview and must bypass reuse.
  if (context.images !== undefined) {
    const entries = publishedCollection(context.snapshot, collection, context.mediaBase, context.images);
    return { entries, byId: new Map(entries.map((entry) => [entry.id, entry] as const).reverse()) };
  }
  let bases = projections.get(context.snapshot);
  if (!bases) projections.set(context.snapshot, (bases = new Map()));
  let collections = bases.get(context.mediaBase);
  if (!collections) bases.set(context.mediaBase, (collections = new Map()));
  let projection = collections.get(collection);
  if (!projection) {
    const entries = publishedCollection(context.snapshot, collection, context.mediaBase);
    projection = { entries, byId: new Map(entries.map((entry) => [entry.id, entry] as const).reverse()) };
    collections.set(collection, projection);
  }
  return projection;
}

export async function getCollection(collection: string, filter?: (entry: Entry) => boolean): Promise<Entry[]> {
  const { entries } = collectionProjection(collection);
  return filter ? entries.filter(filter) : entries.slice();
}

export async function getEntry(
  collection: string | { collection: string; id: string },
  id?: string,
): Promise<Entry | undefined> {
  const name = typeof collection === 'string' ? collection : collection.collection;
  const key = typeof collection === 'string' ? id : collection.id;
  const { byId } = collectionProjection(name);
  return key === undefined ? undefined : byId.get(key);
}
