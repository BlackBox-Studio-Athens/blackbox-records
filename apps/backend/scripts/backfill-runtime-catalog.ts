import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import ts from 'typescript';
import { getPlatformProxy } from 'wrangler';
import { z } from 'zod';
import {
  CatalogReconciler,
  catalogManifest,
  type DesiredCatalogEntry,
  type StripeCatalogEnvironment,
} from '../src/application/commerce/catalog-sync';
import type { StoreItemOption } from '../src/generated/prisma/client';
import { createStripeCatalogGateway } from '../src/infrastructure/stripe';
import { planRuntimeCatalogBackfill } from '../../../scripts/plan-runtime-catalog-backfill';
import { applyRuntimeCatalogBackfill } from '../../../scripts/apply-runtime-catalog-backfill';
import {
  createD1CatalogReadSql,
  createD1CatalogRepositories,
  redactStripeCatalogDiagnostic,
  type D1CatalogRow,
} from '../../../scripts/stripe-catalog-verify';
import { getPrimaryReleaseStoreFormat } from '../../../scripts/stripe-catalog-contract';
import { normalizeDistroContentItemType } from '../../../scripts/distro-inventory-source';

const backend = fileURLToPath(new URL('../', import.meta.url));
const root = path.resolve(backend, '../..');
const resources = JSON.parse(readFileSync(path.join(backend, 'cms-resources.json'), 'utf8'));
const cmsPlanSchema = z.object({
  target: z.string(),
  records: z.array(
    z.object({
      identity: z.string(),
      collection: z.string(),
      slug: z.string(),
      data: z.record(z.string(), z.unknown()),
    }),
  ),
});
const cmsReportSchema = z.object({
  target: z.string(),
  apply: z.literal(false),
  verifyOnly: z.literal(true),
  records: z.number().int().nonnegative(),
  identities: z.record(z.string(), z.string().trim().min(1).max(128)),
});

export function readBackfillSources(
  environment: StripeCatalogEnvironment,
  entries: DesiredCatalogEntry[],
  planInput: unknown,
  reportInput: unknown,
) {
  const plan = cmsPlanSchema.parse(planInput);
  const report = cmsReportSchema.parse(reportInput);
  const target = new URL(plan.target);
  const allowed =
    environment === 'local'
      ? target.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(target.hostname) &&
        ['8787', '8799'].includes(target.port)
      : target.origin === `https://${resources[environment].hostname}`;
  if (
    !allowed ||
    target.pathname !== '/' ||
    target.search ||
    target.hash ||
    target.username ||
    target.password ||
    report.target !== target.origin
  ) {
    throw new Error('CMS verification belongs to a different target.');
  }
  const records = new Map(plan.records.map((record) => [record.identity, record]));
  if (
    records.size !== plan.records.length ||
    report.records !== records.size ||
    Object.keys(report.identities).length !== records.size ||
    [...records.keys()].some((identity) => !report.identities[identity])
  )
    throw new Error('CMS verification is incomplete or contains duplicate sources.');
  return entries.map((catalog) => {
    const collection = catalog.sourceKind === 'release' ? 'releases' : 'distro';
    const identity = `${collection}/${catalog.sourceId}`;
    const record = records.get(identity);
    if (!record || record.collection !== collection || record.slug !== catalog.sourceId)
      throw new Error(`CMS source does not match ${catalog.storeItemSlug}.`);
    const itemType =
      catalog.sourceKind === 'release'
        ? getPrimaryReleaseStoreFormat(z.array(z.string()).parse(record.data.formats))
        : normalizeDistroContentItemType(z.string().min(1).parse(record.data.group));
    if (!itemType) throw new Error(`Physical item type is missing for ${catalog.storeItemSlug}.`);
    return { catalog, cmsSourceId: report.identities[identity], itemType };
  });
}

export async function backfillRuntimeCatalog(args: string[]) {
  const { values } = parseArgs({
    args: args.filter((arg) => arg !== '--'),
    options: {
      env: { type: 'string' },
      'cms-plan': { type: 'string' },
      'cms-report': { type: 'string' },
      'store-item-slug': { type: 'string', multiple: true },
      'local-stripe-test': { type: 'boolean', default: false },
      apply: { type: 'boolean', default: false },
      'plan-sha256': { type: 'string' },
      'confirm-live-catalog-changes': { type: 'boolean', default: false },
    },
  });
  const environment = z.enum(['local', 'uat', 'prd']).parse(values.env);
  if (values['local-stripe-test'] && environment !== 'local')
    throw new Error('--local-stripe-test is only supported for the Local database.');
  if (!values['cms-plan'] || !values['cms-report'])
    throw new Error('Provide the CMS import plan and its read-only verification report.');
  if (values.apply && !/^[a-f0-9]{64}$/.test(values['plan-sha256'] ?? ''))
    throw new Error('Run dry-run first, then pass its --plan-sha256 to apply.');
  if (values.apply && environment === 'prd' && !values['confirm-live-catalog-changes'])
    throw new Error('PRD requires one-run live catalog confirmation.');
  let entries = catalogManifest.entries.filter((entry) =>
    entry.targetEnvironments.includes(environment === 'prd' ? 'prd' : 'uat'),
  );
  if (values['store-item-slug']?.length) {
    const selected = new Set(values['store-item-slug']);
    if ([...selected].some((slug) => !entries.some((entry) => entry.storeItemSlug === slug)))
      throw new Error('Selected Store Item is absent from the target migration manifest.');
    entries = entries.filter((entry) => selected.has(entry.storeItemSlug));
  }
  const sources = readBackfillSources(
    environment,
    entries,
    JSON.parse(readFileSync(values['cms-plan'], 'utf8')),
    JSON.parse(readFileSync(values['cms-report'], 'utf8')),
  );
  const useMock = environment === 'local' && !values['local-stripe-test'];
  const secret = useMock ? 'sk_test_mock' : process.env.STRIPE_SECRET_KEY;
  if (
    !secret ||
    (!useMock && (!secret.startsWith(environment === 'prd' ? 'sk_live_' : 'sk_test_') || secret === 'sk_test_mock'))
  ) {
    throw new Error(
      'Provide the target Stripe key through the authorized command environment; do not copy hosted secrets into local files.',
    );
  }
  const parsed = ts.parseConfigFileTextToJson(
    'wrangler.jsonc',
    readFileSync(path.join(backend, 'wrangler.jsonc'), 'utf8'),
  );
  if (parsed.error) throw new Error('Invalid backend Wrangler configuration.');
  const config = environment === 'local' ? parsed.config : parsed.config.env[environment];
  const database = config.d1_databases.find((binding: { binding: string }) => binding.binding === 'COMMERCE_DB');
  if (
    !database?.database_name ||
    (environment !== 'local' && !database.database_id) ||
    database.database_name === resources[environment].database_name ||
    database.database_id === resources[environment].database_id
  )
    throw new Error('Invalid commerce database target.');
  const output = path.join(root, '.codex-artifacts/emdash-m1', `catalog-backfill-${environment}`);
  mkdirSync(output, { recursive: true });
  const configPath = path.join(output, 'wrangler.json');
  writeFileSync(
    configPath,
    JSON.stringify({
      name: `blackbox-catalog-backfill-${environment}`,
      compatibility_date: parsed.config.compatibility_date,
      d1_databases: [
        {
          binding: 'COMMERCE_DB',
          database_id: database.database_id,
          database_name: database.database_name,
          remote: environment !== 'local',
        },
      ],
    }),
  );
  const platform = await getPlatformProxy<{ COMMERCE_DB: D1Database }>({
    configPath,
    remoteBindings: environment !== 'local',
    persist: environment === 'local' ? { path: path.join(backend, '.wrangler/state/v3') } : false,
  });
  try {
    const db = platform.env.COMMERCE_DB;
    type RawRow = Omit<StoreItemOption, 'createdAt' | 'updatedAt' | 'productProjection'> & {
      createdAt: string | number;
      updatedAt: string | number;
      productProjection: string | null;
    };
    const date = (value: string | number) =>
      new Date(typeof value === 'string' && /^\d{4}-\d\d-\d\d /.test(value) ? value.replace(' ', 'T') + 'Z' : value);
    const rows = (await db.prepare('SELECT * FROM StoreItemOption ORDER BY storeItemSlug').all<RawRow>()).results.map(
      (row) => ({
        ...row,
        createdAt: date(row.createdAt),
        updatedAt: date(row.updatedAt),
        productProjection: row.productProjection === null ? null : JSON.parse(row.productProjection),
      }),
    );
    const catalogRows = (await db.prepare(createD1CatalogReadSql(entries)).all<D1CatalogRow>()).results;
    const nonMock =
      environment === 'local'
        ? catalogRows.filter((row) => row.mappingStripePriceId && !row.mappingStripePriceId.startsWith('price_mock_'))
        : [];
    if (nonMock.length && useMock) {
      writeFileSync(
        path.join(output, 'blocked.json'),
        JSON.stringify(
          {
            environment,
            database: database.database_name,
            applied: 0,
            issues: nonMock.map(({ storeItemSlug, variantId }) => ({
              storeItemSlug,
              variantId,
              code: 'local_non_mock_binding',
            })),
          },
          null,
          2,
        ),
      );
      throw new Error(
        `${nonMock.length} Local items have non-mock bindings. Use --local-stripe-test with the matching test account key to reconcile them; no bindings were changed or sent to stripe-mock.`,
      );
    }
    const repositories = createD1CatalogRepositories(environment, catalogRows);
    const noWrite = async (): Promise<never> => {
      throw new Error('Reconciliation cannot write during backfill.');
    };
    const reconciler = new CatalogReconciler({
      environment,
      storeItems: repositories.storeItems,
      storeOfferSnapshots: { ...repositories.storeOfferSnapshots, save: noWrite },
      variantStripeMappings: { ...repositories.variantStripeMappings, save: noWrite },
      stripeCatalog: createStripeCatalogGateway({
        STRIPE_SECRET_KEY: secret,
        ...(useMock ? { STRIPE_API_BASE_URL: 'http://127.0.0.1:12110' } : {}),
      }),
    });
    const reconciliation = await reconciler.verifyBuyableCatalog({ apply: false });
    writeFileSync(path.join(output, 'reconciliation.json'), JSON.stringify(reconciliation, null, 2));
    const plan = planRuntimeCatalogBackfill({ environment, sources, rows, reconciliation });
    const planSha256 = createHash('sha256')
      .update(
        JSON.stringify(
          {
            database: database.database_id ?? database.database_name,
            plan,
            prices: reconciliation.results.map(({ resolvedPrice }) => resolvedPrice),
          },
          (key, value) => (key === 'requestId' || key === 'idempotentReplayed' ? undefined : value),
        ),
      )
      .digest('hex');
    if (values.apply && values['plan-sha256'] !== planSha256)
      throw new Error('Catalog or provider state changed since dry-run. Review a new plan before applying.');
    const result = await applyRuntimeCatalogBackfill(db, plan, {
      environment,
      apply: values.apply,
      confirmLiveCatalogChanges: values['confirm-live-catalog-changes'],
    });
    const report = {
      database: database.database_name,
      environment,
      planSha256,
      unchanged: plan.unchanged.length,
      ...result,
    };
    writeFileSync(path.join(output, values.apply ? 'apply.json' : 'dry-run.json'), JSON.stringify(report, null, 2));
    return report;
  } finally {
    await platform.dispose();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  backfillRuntimeCatalog(process.argv.slice(2))
    .then((report) => console.log(JSON.stringify(report, null, 2)))
    .catch((error: unknown) => {
      console.error(redactStripeCatalogDiagnostic(error instanceof Error ? error.message : String(error)));
      process.exitCode = 1;
    });
}
