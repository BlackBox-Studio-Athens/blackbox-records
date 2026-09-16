import { fileURLToPath } from 'node:url';
import { relative, resolve } from 'node:path';
import { glob, type Loader } from 'astro/loaders';
import { readContentSnapshot, snapshotCollection, type LoadedSnapshot, type SnapshotInput } from './content-snapshot';

let loaded: Promise<LoadedSnapshot> | undefined;
export function contentSnapshotInput(): SnapshotInput | undefined {
  const source = process.env.CMS_CONTENT_SOURCE;
  // Removed at the authorized source cutover; existing deployments still use their current content input.
  if (!source || source === 'files') return undefined;
  if (source !== 'snapshot') throw new Error('Unknown content source.');
  const { CMS_CONTENT_SNAPSHOT: path, CMS_CONTENT_SHA256: sha256, CMS_CONTENT_ENVIRONMENT: environment } = process.env;
  if (!path || !sha256 || !['local', 'uat', 'prd'].includes(environment ?? ''))
    throw new Error('Snapshot builds require a path, checksum and target environment.');
  return { path: resolve(path), sha256, environment: environment as SnapshotInput['environment'] };
}

export function publicContentLoader(collection: string, pattern: string, base: string): Loader {
  const input = contentSnapshotInput();
  if (!input) {
    const files = glob({ pattern, base });
    return {
      name: `blackbox-files-${collection}`,
      async load(context) {
        if (context.meta.get('blackbox-source') !== 'files') context.store.clear();
        await files.load(context);
        context.meta.set('blackbox-source', 'files');
      },
    };
  }
  return {
    name: `blackbox-snapshot-${collection}`,
    async load({ store, meta, parseData, config, generateDigest }) {
      const snapshot = await (loaded ??= readContentSnapshot(input));
      const entries = await Promise.all(
        snapshotCollection(snapshot, collection).map(async ({ id, data }) => ({
          id,
          data: await parseData({ id, data, filePath: snapshot.path }),
          filePath: relative(fileURLToPath(config.root), snapshot.path).replaceAll('\\', '/'),
          digest: generateDigest({ sha256: input.sha256, id }),
        })),
      );
      store.clear();
      for (const entry of entries) store.set(entry);
      meta.set('blackbox-source', 'snapshot');
    },
  };
}
