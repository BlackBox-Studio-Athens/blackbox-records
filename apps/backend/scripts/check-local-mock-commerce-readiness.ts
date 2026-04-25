import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { type LocalMockStoreItem, readLocalMockStoreItems } from './seed-local-mock-commerce-state';

export type LocalMockReadinessRow = {
  availabilityStatus: null | string;
  canBuy: boolean | null | number;
  onlineQuantity: null | number;
  quantity: null | number;
  sourceId: null | string;
  sourceKind: null | string;
  storeItemSlug: string;
  stripePriceId: null | string;
  variantId: null | string;
};

export type LocalMockReadinessIssueCode =
  | 'cannot_buy'
  | 'missing_item_availability'
  | 'missing_stock'
  | 'missing_store_item_option'
  | 'missing_variant_stripe_mapping'
  | 'non_mock_stripe_price'
  | 'non_positive_stock'
  | 'not_available'
  | 'source_id_mismatch'
  | 'source_kind_mismatch'
  | 'variant_mismatch';

export type LocalMockReadinessIssue = {
  code: LocalMockReadinessIssueCode;
  detail?: string;
  sourceId: string;
  sourceKind: LocalMockStoreItem['sourceKind'];
  storeItemSlug: string;
};

export type LocalMockReadinessResult = {
  issues: LocalMockReadinessIssue[];
  readyItems: number;
  totalItems: number;
};

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const setupInstructions = [
  'Prepare local mock commerce state with:',
  '  pnpm --filter @blackbox/backend d1:prepare:local',
  '  pnpm --filter @blackbox/backend d1:seed:stripe-mock:local',
].join('\n');

export function checkLocalMockCommerceReadiness(
  storeItems: LocalMockStoreItem[],
  rows: LocalMockReadinessRow[],
): LocalMockReadinessResult {
  const rowsBySlug = new Map(rows.map((row) => [row.storeItemSlug, row]));
  const issues = storeItems.flatMap((storeItem) =>
    findStoreItemIssues(storeItem, rowsBySlug.get(storeItem.storeItemSlug)),
  );
  const slugsWithIssues = new Set(issues.map((issue) => issue.storeItemSlug));

  return {
    issues,
    readyItems: storeItems.filter((storeItem) => !slugsWithIssues.has(storeItem.storeItemSlug)).length,
    totalItems: storeItems.length,
  };
}

export function formatLocalMockReadinessReport(result: LocalMockReadinessResult): string {
  if (result.issues.length === 0) {
    return `Local mock checkout readiness OK: ${result.readyItems}/${result.totalItems} store item(s) ready.`;
  }

  return [
    `Local mock checkout readiness failed: ${result.issues.length} issue(s) across ${result.totalItems - result.readyItems} store item(s).`,
    ...result.issues.map((issue) =>
      [
        `- ${issue.storeItemSlug} (${issue.sourceKind}/${issue.sourceId}): ${issue.code}`,
        issue.detail ? ` - ${issue.detail}` : '',
      ].join(''),
    ),
    '',
    setupInstructions,
  ].join('\n');
}

export function parseLocalMockReadinessRows(jsonText: string): LocalMockReadinessRow[] {
  const parsed = JSON.parse(jsonText) as Array<{ results?: unknown; success?: boolean }>;
  const firstResult = parsed[0];

  if (!firstResult?.success || !Array.isArray(firstResult.results)) {
    throw new Error('Wrangler did not return a successful D1 result set.');
  }

  return firstResult.results.map(toLocalMockReadinessRow);
}

function findStoreItemIssues(
  storeItem: LocalMockStoreItem,
  row: LocalMockReadinessRow | undefined,
): LocalMockReadinessIssue[] {
  if (!row) {
    return [createIssue(storeItem, 'missing_store_item_option')];
  }

  const issues: LocalMockReadinessIssue[] = [];

  if (row.sourceKind !== storeItem.sourceKind) {
    issues.push(createIssue(storeItem, 'source_kind_mismatch', `D1 has ${formatOptional(row.sourceKind)}.`));
  }

  if (row.sourceId !== storeItem.sourceId) {
    issues.push(createIssue(storeItem, 'source_id_mismatch', `D1 has ${formatOptional(row.sourceId)}.`));
  }

  if (row.variantId !== storeItem.variantId) {
    issues.push(createIssue(storeItem, 'variant_mismatch', `D1 has ${formatOptional(row.variantId)}.`));
  }

  if (!row.availabilityStatus) {
    issues.push(createIssue(storeItem, 'missing_item_availability'));
  } else if (row.availabilityStatus !== 'available') {
    issues.push(createIssue(storeItem, 'not_available', `D1 has ${row.availabilityStatus}.`));
  }

  if (!isD1True(row.canBuy)) {
    issues.push(createIssue(storeItem, 'cannot_buy', `D1 has ${formatOptional(row.canBuy)}.`));
  }

  if (row.quantity === null || row.onlineQuantity === null) {
    issues.push(createIssue(storeItem, 'missing_stock'));
  } else if (row.quantity <= 0 || row.onlineQuantity <= 0) {
    issues.push(createIssue(storeItem, 'non_positive_stock', `D1 has ${row.quantity}/${row.onlineQuantity}.`));
  }

  if (!row.stripePriceId) {
    issues.push(createIssue(storeItem, 'missing_variant_stripe_mapping'));
  } else if (!row.stripePriceId.startsWith('price_mock_')) {
    issues.push(createIssue(storeItem, 'non_mock_stripe_price', `D1 has ${row.stripePriceId}.`));
  }

  return issues;
}

function createIssue(
  storeItem: LocalMockStoreItem,
  code: LocalMockReadinessIssueCode,
  detail?: string,
): LocalMockReadinessIssue {
  return {
    code,
    detail,
    sourceId: storeItem.sourceId,
    sourceKind: storeItem.sourceKind,
    storeItemSlug: storeItem.storeItemSlug,
  };
}

function createLocalMockReadinessSql(): string {
  return [
    'SELECT',
    '  o."storeItemSlug" AS "storeItemSlug",',
    '  o."sourceKind" AS "sourceKind",',
    '  o."sourceId" AS "sourceId",',
    '  o."variantId" AS "variantId",',
    '  a."status" AS "availabilityStatus",',
    '  a."canBuy" AS "canBuy",',
    '  s."quantity" AS "quantity",',
    '  s."onlineQuantity" AS "onlineQuantity",',
    '  m."stripePriceId" AS "stripePriceId"',
    'FROM "StoreItemOption" o',
    'LEFT JOIN "ItemAvailability" a ON a."variantId" = o."variantId"',
    'LEFT JOIN "Stock" s ON s."variantId" = o."variantId"',
    'LEFT JOIN "VariantStripeMapping" m ON m."variantId" = o."variantId"',
    'ORDER BY o."storeItemSlug";',
  ].join('\n');
}

function queryLocalReadinessRows(): LocalMockReadinessRow[] {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'blackbox-local-mock-readiness-'));
  const tempSqlPath = path.join(tempDir, 'local-mock-readiness.sql');

  try {
    writeFileSync(tempSqlPath, createLocalMockReadinessSql());

    const command = createProcessCommand('pnpm', [
      'exec',
      'wrangler',
      'd1',
      'execute',
      'COMMERCE_DB',
      '--local',
      '--file',
      tempSqlPath,
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

    return parseLocalMockReadinessRows(result.stdout);
  } finally {
    rmSync(tempDir, { force: true, recursive: true });
  }
}

function toLocalMockReadinessRow(value: unknown): LocalMockReadinessRow {
  const row = value as Partial<LocalMockReadinessRow>;

  return {
    availabilityStatus: typeof row.availabilityStatus === 'string' ? row.availabilityStatus : null,
    canBuy: typeof row.canBuy === 'boolean' || typeof row.canBuy === 'number' ? row.canBuy : null,
    onlineQuantity: typeof row.onlineQuantity === 'number' ? row.onlineQuantity : null,
    quantity: typeof row.quantity === 'number' ? row.quantity : null,
    sourceId: typeof row.sourceId === 'string' ? row.sourceId : null,
    sourceKind: typeof row.sourceKind === 'string' ? row.sourceKind : null,
    storeItemSlug: typeof row.storeItemSlug === 'string' ? row.storeItemSlug : '',
    stripePriceId: typeof row.stripePriceId === 'string' ? row.stripePriceId : null,
    variantId: typeof row.variantId === 'string' ? row.variantId : null,
  };
}

function createProcessCommand(command: string, args: string[]): { args: string[]; command: string } {
  if (process.platform !== 'win32') {
    return { args, command };
  }

  return {
    args: ['/d', '/s', '/c', command, ...args],
    command: 'cmd.exe',
  };
}

function isD1True(value: boolean | null | number): boolean {
  return value === true || value === 1;
}

function formatOptional(value: boolean | null | number | string): string {
  return value === null ? 'null' : String(value);
}

async function main(): Promise<void> {
  try {
    const storeItems = await readLocalMockStoreItems();
    const readiness = checkLocalMockCommerceReadiness(storeItems, queryLocalReadinessRows());
    const report = formatLocalMockReadinessReport(readiness);

    if (readiness.issues.length > 0) {
      console.error(report);
      process.exit(1);
    }

    console.log(report);
  } catch (error) {
    console.error('Local mock checkout readiness could not read local D1.');
    console.error(error instanceof Error ? error.message : String(error));
    console.error('');
    console.error(setupInstructions);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
