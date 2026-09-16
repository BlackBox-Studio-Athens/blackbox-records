import { createHash } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, join, sep } from 'node:path';
import sharp from 'sharp';
import {
  contentMediaIds,
  parseContentSnapshot,
  sourceCollectionNames,
  type ContentSnapshot,
} from '@blackbox/content-model';

export type SnapshotInput = { path: string; sha256: string; environment: 'local' | 'uat' | 'prd' };
const extensions = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' } as const;
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

export async function readContentSnapshot(input: SnapshotInput) {
  if (!/^[a-f0-9]{64}$/.test(input.sha256)) throw new Error('A snapshot SHA-256 is required.');
  const path = await realpath(input.path);
  if ((await stat(path)).size > 4 * 1024 * 1024) throw new Error('Snapshot exceeds size limit.');
  const bytes = await readFile(path);
  if (hash(bytes) !== input.sha256) throw new Error('Snapshot checksum mismatch.');
  const snapshot = parseContentSnapshot(bytes.toString('utf8'), input.environment);
  const root = dirname(path);
  const media = new Map<string, { path: string; relativePath: string; item: ContentSnapshot['media'][number] }>();
  for (const item of snapshot.media) {
    const relativePath = `./media/${item.sha256}.${extensions[item.mimeType]}`;
    const imagePath = await realpath(join(root, relativePath));
    if (!imagePath.startsWith(root + sep)) throw new Error('Snapshot media escapes its directory.');
    if ((await stat(imagePath)).size !== item.size) throw new Error('Snapshot media size mismatch.');
    const image = await readFile(imagePath);
    if (hash(image) !== item.sha256) throw new Error('Snapshot media checksum mismatch.');
    const metadata = await sharp(image).metadata();
    if (
      metadata.width !== item.width ||
      metadata.height !== item.height ||
      metadata.format !== (item.mimeType === 'image/jpeg' ? 'jpeg' : extensions[item.mimeType])
    )
      throw new Error('Snapshot media metadata mismatch.');
    media.set(item.id, { path: imagePath, relativePath, item });
  }
  return { snapshot, media, path };
}

export type LoadedSnapshot = Awaited<ReturnType<typeof readContentSnapshot>>;

export function snapshotCollection(loaded: LoadedSnapshot, collection: string) {
  const artists = new Map(
    loaded.snapshot.records
      .filter((record) => record.collection === 'artists')
      .map((record) => [record.id, record.slug]),
  );
  function field(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(field);
    if (!value || typeof value !== 'object') return value;
    const record = value as Record<string, unknown>;
    if (typeof record.id === 'string' && (Object.keys(record).length === 1 || record.provider === 'local'))
      return loaded.media.get(record.id)!.relativePath;
    return Object.fromEntries(
      Object.entries(record)
        .filter(([, value]) => value !== null)
        .map(([key, child]) => [key, field(child)]),
    );
  }
  return loaded.snapshot.records
    .filter((record) => sourceCollectionNames[record.collection as keyof typeof sourceCollectionNames] === collection)
    .map((record) => {
      const { body, ...editorial } = record.data;
      const data = field(editorial) as Record<string, unknown>;
      if (loaded.snapshot.storeItems && ['releases', 'distro'].includes(record.collection)) {
        const item = loaded.snapshot.storeItems.find(
          (item) =>
            item.sourceKind === (record.collection === 'releases' ? 'release' : 'distro') &&
            item.sourceId === record.slug,
        );
        data.store_item = item ? { storeItemSlug: item.storeItemSlug, variantId: item.variantId } : null;
      }
      if (record.collection === 'artists') data.slug = record.slug;
      if (record.collection === 'releases') data.artist = artists.get(String(record.data.artist));
      if (['artists', 'releases', 'news'].includes(record.collection)) {
        data.editorial_body = body ?? [];
        data.content_media = Object.fromEntries(
          contentMediaIds(body).map((id) => [id, loaded.media.get(id)!.relativePath]),
        );
      }
      return { id: record.slug, data };
    });
}
