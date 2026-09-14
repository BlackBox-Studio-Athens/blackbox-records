import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout } from 'node:timers/promises';
import { captureCmsSnapshot } from '../../../scripts/capture-cms-snapshot.mjs';
import { createCmsSnapshotReaders } from '../../../scripts/cms-snapshot-readers.mjs';
import { writeCmsSnapshot } from '../../../scripts/export-cms-snapshot.mjs';
import { importCmsContent } from '../../../scripts/import-cms-content.mjs';
import { sourceCollectionNames } from '@blackbox/content-model';

export async function activateLocalBuild(directory) {
  const current = resolve(directory, 'public');
  const previous = resolve(directory, 'previous');
  await rm(previous, { recursive: true, force: true });
  let replaced = false;
  try {
    await rename(current, previous);
    replaced = true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  try {
    await rename(resolve(directory, 'next'), current);
  } catch (error) {
    if (replaced) await rename(previous, current);
    throw error;
  }
}

export async function startLocalPublication() {
  const { preview } = await import('astro');
  const { getPlatformProxy } = await import('../../backend/node_modules/wrangler/wrangler-dist/cli.js');
  const web = fileURLToPath(new URL('../', import.meta.url));
  const backend = fileURLToPath(new URL('../../backend/', import.meta.url));
  const directory = resolve(backend, '.wrangler/state/local-publication');
  const current = resolve(directory, 'public');
  await mkdir(directory, { recursive: true });
  const resource = JSON.parse(await readFile(resolve(backend, 'cms-resources.json'), 'utf8')).local;
  const configPath = resolve(directory, 'wrangler.json');
  await writeFile(
    configPath,
    JSON.stringify({
      name: 'blackbox-local-publication',
      compatibility_date: '2026-08-31',
      d1_databases: [{ binding: 'CMS_DB', database_name: resource.database_name, database_id: resource.database_id }],
    }),
  );
  const proxy = await getPlatformProxy({
    configPath,
    persist: { path: resolve(backend, '.wrangler/state/v3') },
    remoteBindings: false,
    envFiles: [],
  });
  const db = proxy.env.CMS_DB;
  let server;
  let stopping = false;
  let child;
  const stop = () => {
    stopping = true;
    child?.kill();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  async function capture() {
    const snapshot = await captureCmsSnapshot({
      ...createCmsSnapshotReaders({ environment: 'local', target: 'http://127.0.0.1:8787' }),
      maxRequests: 1000,
    });
    return { snapshot, input: await writeCmsSnapshot(snapshot, resolve(directory, randomUUID()), 'local') };
  }
  async function build(input) {
    const next = resolve(directory, 'next');
    await rm(next, { recursive: true, force: true });
    await new Promise((done, reject) => {
      child = spawn(
        process.execPath,
        [resolve(web, 'node_modules/astro/bin/astro.mjs'), 'build', '--root', web, '--outDir', next],
        {
          cwd: web,
          stdio: 'inherit',
          windowsHide: true,
          env: {
            ...process.env,
            CMS_CONTENT_SOURCE: 'snapshot',
            CMS_CONTENT_SNAPSHOT: input.path,
            CMS_CONTENT_SHA256: input.sha256,
            CMS_CONTENT_ENVIRONMENT: 'local',
          },
        },
      );
      child.once('error', reject);
      child.once('exit', (code) => (code === 0 ? done() : reject(new Error('Local publication build failed.'))));
    });
    child = undefined;
    if (stopping) throw new Error('Local stack stopped.');
    await writeFile(
      resolve(next, 'local-publication.json'),
      JSON.stringify({ sha256: input.sha256, publicationId: input.publicationId ?? null }),
    );
    await activateLocalBuild(directory);
    await writeFile(resolve(directory, 'input.next.json'), JSON.stringify(input));
    await rename(resolve(directory, 'input.next.json'), resolve(directory, 'input.json'));
  }

  try {
    let empty = true;
    for (const collection of Object.keys(sourceCollectionNames)) {
      const response = await fetch(`http://127.0.0.1:8787/_emdash/api/content/${collection}?limit=1`);
      if (!response.ok) throw new Error('Local CMS is not ready.');
      if ((await response.json()).data.items.length) {
        empty = false;
        break;
      }
    }
    if (empty) await importCmsContent({ apply: true });
    let input;
    try {
      input = JSON.parse(await readFile(resolve(directory, 'input.json'), 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (!input) {
      // Initial Local import represents the already-public source library. Refuse to publish divergent drafts.
      await importCmsContent({ verifyOnly: true });
      for (const collection of Object.keys(sourceCollectionNames)) {
        let cursor;
        do {
          const query = new URLSearchParams({ limit: '100', orderBy: 'createdAt', order: 'asc' });
          if (cursor) query.set('cursor', cursor);
          const list = await fetch(`http://127.0.0.1:8787/_emdash/api/content/${collection}?${query}`);
          if (!list.ok) throw new Error('Local CMS is not ready.');
          const { data } = await list.json();
          cursor = data.nextCursor;
          for (const item of data.items) {
            if (item.status === 'published') continue;
            const url = `http://127.0.0.1:8787/_emdash/api/content/${collection}/${item.id}`;
            const saved = await fetch(url);
            if (!saved.ok) throw new Error('Initial Local record is unavailable.');
            const record = (await saved.json()).data;
            const published = await fetch(url + '/publish', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-EmDash-Request': '1' },
              body: JSON.stringify({ _rev: record._rev }),
            });
            if (!published.ok) throw new Error('Initial Local content changed during publication.');
            await published.body?.cancel();
          }
        } while (cursor);
      }
      input = (await capture()).input;
    }
    await build(input);
    server = await preview({
      root: web,
      outDir: current,
      server: { host: '127.0.0.1', port: 4321 },
      vite: { preview: { strictPort: true } },
    });
    // ponytail: one runner is enforced by the public port; a hosted queue is unnecessary for Local.
    while (!stopping) {
      const request = await db
        .prepare(
          "SELECT id, requested_revision AS revision FROM _blackbox_publications WHERE environment = 'local' AND status = 'pending' ORDER BY rowid DESC LIMIT 1",
        )
        .first();
      if (request) {
        try {
          const active = JSON.parse(await readFile(resolve(directory, 'input.json'), 'utf8'));
          let sha256 = active.sha256;
          if (active.publicationId !== request.id) {
            const { snapshot, input } = await capture();
            if (!snapshot.snapshot.records.some((record) => record.revisionId === request.revision))
              throw new Error('Requested revision is no longer published.');
            await build({ ...input, publicationId: request.id });
            sha256 = input.sha256;
          }
          const receipt = await fetch('http://127.0.0.1:4321/blackbox-records/local-publication.json', {
            cache: 'no-store',
          });
          if (!receipt.ok) throw new Error('Local publication could not be verified.');
          const deployed = await receipt.json();
          if (deployed.publicationId !== request.id || deployed.sha256 !== sha256)
            throw new Error('Local publication could not be verified.');
          await db
            .prepare(
              "UPDATE _blackbox_publications SET status = 'live', snapshot_sha256 = ? WHERE id = ? AND environment = 'local' AND status = 'pending'",
            )
            .bind(sha256, request.id)
            .run();
          await db
            .prepare(
              "UPDATE _blackbox_publications SET status = 'failed' WHERE environment = 'local' AND status = 'pending' AND rowid < (SELECT rowid FROM _blackbox_publications WHERE id = ?)",
            )
            .bind(request.id)
            .run();
          console.log('[Local publication] Live on fresh public page loads.');
        } catch (error) {
          if (stopping) break;
          await db
            .prepare(
              "UPDATE _blackbox_publications SET status = 'failed' WHERE id = ? AND environment = 'local' AND status = 'pending'",
            )
            .bind(request.id)
            .run();
          console.error('[Local publication]', error.message);
        }
      }
      await setTimeout(2000);
    }
  } finally {
    await server?.stop();
    await proxy.dispose();
  }
}
