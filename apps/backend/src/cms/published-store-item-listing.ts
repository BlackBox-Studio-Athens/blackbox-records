import { readPublicationPointer, readPublishedSnapshot, type PublicationEnvironment } from './published-storage';

/** Reads Store Item identities from the accepted publication once for an inventory page. */
export async function readPublishedStoreItemSlugs(bucket: R2Bucket | undefined, environment: PublicationEnvironment) {
  if (!bucket) return null;
  try {
    const current = await readPublicationPointer(bucket, environment);
    if (!current) return null;
    const snapshot = await readPublishedSnapshot(bucket, environment, current.pointer.snapshotSha256);
    return snapshot.storeItems ? new Set(snapshot.storeItems.map((item) => item.storeItemSlug)) : null;
  } catch {
    return null;
  }
}
