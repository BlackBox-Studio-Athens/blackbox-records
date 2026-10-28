import type { ContentSnapshot } from '@blackbox/content-model';
import { readPublicationPointer, readPublishedSnapshot, type PublicationEnvironment } from './published-storage';

export type PublishedMerchantCatalog = {
  identity: string;
  snapshot: ContentSnapshot;
  isCurrent(): Promise<boolean>;
};

export async function loadPublishedMerchantCatalog(
  bucket: R2Bucket,
  environment: PublicationEnvironment,
): Promise<PublishedMerchantCatalog> {
  const current = await readPublicationPointer(bucket, environment);
  if (!current) throw new Error('Accepted Merchant catalog is unavailable.');
  const pointer = current.pointer;
  const snapshot = await readPublishedSnapshot(bucket, environment, pointer.snapshotSha256);
  if (!snapshot.storeItems) throw new Error('Accepted Merchant catalog identities are unavailable.');
  const isCurrent = async () => {
    const latest = await readPublicationPointer(bucket, environment);
    return (
      latest?.pointer.id === pointer.id &&
      latest.pointer.generation === pointer.generation &&
      latest.pointer.snapshotSha256 === pointer.snapshotSha256
    );
  };
  if (!(await isCurrent())) throw new Error('Accepted Merchant catalog changed during loading.');
  return { identity: pointer.snapshotSha256, snapshot, isCurrent };
}
