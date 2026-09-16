import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { getPlatformProxy, unstable_dev } from 'wrangler';
import { readContentSnapshot } from '../../web/src/lib/content-snapshot.ts';
import { readFile } from 'node:fs/promises';
import { storeSnapshotMedia, completeSnapshot } from '../src/cms/snapshot-storage.ts';

export async function startLocalPublicRuntime(input, { signal, port = 4321, persistTo } = {}) {
  const backend = fileURLToPath(new URL('../', import.meta.url));
  persistTo ??= resolve(backend, '.wrangler/state');
  const storageConfig = resolve(backend, '.emdash/public-storage.json');
  await mkdir(resolve(backend, '.emdash'), { recursive: true });
  await writeFile(
    storageConfig,
    JSON.stringify({
      name: 'local-public-storage',
      compatibility_date: '2026-08-31',
      r2_buckets: [{ binding: 'MEDIA', bucket_name: 'blackbox-records-cms-local' }],
    }),
  );
  const proxy = await getPlatformProxy({
    configPath: storageConfig,
    persist: { path: resolve(persistTo, 'v3') },
    envFiles: [],
  });
  try {
    const bucket = proxy.env.MEDIA;
    if (!(await bucket.head('snapshots/local/current.json'))) {
      const snapshot = await readContentSnapshot(input);
      for (const image of snapshot.media.values())
        await storeSnapshotMedia(bucket, 'local', new Uint8Array(await readFile(image.path)));
      const stored = await completeSnapshot(bucket, 'local', await readFile(input.path, 'utf8'));
      await bucket.put(
        'snapshots/local/current.json',
        JSON.stringify({ id: input.publicationId ?? randomUUID(), snapshotSha256: stored.sha256, generation: 0 }),
        { onlyIf: { etagDoesNotMatch: '*' } },
      );
    }
  } finally {
    await proxy.dispose();
  }
  await new Promise((done, reject) => {
    const child = spawn(process.execPath, ['scripts/build-public.mjs', 'local'], {
      cwd: backend,
      stdio: 'inherit',
      windowsHide: true,
      signal,
      env: { ...process.env, PUBLIC_BACKEND_BASE_URL: 'http://127.0.0.1:8787' },
    });
    child.once('error', reject);
    child.once('exit', (code) => (code === 0 ? done() : reject(new Error('Local public runtime build failed.'))));
  });
  return unstable_dev(resolve(backend, 'dist-public/server/entry.mjs'), {
    config: resolve(backend, 'dist-public/server/wrangler.json'),
    ip: '127.0.0.1',
    port,
    local: true,
    persist: true,
    persistTo,
    envFiles: [],
    logLevel: 'error',
    experimental: { disableExperimentalWarning: true },
  });
}
