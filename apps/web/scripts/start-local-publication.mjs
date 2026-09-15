import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLocalPublicationClient, runLocalPublicationPoll } from './local-publication-poll.mjs';
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

export async function startLocalPublication({
  directory = fileURLToPath(new URL('../../backend/.wrangler/state/local-publication/', import.meta.url)),
  signal,
} = {}) {
  const { preview } = await import('astro');
  const web = fileURLToPath(new URL('../', import.meta.url));
  const current = resolve(directory, 'public');
  await mkdir(directory, { recursive: true });
  const controller = new AbortController();
  const client = createLocalPublicationClient(controller.signal);
  let server;
  let stopping = false;
  let child;
  const stop = () => {
    stopping = true;
    controller.abort();
    child?.kill();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  signal?.addEventListener('abort', stop, { once: true });
  if (signal?.aborted) stop();

  async function capture() {
    const snapshot = await captureCmsSnapshot({
      ...createCmsSnapshotReaders({ environment: 'local', target: 'http://127.0.0.1:8787', fetchImpl: client.send }),
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
      const response = await client.send(`http://127.0.0.1:8787/_emdash/api/content/${collection}?limit=1`);
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
          const list = await client.send(`http://127.0.0.1:8787/_emdash/api/content/${collection}?${query}`);
          if (!list.ok) throw new Error('Local CMS is not ready.');
          const { data } = await list.json();
          cursor = data.nextCursor;
          for (const item of data.items) {
            if (item.status === 'published') continue;
            const url = `http://127.0.0.1:8787/_emdash/api/content/${collection}/${item.id}`;
            const saved = await client.send(url);
            if (!saved.ok) throw new Error('Initial Local record is unavailable.');
            const record = (await saved.json()).data;
            const published = await client.send(url + '/publish', {
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
    await runLocalPublicationPoll({
      client,
      signal: controller.signal,
      readActive: async () => JSON.parse(await readFile(resolve(directory, 'input.json'), 'utf8')),
      capture,
      build,
    });
  } finally {
    await server?.stop();
    controller.abort();
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    signal?.removeEventListener('abort', stop);
  }
}
