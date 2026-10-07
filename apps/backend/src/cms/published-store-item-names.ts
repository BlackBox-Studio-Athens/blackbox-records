import type { ContentSnapshot } from '@blackbox/content-model';
import { readPublicationPointer, readPublishedSnapshot, type PublicationEnvironment } from './published-storage';

export type PublishedStoreItemName = { title: string; artist: string | null };

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);

/** Shopper-facing title and artist of each published Store Item, keyed by Store Item slug. */
export function publishedStoreItemNames(
  snapshot: Pick<ContentSnapshot, 'records' | 'storeItems'>,
): Map<string, PublishedStoreItemName> {
  const records = new Map(snapshot.records.map((record) => [`${record.collection}/${record.slug}`, record] as const));
  const artists = new Map(
    snapshot.records.filter((record) => record.collection === 'artists').map((record) => [record.id, record] as const),
  );
  const names = new Map<string, PublishedStoreItemName>();
  for (const item of snapshot.storeItems ?? []) {
    const record = records.get(`${item.sourceKind === 'release' ? 'releases' : 'distro'}/${item.sourceId}`);
    const title = text(record?.data.title);
    if (!record || !title) continue;
    const artist =
      item.sourceKind === 'release'
        ? text(artists.get(record.data.artist as string)?.data.title)
        : text(record.data.artist_or_label);
    names.set(item.storeItemSlug, { title, artist });
  }
  return names;
}

/**
 * Reads the accepted publication once, on first use, so a scheduled run without due alerts reads nothing.
 * Returns null names when no publication is accepted yet.
 */
export function createPublishedStoreItemNameReader(bucket: R2Bucket, environment: PublicationEnvironment) {
  let names: Promise<Map<string, PublishedStoreItemName>> | undefined;
  return async (storeItemSlug: string): Promise<PublishedStoreItemName | null> => {
    names ??= readPublicationPointer(bucket, environment).then(async (current) =>
      current
        ? publishedStoreItemNames(await readPublishedSnapshot(bucket, environment, current.pointer.snapshotSha256))
        : new Map(),
    );
    return (await names).get(storeItemSlug) ?? null;
  };
}
