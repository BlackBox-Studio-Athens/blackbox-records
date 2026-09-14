import { readFile, readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import type { APIRoute } from 'astro';
import { contentSnapshotInput } from '../../../../lib/content-loader';
import { readContentSnapshot } from '../../../../lib/content-snapshot';

export const prerender = true;

const contentTypes: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

export async function getStaticPaths() {
  const paths = [];
  const input = contentSnapshotInput();
  if (input) {
    const { snapshot, media } = await readContentSnapshot(input);
    const aliases = new Map<string, string>();
    for (const record of snapshot.records.filter((record) => ['distro', 'releases'].includes(record.collection))) {
      const fields =
        record.collection === 'releases'
          ? [record.data.cover_image]
          : [
              record.data.image,
              ...(Array.isArray(record.data.gallery)
                ? record.data.gallery.map((item) => (item as { image: unknown }).image)
                : []),
            ];
      for (const field of fields) {
        const image = media.get((field as { id: string }).id)!;
        const asset = image.item.filename;
        if (/[\\/?#]/.test(asset) || [...asset].some((character) => character < ' ') || asset === '.' || asset === '..')
          throw new Error('Unsafe catalog image filename.');
        const key = `${record.collection}/${asset}`;
        if (aliases.has(key)) {
          if (aliases.get(key) !== image.item.sha256) throw new Error('Conflicting catalog image aliases.');
          continue;
        }
        aliases.set(key, image.item.sha256);
        paths.push({
          params: { collection: record.collection, asset },
          props: { assetPath: image.path, contentType: image.item.mimeType },
        });
      }
    }
    return paths;
  }
  for (const collection of ['distro', 'releases']) {
    const directory = resolve('src/content', collection);
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const contentType = contentTypes[extname(entry.name).toLowerCase()];
      if (entry.isFile() && contentType) {
        paths.push({
          params: { collection, asset: entry.name },
          props: { assetPath: resolve(directory, entry.name), contentType },
        });
      }
    }
  }
  return paths;
}

// Only build-discovered files reach this static endpoint; URL input never becomes a filesystem path.
export const GET: APIRoute = async ({ props }) =>
  new Response(new Uint8Array(await readFile(props.assetPath)), {
    headers: { 'Content-Type': props.contentType },
  });
