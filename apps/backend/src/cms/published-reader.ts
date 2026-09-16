import { AsyncLocalStorage } from 'node:async_hooks';
import { publishedCollection, type ContentSnapshot } from '@blackbox/content-model';

export const publishedContext = new AsyncLocalStorage<{ snapshot: ContentSnapshot; mediaBase: string }>();

type Entry = { id: string; collection: string; data: Record<string, unknown> };
export async function getCollection(collection: string, filter?: (entry: Entry) => boolean): Promise<Entry[]> {
  const context = publishedContext.getStore();
  if (!context) throw new Error('Published content context required.');
  const entries = publishedCollection(context.snapshot, collection, context.mediaBase);
  return filter ? entries.filter(filter) : entries;
}

export async function getEntry(
  collection: string | { collection: string; id: string },
  id?: string,
): Promise<Entry | undefined> {
  const name = typeof collection === 'string' ? collection : collection.collection;
  const key = typeof collection === 'string' ? id : collection.id;
  return (await getCollection(name)).find((entry) => entry.id === key);
}
