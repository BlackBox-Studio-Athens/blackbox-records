import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  CatalogReconciler,
  redactStripeObjectId,
  type CatalogSyncRunResult,
  type StripeCatalogEnvironment,
} from '../apps/backend/src/application/commerce/catalog-sync';
import { parseStoreItemSlug, parseStripePriceId, parseVariantId } from '../apps/backend/src/domain/commerce';
import type {
  StoreItemOptionRecord,
  StoreItemOptionRepository,
  StoreItemSourceRef,
  StoreOfferSnapshotRecord,
  StoreOfferSnapshotRepository,
  StoreOfferSnapshotState,
  VariantStripeMappingRecord,
  VariantStripeMappingRepository,
} from '../apps/backend/src/domain/commerce/repositories/spi';
import { createStripeCatalogGateway } from '../apps/backend/src/infrastructure/stripe';
import { stripeCatalogStoreItemContracts } from './stripe-catalog-contract';

type CatalogVerifyOptions = {
  apply: boolean;
  environment: StripeCatalogEnvironment;
};

type D1CatalogRow = {
  amountMinor: number | null;
  currencyCode: string | null;
  freshUntil: string | null;
  mappingStripePriceId: string | null;
  priceActive: boolean | number | null;
  productActive: boolean | number | null;
  snapshotStripePriceId: string | null;
  sourceId: string;
  sourceKind: 'distro' | 'release';
  storeItemSlug: string;
  stripeLookupKey: string | null;
  syncedAt: string | null;
  variantId: string;
};

const backendDir = path.join(process.cwd(), 'apps', 'backend');

export function parseStripeCatalogVerifyArgs(args: string[]): CatalogVerifyOptions {
  const options: CatalogVerifyOptions = {
    apply: false,
    environment: 'sandbox',
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--apply') {
      options.apply = true;
      continue;
    }

    if (arg === '--env') {
      const value = args[index + 1];
      index += 1;
      options.environment = parseEnvironment(value);
      continue;
    }

    if (arg?.startsWith('--env=')) {
      options.environment = parseEnvironment(arg.slice('--env='.length));
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log('Usage: pnpm stripe:catalog:verify --env sandbox [--apply]');
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.apply && options.environment !== 'sandbox') {
    throw new Error('Stripe catalog apply is allowed only with --env sandbox.');
  }

  return options;
}

export async function verifyStripeCatalog(options: CatalogVerifyOptions): Promise<CatalogSyncRunResult> {
  const rows = readD1CatalogRows(options.environment);
  const repositories = createD1CatalogRepositories(options.environment, rows);
  const reconciler = new CatalogReconciler({
    environment: options.environment,
    storeItems: repositories.storeItems,
    storeOfferSnapshots: repositories.storeOfferSnapshots,
    stripeCatalog: createStripeCatalogGateway({
      STRIPE_API_BASE_URL: process.env.STRIPE_API_BASE_URL,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
    }),
    variantStripeMappings: repositories.variantStripeMappings,
  });

  const result = await reconciler.verifyBuyableCatalog({
    apply: options.apply,
    expectedPrices: createExpectedPriceMap(),
  });

  if (options.apply && result.results.some((resultItem) => resultItem.actions.length > 0)) {
    return reconciler.verifyBuyableCatalog({
      apply: false,
      expectedPrices: createExpectedPriceMap(),
    });
  }

  return result;
}

export function formatStripeCatalogVerifyReport(result: CatalogSyncRunResult): string {
  const lines = [
    `Stripe catalog verification ${result.issues.length ? 'failed' : 'OK'}.`,
    `Environment: ${result.environment}`,
    `Mode: ${result.dryRun ? 'dry-run' : 'apply'}`,
    `Checked variants: ${result.results.length}`,
  ];

  for (const resultItem of result.results) {
    const priceLabel = resultItem.resolvedPrice
      ? redactStripeObjectId(resultItem.resolvedPrice.priceId)
      : 'not resolved';
    const actionLabels = resultItem.actions.map((action) => {
      if (
        action.kind === 'archive_price' ||
        action.kind === 'update_mapping' ||
        action.kind === 'update_stripe_metadata'
      ) {
        return `${action.kind}:${redactStripeObjectId(action.stripePriceId)}`;
      }

      return action.kind;
    });

    lines.push(
      `- ${resultItem.storeItem.storeItemSlug} / ${resultItem.storeItem.variantId}: ${priceLabel}; issues=${resultItem.issueCount}; actions=${
        actionLabels.length ? actionLabels.join(', ') : 'none'
      }`,
    );
  }

  if (result.issues.length) {
    lines.push('', 'Issues:');
    lines.push(
      ...result.issues.map((issue) => `- ${issue.storeItemSlug} / ${issue.variantId}: ${issue.code} - ${issue.detail}`),
    );
  }

  return lines.join('\n');
}

function createExpectedPriceMap() {
  return new Map(
    stripeCatalogStoreItemContracts.map((contract) => [
      contract.variantId,
      {
        amountMinor: contract.amountMinor,
        currencyCode: contract.currencyCode,
      },
    ]),
  );
}

function createD1CatalogRepositories(environment: StripeCatalogEnvironment, rows: D1CatalogRow[]) {
  const storeItemRecords = rows.map(toStoreItemOptionRecord);
  const mappingRecords = new Map(
    rows.flatMap(
      (row): Array<[string, VariantStripeMappingRecord]> =>
        row.mappingStripePriceId
          ? [
              [
                row.variantId,
                {
                  stripePriceId: parseStripePriceId(row.mappingStripePriceId),
                  variantId: parseVariantId(row.variantId),
                },
              ],
            ]
          : [],
    ),
  );
  const snapshotRecords = new Map(
    rows.flatMap((row): Array<[string, StoreOfferSnapshotRecord]> => {
      if (!row.snapshotStripePriceId || !row.stripeLookupKey || !row.syncedAt || !row.freshUntil) {
        return [];
      }

      return [
        [
          row.variantId,
          {
            amountMinor: Number(row.amountMinor),
            currencyCode: String(row.currencyCode),
            freshUntil: new Date(row.freshUntil),
            priceActive: isD1True(row.priceActive),
            productActive: isD1True(row.productActive),
            storeItemSlug: parseStoreItemSlug(row.storeItemSlug),
            stripeLookupKey: row.stripeLookupKey,
            stripePriceId: parseStripePriceId(row.snapshotStripePriceId),
            syncedAt: new Date(row.syncedAt),
            variantId: parseVariantId(row.variantId),
          },
        ],
      ];
    }),
  );

  const storeItems: StoreItemOptionRepository = {
    findBySource: async (source: StoreItemSourceRef) =>
      storeItemRecords.find(
        (record) => record.sourceKind === source.sourceKind && record.sourceId === source.sourceId,
      ) ?? null,
    findByStoreItemSlug: async (storeItemSlug) =>
      storeItemRecords.find((record) => record.storeItemSlug === storeItemSlug) ?? null,
    findByVariantId: async (variantId) => storeItemRecords.find((record) => record.variantId === variantId) ?? null,
    search: async (_query, limit) => storeItemRecords.slice(0, limit),
  };
  const variantStripeMappings: VariantStripeMappingRepository = {
    findByVariantId: async (variantId) => mappingRecords.get(variantId) ?? null,
    save: async (record) => {
      mappingRecords.set(record.variantId, record);
      runD1Sql(
        environment,
        [
          'INSERT INTO VariantStripeMapping (id, variantId, stripePriceId, createdAt, updatedAt)',
          `VALUES (${sqlString(`variant_stripe_mapping_${toSqlIdFragment(record.variantId)}`)}, ${sqlString(
            record.variantId,
          )}, ${sqlString(record.stripePriceId)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          'ON CONFLICT(variantId) DO UPDATE SET',
          '  stripePriceId = excluded.stripePriceId,',
          '  updatedAt = CURRENT_TIMESTAMP;',
        ].join('\n'),
      );

      return record;
    },
  };
  const storeOfferSnapshots: StoreOfferSnapshotRepository = {
    findByStoreItemSlug: async (storeItemSlug) =>
      [...snapshotRecords.values()].find((record) => record.storeItemSlug === storeItemSlug) ?? null,
    findByVariantId: async (variantId) => snapshotRecords.get(variantId) ?? null,
    save: async (snapshot: StoreOfferSnapshotState) => {
      snapshotRecords.set(snapshot.variantId, snapshot);
      runD1Sql(environment, createStoreOfferSnapshotUpsertSql(snapshot));

      return snapshot;
    },
  };

  return { storeItems, storeOfferSnapshots, variantStripeMappings };
}

function readD1CatalogRows(environment: StripeCatalogEnvironment): D1CatalogRow[] {
  return parseD1Rows<D1CatalogRow>(
    runD1ReadSql(
      environment,
      [
        'SELECT',
        '  o.storeItemSlug AS storeItemSlug,',
        '  o.sourceKind AS sourceKind,',
        '  o.sourceId AS sourceId,',
        '  o.variantId AS variantId,',
        '  m.stripePriceId AS mappingStripePriceId,',
        '  s.stripePriceId AS snapshotStripePriceId,',
        '  s.stripeLookupKey AS stripeLookupKey,',
        '  s.amountMinor AS amountMinor,',
        '  s.currencyCode AS currencyCode,',
        '  s.priceActive AS priceActive,',
        '  s.productActive AS productActive,',
        '  s.syncedAt AS syncedAt,',
        '  s.freshUntil AS freshUntil',
        'FROM StoreItemOption o',
        'LEFT JOIN VariantStripeMapping m ON m.variantId = o.variantId',
        'LEFT JOIN StoreOfferSnapshot s ON s.variantId = o.variantId',
        `WHERE o.variantId IN (${stripeCatalogStoreItemContracts.map((contract) => sqlString(contract.variantId)).join(', ')})`,
        'ORDER BY o.storeItemSlug;',
      ].join('\n'),
    ),
  );
}

function runD1ReadSql(environment: StripeCatalogEnvironment, sql: string): string {
  return runD1Sql(environment, sql);
}

function runD1Sql(environment: StripeCatalogEnvironment, sql: string): string {
  const commandSql = sql.replace(/\s+/g, ' ').trim();
  const args =
    environment === 'local'
      ? ['exec', 'wrangler', 'd1', 'execute', 'COMMERCE_DB', '--local', '--command', commandSql, '--json']
      : [
          'exec',
          'wrangler',
          'd1',
          'execute',
          'COMMERCE_DB',
          '--env',
          environment,
          '--remote',
          '--command',
          commandSql,
          '--json',
        ];
  const command = createPnpmCommand(args);
  const result = spawnSync(command.command, command.args, {
    cwd: backendDir,
    encoding: 'utf8',
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error([result.stderr.trim(), result.stdout.trim()].filter(Boolean).join('\n'));
  }

  return result.stdout;
}

function createPnpmCommand(args: string[]): { args: string[]; command: string } {
  return process.platform === 'win32'
    ? { args: ['/d', '/s', '/c', 'pnpm', ...args], command: 'cmd.exe' }
    : { args, command: 'pnpm' };
}

export function parseD1Rows<T>(jsonText: string): T[] {
  const jsonStartIndex = jsonText.indexOf('[');
  const jsonEndIndex = jsonText.lastIndexOf(']');

  if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonEndIndex < jsonStartIndex) {
    throw new Error('Wrangler did not return a JSON D1 result set.');
  }

  const parsed = JSON.parse(jsonText.slice(jsonStartIndex, jsonEndIndex + 1)) as Array<{
    results?: unknown;
    success?: boolean;
  }>;
  const first = parsed[0];

  if (!first?.success || !Array.isArray(first.results)) {
    throw new Error('Wrangler did not return a successful D1 result set.');
  }

  return first.results as T[];
}

function toStoreItemOptionRecord(row: D1CatalogRow): StoreItemOptionRecord {
  return {
    sourceId: row.sourceId,
    sourceKind: row.sourceKind,
    storeItemSlug: parseStoreItemSlug(row.storeItemSlug),
    variantId: parseVariantId(row.variantId),
  };
}

function createStoreOfferSnapshotUpsertSql(snapshot: StoreOfferSnapshotState): string {
  return [
    'INSERT INTO StoreOfferSnapshot (',
    '  id, storeItemSlug, variantId, stripePriceId, stripeLookupKey,',
    '  amountMinor, currencyCode, priceActive, productActive, syncedAt, freshUntil, createdAt, updatedAt',
    ')',
    `VALUES (${[
      sqlString(`store_offer_snapshot_${toSqlIdFragment(snapshot.variantId)}`),
      sqlString(snapshot.storeItemSlug),
      sqlString(snapshot.variantId),
      sqlString(snapshot.stripePriceId),
      sqlString(snapshot.stripeLookupKey),
      snapshot.amountMinor,
      sqlString(snapshot.currencyCode),
      snapshot.priceActive ? 1 : 0,
      snapshot.productActive ? 1 : 0,
      sqlString(snapshot.syncedAt.toISOString()),
      sqlString(snapshot.freshUntil.toISOString()),
      'CURRENT_TIMESTAMP',
      'CURRENT_TIMESTAMP',
    ].join(', ')})`,
    'ON CONFLICT(variantId) DO UPDATE SET',
    '  storeItemSlug = excluded.storeItemSlug,',
    '  stripePriceId = excluded.stripePriceId,',
    '  stripeLookupKey = excluded.stripeLookupKey,',
    '  amountMinor = excluded.amountMinor,',
    '  currencyCode = excluded.currencyCode,',
    '  priceActive = excluded.priceActive,',
    '  productActive = excluded.productActive,',
    '  syncedAt = excluded.syncedAt,',
    '  freshUntil = excluded.freshUntil,',
    '  updatedAt = CURRENT_TIMESTAMP;',
  ].join('\n');
}

function isD1True(value: boolean | number | null): boolean {
  return value === true || value === 1;
}

function sqlString(value: string): string {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function toSqlIdFragment(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'item';
}

function parseEnvironment(value: string | undefined): StripeCatalogEnvironment {
  if (value === 'local' || value === 'sandbox' || value === 'production') {
    return value;
  }

  throw new Error('--env must be one of: local, sandbox, production.');
}

async function main() {
  const options = parseStripeCatalogVerifyArgs(process.argv.slice(2));
  const result = await verifyStripeCatalog(options);
  const report = formatStripeCatalogVerifyReport(result);

  if (result.issues.length) {
    console.error(report);
    process.exit(1);
  }

  console.log(report);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
