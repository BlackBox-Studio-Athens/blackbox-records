import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  currentDesiredCatalogEntries,
  type DesiredCatalogEntry,
} from '../apps/backend/src/application/commerce/catalog-sync/desired-catalog-state';

export type ProductionCatalogReadinessPhase = 'post-apply' | 'pre-apply';

export type ProductionCatalogReadinessOptions = {
  phase: ProductionCatalogReadinessPhase;
};

export type ProductionCatalogReadinessRow = {
  amountMinor: number | null;
  canBuy: boolean | number | null;
  currencyCode: string | null;
  mappingStripePriceId: string | null;
  onlineQuantity: number | null;
  priceActive: boolean | number | null;
  productActive: boolean | number | null;
  sourceId: string | null;
  sourceKind: string | null;
  snapshotStripePriceId: string | null;
  status: string | null;
  storeItemSlug: string | null;
  variantId: string;
};

export type ProductionCatalogReadinessIssue = {
  code:
    | 'availability_mismatch'
    | 'missing_availability'
    | 'missing_mapping'
    | 'missing_snapshot'
    | 'missing_stock'
    | 'missing_store_item'
    | 'non_positive_stock'
    | 'snapshot_price_mismatch'
    | 'source_mismatch';
  detail: string;
  phase: ProductionCatalogReadinessPhase;
  severity: 'blocking' | 'pending';
  storeItemSlug: string;
  variantId: string;
};

export type ProductionCatalogReadinessResult = {
  checkedVariants: number;
  issues: ProductionCatalogReadinessIssue[];
  phase: ProductionCatalogReadinessPhase;
};

const backendDir = path.join(process.cwd(), 'apps', 'backend');

export function parseProductionCatalogReadinessArgs(args: string[]): ProductionCatalogReadinessOptions {
  let phase: ProductionCatalogReadinessPhase = 'pre-apply';

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log('Usage: pnpm production:catalog-readiness:check [--phase pre-apply|post-apply]');
      process.exit(0);
    }

    if (arg === '--phase') {
      phase = parsePhase(args[index + 1]);
      index += 1;
      continue;
    }

    if (arg?.startsWith('--phase=')) {
      phase = parsePhase(arg.slice('--phase='.length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { phase };
}

export function evaluateProductionCatalogReadiness(input: {
  entries: readonly DesiredCatalogEntry[];
  phase: ProductionCatalogReadinessPhase;
  rows: readonly ProductionCatalogReadinessRow[];
}): ProductionCatalogReadinessResult {
  const productionEntries = input.entries.filter((entry) => entry.targetEnvironments.includes('production'));
  const rowsByVariantId = new Map(input.rows.map((row) => [row.variantId, row]));
  const issues = productionEntries.flatMap((entry) =>
    evaluateProductionCatalogEntryReadiness(entry, rowsByVariantId.get(entry.variantId) ?? null, input.phase),
  );

  return {
    checkedVariants: productionEntries.length,
    issues,
    phase: input.phase,
  };
}

export function formatProductionCatalogReadinessReport(result: ProductionCatalogReadinessResult): string {
  const blockingIssues = result.issues.filter((issue) => issue.severity === 'blocking');
  const pendingIssues = result.issues.filter((issue) => issue.severity === 'pending');
  const lines = [
    `Production catalog D1 readiness ${blockingIssues.length ? 'failed' : 'OK'}.`,
    `Phase: ${result.phase}`,
    `Checked variants: ${result.checkedVariants}`,
    `Blocking issues: ${blockingIssues.length}`,
    `Pending post-apply expectations: ${pendingIssues.length}`,
  ];

  if (result.issues.length) {
    lines.push('', 'Issues:');
    lines.push(
      ...result.issues.map(
        (issue) => `- ${issue.severity}:${issue.code} ${issue.storeItemSlug} / ${issue.variantId}: ${issue.detail}`,
      ),
    );
  }

  return lines.join('\n');
}

function evaluateProductionCatalogEntryReadiness(
  entry: DesiredCatalogEntry,
  row: ProductionCatalogReadinessRow | null,
  phase: ProductionCatalogReadinessPhase,
): ProductionCatalogReadinessIssue[] {
  const issues: ProductionCatalogReadinessIssue[] = [];

  if (!row?.storeItemSlug) {
    issues.push(createIssue(entry, phase, 'blocking', 'missing_store_item', 'StoreItemOption is missing.'));
    return issues;
  }

  if (
    row.sourceKind !== entry.sourceKind ||
    row.sourceId !== entry.sourceId ||
    row.storeItemSlug !== entry.storeItemSlug
  ) {
    issues.push(
      createIssue(
        entry,
        phase,
        'blocking',
        'source_mismatch',
        `StoreItemOption points to ${row.sourceKind ?? 'unknown'}:${row.sourceId ?? 'unknown'} / ${
          row.storeItemSlug ?? 'unknown'
        }.`,
      ),
    );
  }

  if (!row.status) {
    issues.push(createIssue(entry, phase, 'blocking', 'missing_availability', 'ItemAvailability is missing.'));
  } else {
    const expectedCanBuy = entry.availability === 'published';
    const expectedStatus = expectedCanBuy ? 'available' : 'sold_out';

    if (row.status !== expectedStatus || isD1True(row.canBuy) !== expectedCanBuy) {
      issues.push(
        createIssue(
          entry,
          phase,
          'blocking',
          'availability_mismatch',
          `Expected ${expectedStatus} / canBuy=${expectedCanBuy}; D1 has ${row.status} / canBuy=${formatD1Boolean(
            row.canBuy,
          )}.`,
        ),
      );
    }
  }

  if (entry.availability !== 'published') {
    return issues;
  }

  if (row.onlineQuantity === null) {
    issues.push(
      createIssue(
        entry,
        phase,
        'blocking',
        'missing_stock',
        'Published production item has no Stock row; set explicit initial stock or create operator-owned stock before promotion.',
      ),
    );
  } else if (row.onlineQuantity <= 0) {
    issues.push(createIssue(entry, phase, 'blocking', 'non_positive_stock', `Online stock is ${row.onlineQuantity}.`));
  }

  if (!row.mappingStripePriceId) {
    issues.push(
      createIssue(
        entry,
        phase,
        phase === 'post-apply' ? 'blocking' : 'pending',
        'missing_mapping',
        'VariantStripeMapping is not written yet.',
      ),
    );
  }

  if (!row.snapshotStripePriceId) {
    issues.push(
      createIssue(
        entry,
        phase,
        phase === 'post-apply' ? 'blocking' : 'pending',
        'missing_snapshot',
        'StoreOfferSnapshot is not written yet.',
      ),
    );
  } else if (row.mappingStripePriceId && row.mappingStripePriceId !== row.snapshotStripePriceId) {
    issues.push(
      createIssue(
        entry,
        phase,
        phase === 'post-apply' ? 'blocking' : 'pending',
        'snapshot_price_mismatch',
        'StoreOfferSnapshot and VariantStripeMapping point at different Stripe Prices.',
      ),
    );
  }

  return issues;
}

function createIssue(
  entry: DesiredCatalogEntry,
  phase: ProductionCatalogReadinessPhase,
  severity: ProductionCatalogReadinessIssue['severity'],
  code: ProductionCatalogReadinessIssue['code'],
  detail: string,
): ProductionCatalogReadinessIssue {
  return {
    code,
    detail,
    phase,
    severity,
    storeItemSlug: entry.storeItemSlug,
    variantId: entry.variantId,
  };
}

function readProductionCatalogReadinessRows(entries: readonly DesiredCatalogEntry[]): ProductionCatalogReadinessRow[] {
  const variants = entries
    .filter((entry) => entry.targetEnvironments.includes('production'))
    .map((entry) => sqlString(entry.variantId));

  if (variants.length === 0) {
    return [];
  }

  return parseD1Rows(
    runD1Sql(
      [
        'SELECT',
        '  expected.variantId AS variantId,',
        '  o.storeItemSlug AS storeItemSlug,',
        '  o.sourceKind AS sourceKind,',
        '  o.sourceId AS sourceId,',
        '  a.status AS status,',
        '  a.canBuy AS canBuy,',
        '  stock.onlineQuantity AS onlineQuantity,',
        '  m.stripePriceId AS mappingStripePriceId,',
        '  s.stripePriceId AS snapshotStripePriceId,',
        '  s.amountMinor AS amountMinor,',
        '  s.currencyCode AS currencyCode,',
        '  s.priceActive AS priceActive,',
        '  s.productActive AS productActive',
        `FROM (VALUES ${variants.map((variant) => `(${variant})`).join(', ')}) AS expected(variantId)`,
        'LEFT JOIN StoreItemOption o ON o.variantId = expected.variantId',
        'LEFT JOIN ItemAvailability a ON a.variantId = expected.variantId',
        'LEFT JOIN Stock stock ON stock.variantId = expected.variantId',
        'LEFT JOIN VariantStripeMapping m ON m.variantId = expected.variantId',
        'LEFT JOIN StoreOfferSnapshot s ON s.variantId = expected.variantId',
        'ORDER BY expected.variantId;',
      ].join('\n'),
    ),
  );
}

function runD1Sql(sql: string): string {
  const commandSql = sql.replace(/\s+/g, ' ').trim();
  const command = createPnpmCommand([
    'exec',
    'wrangler',
    'd1',
    'execute',
    'COMMERCE_DB',
    '--env',
    'production',
    '--remote',
    '--command',
    commandSql,
    '--json',
  ]);
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

function isD1True(value: boolean | number | null): boolean {
  return value === true || value === 1;
}

function formatD1Boolean(value: boolean | number | null): string {
  return value === null ? 'null' : String(isD1True(value));
}

function sqlString(value: string): string {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function createPnpmCommand(args: string[]): { args: string[]; command: string } {
  return process.platform === 'win32'
    ? { args: ['/d', '/s', '/c', 'pnpm', ...args], command: 'cmd.exe' }
    : { args, command: 'pnpm' };
}

function parsePhase(value: string | undefined): ProductionCatalogReadinessPhase {
  if (value === 'pre-apply' || value === 'post-apply') {
    return value;
  }

  throw new Error('Production catalog readiness phase must be pre-apply or post-apply.');
}

async function main(): Promise<void> {
  const options = parseProductionCatalogReadinessArgs(process.argv.slice(2));
  const rows = readProductionCatalogReadinessRows(currentDesiredCatalogEntries);
  const result = evaluateProductionCatalogReadiness({
    entries: currentDesiredCatalogEntries,
    phase: options.phase,
    rows,
  });
  const report = formatProductionCatalogReadinessReport(result);

  if (result.issues.some((issue) => issue.severity === 'blocking')) {
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
