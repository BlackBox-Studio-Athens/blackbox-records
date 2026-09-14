import { readFileSync } from 'node:fs';

const resources = JSON.parse(readFileSync(new URL('../apps/backend/cms-resources.json', import.meta.url), 'utf8'));

export function cmsSnapshotTarget(environment, target) {
  const origin = new URL(target);
  const allowed =
    environment === 'local'
      ? ['http://127.0.0.1:8787', 'http://localhost:8787', 'http://127.0.0.1:8799', 'http://localhost:8799']
      : ['uat', 'prd'].includes(environment) && resources[environment]?.hostname
        ? [`https://${resources[environment].hostname}`]
        : [];
  if (!allowed.includes(origin.origin) || origin.href !== origin.origin + '/')
    throw new Error('Invalid CMS snapshot target.');
  return origin;
}

export function createCmsSnapshotReaders({
  environment,
  target,
  token,
  publicationToken,
  headers = {},
  fetchImpl = fetch,
}) {
  const origin = cmsSnapshotTarget(environment, target);
  const requestHeaders = new Headers({ Accept: 'application/json' });
  if (token !== undefined) {
    if (!/^ec_pat_[A-Za-z0-9_-]{32,128}$/.test(token)) throw new Error('Invalid CMS export token.');
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }
  const supplied = new Headers(headers);
  for (const key of ['cf-access-client-id', 'cf-access-client-secret', 'cf-access-jwt-assertion']) {
    const value = supplied.get(key);
    if (value) requestHeaders.set(key, value);
  }
  async function readBytes(path, limit = 4 * 1024 * 1024, selectedHeaders = requestHeaders) {
    const response = await fetchImpl(new URL(path, origin), {
      method: 'GET',
      headers: selectedHeaders,
      redirect: 'manual',
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`CMS snapshot read failed (${response.status}).`);
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Empty CMS response.');
    const chunks = [];
    let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > limit) throw new Error('CMS snapshot response exceeds byte limit.');
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
      reader.releaseLock();
    }
    return Buffer.concat(chunks);
  }
  async function read(path) {
    const result = JSON.parse((await readBytes(path)).toString('utf8'));
    if (!result || typeof result.data !== 'object' || !result.data) throw new Error('Invalid CMS response.');
    return result.data;
  }
  return {
    environment,
    async readStoreItems() {
      const catalogHeaders = new Headers(requestHeaders);
      catalogHeaders.delete('Authorization');
      if (environment !== 'local') {
        if (!/^[a-f0-9]{64}$/.test(publicationToken ?? ''))
          throw new Error('Catalog export requires the publication credential.');
        catalogHeaders.set('Authorization', `Bearer ${publicationToken}`);
      }
      return JSON.parse(
        (await readBytes('/_emdash/api/blackbox/publications/catalog', 1024 * 1024, catalogHeaders)).toString('utf8'),
      ).data;
    },
    async readPage(collection, cursor, limit) {
      if (!/^[a-z_]+$/.test(collection) || limit !== 100 || (cursor !== null && typeof cursor !== 'string'))
        throw new Error('Invalid CMS page request.');
      const query = new URLSearchParams({ limit: String(limit), orderBy: 'createdAt', order: 'asc' });
      if (cursor) query.set('cursor', cursor);
      return read('/_emdash/api/content/' + collection + '?' + query);
    },
    async readRevision(id) {
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error('Invalid CMS revision ID.');
      return (await read('/_emdash/api/revisions/' + id)).item;
    },
    async readMedia(id) {
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error('Invalid CMS media ID.');
      return (await read('/_emdash/api/media/' + id)).item;
    },
    async readMediaFile(storageKey) {
      if (!/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.(?:png|jpe?g|webp)$/i.test(storageKey))
        throw new Error('Invalid CMS media storage key.');
      return readBytes('/_emdash/api/media/file/' + storageKey, 20 * 1024 * 1024);
    },
  };
}
