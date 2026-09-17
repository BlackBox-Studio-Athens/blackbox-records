import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { getPlatformProxy, unstable_dev } from 'wrangler';
import { sourceCollectionNames } from '@blackbox/content-model';
import { importCmsContent } from '../../../scripts/import-cms-content.mjs';
import { readBackfillSources } from './backfill-runtime-catalog.ts';
import { loadStripeCatalogStoreItemContracts } from '../../../scripts/stripe-catalog-contract.ts';
import { publishInitialLocalContent } from '../../web/scripts/start-local-publication.mjs';

process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const { values } = parseArgs({
  options: { port: { type: 'string', default: '8787' }, 'persist-to': { type: 'string' } },
});
if (values.port !== '8787') throw new Error('The Local stack requires port 8787.');
const config = resolve('dist/server/wrangler.json');
const bindings = JSON.parse(readFileSync(config, 'utf8')).vars;
if (bindings.PRODUCT_ENVIRONMENT !== 'LOCAL' || bindings.STRIPE_API_BASE_URL !== 'http://127.0.0.1:12110')
  throw new Error('Build the Local mock CMS before starting this launcher.');
const persistTo = resolve(values['persist-to'] ?? '.wrangler/state');
const readyPath = resolve('.emdash/local-ready.json');
rmSync(readyPath, { force: true });
const migration = spawnSync(
  process.execPath,
  ['scripts/migrate-cms-application.mjs', '--persist-to', persistTo, '--apply'],
  {
    stdio: 'inherit',
    windowsHide: true,
  },
);
if (migration.status !== 0) process.exit(migration.status ?? 1);
const worker = await unstable_dev(resolve('dist/server/entry.mjs'), {
  config,
  ip: '127.0.0.1',
  port: 8787,
  local: true,
  persist: true,
  persistTo,
  envFiles: [],
  experimental: { disableExperimentalWarning: true },
});
const stop = async () => {
  rmSync(readyPath, { force: true });
  await worker.stop();
  process.exit();
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
try {
  // Populate only a brand-new default Local store. Existing editorial/commerce data is retained.
  if (!values['persist-to']) {
    let empty = true;
    for (const collection of Object.keys(sourceCollectionNames)) {
      const response = await fetch(`http://127.0.0.1:8787/_emdash/api/content/${collection}?limit=1`);
      if (!response.ok) throw new Error(`Cannot inspect Local CMS collection ${collection}.`);
      const body = await response.json();
      if (body.data.items.length) {
        empty = false;
        break;
      }
    }
    if (empty) {
      const directory = resolve('.emdash/local-bootstrap');
      mkdirSync(directory, { recursive: true });
      await importCmsContent({ prepareLocal: directory });
      await importCmsContent({ apply: true });
      const verified = await importCmsContent({ verifyOnly: true });
      const reportPath = resolve(directory, 'verified.json');
      writeFileSync(reportPath, JSON.stringify(verified));
      console.log('[Local CMS] Initial content and runtime catalog are ready.');
    }
    // Link only the initial fake Local catalog. Preserve all staff prices, quantities and existing links.
    const directory = resolve('.emdash/local-bootstrap');
    if (existsSync(resolve(directory, 'verified.json')) && !existsSync(resolve(directory, 'complete.json'))) {
      if (!existsSync(resolve(persistTo, 'local-publication/input.json'))) await publishInitialLocalContent();
      const sources = readBackfillSources(
        'local',
        (await loadStripeCatalogStoreItemContracts({ productEnvironment: 'UAT' })).map(
          (item) => item.desiredCatalogEntry,
        ),
        JSON.parse(readFileSync(resolve(directory, 'plan.json'), 'utf8')),
        JSON.parse(readFileSync(resolve(directory, 'verified.json'), 'utf8')),
      );
      const catalogConfig = resolve('.emdash/local-catalog.json');
      writeFileSync(
        catalogConfig,
        JSON.stringify({
          name: 'local-catalog-linkage',
          compatibility_date: '2026-08-31',
          d1_databases: JSON.parse(readFileSync(config, 'utf8')).d1_databases.filter(
            (item) => item.binding === 'COMMERCE_DB',
          ),
        }),
      );
      const proxy = await getPlatformProxy({
        configPath: catalogConfig,
        persist: { path: resolve(persistTo, 'v3') },
        envFiles: [],
      });
      try {
        for (const { catalog, cmsSourceId, itemType } of sources)
          await proxy.env.COMMERCE_DB.prepare(
            `UPDATE StoreItemOption SET cmsSourceId = ?, itemType = ?, priceKind = ?, productProjection = ?, catalogAvailability = ?, catalogRevision = 1 WHERE variantId = ? AND sourceId = ? AND sourceKind = ? AND catalogRevision = 0 AND cmsSourceId IS NULL AND NOT EXISTS (SELECT 1 FROM VariantStripeMapping WHERE variantId = StoreItemOption.variantId AND stripePriceId NOT LIKE 'price_mock_%')`,
          )
            .bind(
              cmsSourceId,
              itemType,
              catalog.desiredPrice?.kind ?? 'fixed',
              JSON.stringify(catalog.productProjection),
              catalog.availability,
              catalog.variantId,
              catalog.sourceId,
              catalog.sourceKind,
            )
            .run();
      } finally {
        await proxy.dispose();
      }
      writeFileSync(resolve(directory, 'complete.json'), '{}');
    }
  }
  const catalogSchema = await fetch('http://127.0.0.1:8787/_emdash/api/blackbox/catalog-schema', {
    method: 'POST',
    headers: { Origin: 'http://127.0.0.1:8787', 'X-EmDash-Request': '1' },
  });
  if (!catalogSchema.ok) throw new Error('Local catalog browsing schema could not be prepared.');
  writeFileSync(readyPath, JSON.stringify({ pid: process.pid }));
  console.log('[Local CMS] Staff: http://127.0.0.1:8787/content/');
  await worker.waitUntilExit();
} finally {
  rmSync(readyPath, { force: true });
  await worker.stop();
}
