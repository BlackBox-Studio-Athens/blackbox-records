import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLocalPublicationClient } from './local-publication-poll.mjs';
import { startLocalPublicRuntime } from '../../backend/scripts/local-public-runtime.mjs';
import { captureCmsSnapshot } from '../../../scripts/capture-cms-snapshot.mjs';
import { createCmsSnapshotReaders } from '../../../scripts/cms-snapshot-readers.mjs';
import { writeCmsSnapshot } from '../../../scripts/export-cms-snapshot.mjs';
import { importCmsContent } from '../../../scripts/import-cms-content.mjs';
import { sourceCollectionNames } from '@blackbox/content-model';
import { setTimeout } from 'node:timers/promises';

export async function publishInitialLocalContent(signal = new AbortController().signal) {
  // Verify source parity before the one-time bootstrap; never promote divergent drafts on restart.
  await importCmsContent({ verifyOnly: true });
  const client = createLocalPublicationClient(signal);
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
}

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
  await mkdir(directory, { recursive: true });
  const controller = new AbortController();
  const client = createLocalPublicationClient(controller.signal);
  let server;
  let stopping = false;
  const stop = () => {
    stopping = true;
    controller.abort();
    void server?.stop();
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
  try {
    // A listening Worker may still be importing the initial library and linking its Local catalog.
    let ready = false;
    for (let attempt = 0; attempt < 2400 && !stopping; attempt++) {
      try {
        const marker = JSON.parse(
          await readFile(new URL('../../backend/.emdash/local-ready.json', import.meta.url), 'utf8'),
        );
        process.kill(marker.pid, 0);
        ready = true;
        break;
      } catch {
        await setTimeout(250, undefined, { signal: controller.signal });
      }
    }
    if (!ready) throw new Error('Local CMS initialization did not finish.');
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
      await publishInitialLocalContent(controller.signal);
      input = (await capture()).input;
      await writeFile(resolve(directory, 'input.json'), JSON.stringify(input));
    }
    if (stopping) return;
    server = await startLocalPublicRuntime(input, { signal: controller.signal });
    console.log('[Local public site] http://127.0.0.1:4321/blackbox-records/');
    await server.waitUntilExit();
  } finally {
    await server?.stop();
    controller.abort();
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    signal?.removeEventListener('abort', stop);
  }
}
