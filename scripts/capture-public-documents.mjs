import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const documentPath = (route) => (route === '/' ? 'index.html' : `${route.slice(1)}index.html`);

/** Render actual routes; item variants are selected from their rendered markup, never guessed from slugs. */
export async function captureRepresentativeDocuments(snapshot, render, documentsRoot, identity = {}) {
  const documents = new Map();
  async function capture(route, fullDocument = true) {
    assert.match(route, /^\/(?:[a-z0-9-]+\/)*$/);
    const response = await render(route);
    assert.equal(
      response.status,
      200,
      `Hosted capture failed for ${route}: ${response.status}${response.status === 200 ? '' : ' ' + (await response.clone().text()).slice(0, 500)}`,
    );
    assert.match(response.headers.get('content-type') ?? '', /text\/html/i, `Non-HTML response for ${route}`);
    if (identity.snapshotSha256)
      assert.equal(
        response.headers.get('X-Content-SHA256'),
        identity.snapshotSha256,
        `Wrong accepted snapshot for ${route}`,
      );
    if (identity.releaseSha)
      assert.equal(response.headers.get('X-Release-SHA'), identity.releaseSha, `Wrong SSR release for ${route}`);
    const html = await response.text();
    assert.match(
      html,
      fullDocument ? /<html\b/i : /<template\b|data-app-shell-overlay|<html\b/i,
      `Missing ${fullDocument ? 'HTML document' : 'overlay fragment'} for ${route}`,
    );
    const file = documentPath(route);
    await mkdir(dirname(join(documentsRoot, file)), { recursive: true });
    await writeFile(join(documentsRoot, file), html);
    documents.set(file, html);
    return html;
  }
  for (const route of ['/', '/artists/', '/services/', '/about/', '/store/', '/store/distro/', '/news/', '/releases/'])
    await capture(route);
  // Each detail class may have different editorial media; the existing image gate selects its representatives.
  for (const record of snapshot.records) {
    if (['artists', 'releases', 'news'].includes(record.collection)) {
      await capture(`/${record.collection}/${record.slug}/`);
      await capture(`/app-shell-overlay/${record.collection}/${record.slug}/`, false);
    }
  }
  let single = false;
  let gallery = false;
  for (const item of snapshot.storeItems ?? []) {
    const html = await capture(`/store/${item.storeItemSlug}/`);
    assert.match(html, /class=["'][^"']*\bstore-item-page\b/, 'Store Item route did not render an item page.');
    if (/\bdata-store-image-gallery\b|class=["']store-image-gallery["']/.test(html)) gallery = true;
    else single = true;
    if (single && gallery) break;
  }
  assert.ok(single, 'Accepted snapshot has no rendered single-image Store Item representative.');
  assert.ok(gallery, 'Accepted snapshot has no rendered gallery Store Item representative.');
  return documents;
}

/** Local raster estimates keep the roster byte gate active; they do not establish provider transfer bytes. */
async function captureRosterCandidates(documents, loaded, documentsRoot) {
  const { getArtistRosterPortraits, getSrcsetCandidateUrl } = await import('../apps/web/scripts/check-image-markup.ts');
  const webRequire = createRequire(new URL('../apps/web/package.json', import.meta.url));
  const { default: sharp } = await import(pathToFileURL(webRequire.resolve('sharp')).href);
  const media = new Map([...loaded.media.values()].map((entry) => [entry.item.sha256, entry]));
  const sizes = {};
  for (const { tag } of getArtistRosterPortraits(documents.get('artists/index.html') ?? '')) {
    const candidate = getSrcsetCandidateUrl(tag, 480);
    const url = new URL(candidate);
    assert.equal(url.origin, 'https://images.blackboxrecordsathens.com');
    const match = /^\/cdn-cgi\/image\/([^/]+)\/https:\/\/[^/]+\/media\/content\/([a-f0-9]{64})$/.exec(url.pathname);
    assert.ok(match, `Unexpected hosted roster candidate: ${candidate}`);
    const options = Object.fromEntries(match[1].split(',').map((option) => option.split('=')));
    assert.equal(options.width, '480');
    assert.ok(['auto', 'webp'].includes(options.format));
    const quality = Number(options.quality ?? 85);
    assert.ok([68, 85].includes(quality));
    const image = media.get(match[2]);
    assert.ok(image, 'Roster image is absent from the accepted snapshot.');
    // Local WebP model matches the emitted quality; provider encoder/transfer acceptance remains hosted evidence.
    const bytes = await sharp(image.path).rotate().resize({ width: 480 }).webp({ quality }).toBuffer();
    const output = join(documentsRoot, '.image-assets', `${hash(candidate)}.webp`);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, bytes);
    sizes[candidate] = bytes.length;
  }
  return { mode: 'local-webp-emulation', width: 480, quality: 'emitted option or default 85', sizes };
}

/** Open the already-built release in isolated local storage. No build or hosted fetch is performed here. */
export async function capturePublicDocuments({ target, identityPath, snapshotPath, distRoot, documentsRoot }) {
  assert.ok(['uat', 'prd'].includes(target));
  const identity = JSON.parse(await readFile(identityPath, 'utf8'));
  assert.match(identity.snapshotSha256 ?? '', /^[a-f0-9]{64}$/);
  const configPath = join(distRoot, 'server/wrangler.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  assert.equal(config.vars.PRODUCT_ENVIRONMENT, target, 'SSR artifact environment differs from accepted content.');
  const entry = join(distRoot, 'server/entry.mjs');
  const entryBytes = await readFile(entry);
  const { readContentSnapshot } = await import('../apps/web/src/lib/content-files/content-snapshot.ts');
  const loaded = await readContentSnapshot({
    path: snapshotPath,
    sha256: identity.snapshotSha256,
    environment: target,
  });
  const backendRequire = createRequire(new URL('../apps/backend/package.json', import.meta.url));
  const { getPlatformProxy, unstable_dev } = await import(pathToFileURL(backendRequire.resolve('wrangler')).href);
  const { validateLocalDurableObjectPaths } = await import('../apps/backend/scripts/cms-resources.ts');
  const state = await mkdtemp(resolve('.gate-'));
  try {
    const storageConfig = join(state, 'storage.json');
    assert.ok(
      config.r2_buckets?.some((bucket) => bucket.binding === 'MEDIA'),
      'Built renderer has no MEDIA binding.',
    );
    await writeFile(
      storageConfig,
      JSON.stringify({
        name: 'gate',
        compatibility_date: config.compatibility_date,
        r2_buckets: config.r2_buckets.map(({ binding, bucket_name }) => ({ binding, bucket_name })),
      }),
    );
    const proxy = await getPlatformProxy({
      configPath: storageConfig,
      persist: { path: join(state, 'v3') },
      envFiles: [],
    });
    try {
      const bucket = proxy.env.MEDIA;
      for (const image of loaded.media.values()) {
        await bucket.put(`snapshots/${target}/media/${image.item.sha256}`, await readFile(image.path), {
          sha256: image.item.sha256,
          httpMetadata: { contentType: image.item.mimeType },
        });
      }
      await bucket.put(`snapshots/${target}/manifest/${identity.snapshotSha256}`, await readFile(snapshotPath), {
        sha256: identity.snapshotSha256,
      });
      await bucket.put(
        `snapshots/${target}/current.json`,
        JSON.stringify({
          id: identity.publicationId,
          snapshotSha256: identity.snapshotSha256,
          generation: 0,
          ...(identity.ciRunId ? { ciRunId: identity.ciRunId } : {}),
        }),
      );
    } finally {
      await proxy.dispose();
    }
    const localConfig = { ...config, name: 'gate', main: entry };
    // Local emulation must never consume remote bindings, inherited secrets or production storage.
    localConfig.r2_buckets = localConfig.r2_buckets.map(({ binding, bucket_name }) => ({ binding, bucket_name }));
    if (localConfig.assets?.directory)
      localConfig.assets = {
        ...localConfig.assets,
        directory: resolve(dirname(configPath), localConfig.assets.directory),
      };
    const localConfigPath = join(state, 'renderer.json');
    await writeFile(localConfigPath, JSON.stringify(localConfig));
    validateLocalDurableObjectPaths(localConfig, state);
    const runtime = await unstable_dev(entry, {
      config: localConfigPath,
      ip: '127.0.0.1',
      port: 0,
      local: true,
      persist: true,
      persistTo: state,
      envFiles: [],
      logLevel: 'error',
      experimental: { disableExperimentalWarning: true },
    });
    try {
      const documents = await captureRepresentativeDocuments(
        loaded.snapshot,
        (route) =>
          runtime.fetch(route, {
            redirect: 'manual',
            headers: { Accept: 'text/html' },
          }),
        documentsRoot,
        { snapshotSha256: identity.snapshotSha256, releaseSha: process.env.SOURCE_SHA || '0'.repeat(40) },
      );
      const images = await captureRosterCandidates(documents, loaded, documentsRoot);
      await writeFile(
        join(documentsRoot, 'capture.json'),
        JSON.stringify(
          {
            target,
            snapshotSha256: identity.snapshotSha256,
            releaseSha: process.env.SOURCE_SHA || '0'.repeat(40),
            rendererEntrySha256: hash(entryBytes),
            documents: Object.fromEntries([...documents].map(([file, html]) => [file, hash(html)])),
            images,
          },
          null,
          2,
        ),
      );
    } finally {
      await runtime.stop();
    }
  } finally {
    assert.ok(state.startsWith(`${resolve('.')}${sep}.gate-`), 'Unexpected local gate storage path.');
    await rm(state, { recursive: true, force: true });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const target = process.argv[2];
  await capturePublicDocuments({
    target,
    identityPath: resolve(`.codex-artifacts/release-content/${target}/identity.json`),
    snapshotPath: resolve(`.codex-artifacts/release-content/${target}/snapshot.json`),
    distRoot: resolve('apps/backend/dist-public'),
    documentsRoot: resolve(process.argv[3]),
  });
}
