import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export type LocalMockStoreItem = {
  sourceId: string;
  sourceKind: 'release' | 'distro';
  storeItemSlug: string;
  title: string;
  variantId: string;
};

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(backendDir, '..', '..');
const releasesDir = path.join(repoRoot, 'apps', 'web', 'src', 'content', 'releases');
const distroDir = path.join(repoRoot, 'apps', 'web', 'src', 'content', 'distro');

const releaseStoreItemSlugByReleaseId: Record<string, string> = {
  'barren-point': 'disintegration-black-vinyl-lp',
  caregivers: 'caregivers-vinyl',
};

const releaseVariantIdByReleaseId: Record<string, string> = {
  'barren-point': 'variant_barren-point_standard',
};

const mockQuantity = 99;

export async function readLocalMockStoreItems(): Promise<LocalMockStoreItem[]> {
  const [releases, distroItems] = await Promise.all([
    readReleaseStoreItems(releasesDir),
    readDistroStoreItems(distroDir),
  ]);

  return [...releases, ...distroItems].sort((left, right) => left.storeItemSlug.localeCompare(right.storeItemSlug));
}

export async function readReleaseStoreItems(directory: string): Promise<LocalMockStoreItem[]> {
  const files = (await readdir(directory)).filter((fileName) => fileName.endsWith('.md')).sort();
  const storeItems: LocalMockStoreItem[] = [];

  for (const fileName of files) {
    const sourceId = path.basename(fileName, '.md');
    const frontmatter = parseFrontmatter(await readFile(path.join(directory, fileName), 'utf8'));
    const storeItemSlug = releaseStoreItemSlugByReleaseId[sourceId] ?? sourceId;

    storeItems.push({
      sourceId,
      sourceKind: 'release',
      storeItemSlug,
      title: frontmatter.title ?? sourceId,
      variantId: releaseVariantIdByReleaseId[sourceId] ?? createVariantId(storeItemSlug),
    });
  }

  return storeItems;
}

export async function readDistroStoreItems(directory: string): Promise<LocalMockStoreItem[]> {
  const files = (await readdir(directory)).filter((fileName) => fileName.endsWith('.json')).sort();
  const storeItems: LocalMockStoreItem[] = [];

  for (const fileName of files) {
    const sourceId = path.basename(fileName, '.json');
    const content = JSON.parse(await readFile(path.join(directory, fileName), 'utf8')) as { title?: unknown };

    storeItems.push({
      sourceId,
      sourceKind: 'distro',
      storeItemSlug: sourceId,
      title: typeof content.title === 'string' ? content.title : sourceId,
      variantId: createVariantId(sourceId),
    });
  }

  return storeItems;
}

export function createLocalMockCommerceSql(storeItems: LocalMockStoreItem[]): string {
  if (storeItems.length === 0) {
    throw new Error('No store items found for local mock commerce seed.');
  }

  return [
    '-- Local-only mock commerce state for dev:stack:stripe-mock.',
    '-- This SQL is generated at runtime from static storefront content and is not real inventory evidence.',
    createStoreItemOptionSql(storeItems),
    createItemAvailabilitySql(storeItems),
    createStockSql(storeItems),
    createVariantStripeMappingSql(storeItems),
    '',
  ].join('\n\n');
}

export function createVariantId(storeItemSlug: string): string {
  return `variant_${storeItemSlug}_standard`;
}

export function createMockStripePriceId(storeItemSlug: string): string {
  return `price_mock_${toSqlIdFragment(storeItemSlug)}`;
}

export function parseFrontmatter(content: string): Record<string, string> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);

  if (!match?.[1]) {
    return {};
  }

  const result: Record<string, string> = {};

  for (const line of match[1].split(/\r?\n/)) {
    const keyValueMatch = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);

    if (!keyValueMatch?.[1]) {
      continue;
    }

    const [, key, rawValue = ''] = keyValueMatch;
    result[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }

  return result;
}

function createStoreItemOptionSql(storeItems: LocalMockStoreItem[]): string {
  return [
    'INSERT INTO "StoreItemOption" (',
    '    "id",',
    '    "storeItemSlug",',
    '    "sourceKind",',
    '    "sourceId",',
    '    "variantId",',
    '    "createdAt",',
    '    "updatedAt"',
    ')',
    'VALUES',
    storeItems
      .map((storeItem) =>
        formatValues([
          `store_item_option_${toSqlIdFragment(storeItem.storeItemSlug)}`,
          storeItem.storeItemSlug,
          storeItem.sourceKind,
          storeItem.sourceId,
          storeItem.variantId,
          'CURRENT_TIMESTAMP',
          'CURRENT_TIMESTAMP',
        ]),
      )
      .join(',\n'),
    'ON CONFLICT("storeItemSlug") DO UPDATE SET',
    '    "sourceKind" = excluded."sourceKind",',
    '    "sourceId" = excluded."sourceId",',
    '    "variantId" = excluded."variantId",',
    '    "updatedAt" = CURRENT_TIMESTAMP;',
  ].join('\n');
}

function createItemAvailabilitySql(storeItems: LocalMockStoreItem[]): string {
  return [
    'INSERT INTO "ItemAvailability" (',
    '    "id",',
    '    "variantId",',
    '    "status",',
    '    "canBuy",',
    '    "updatedAt"',
    ')',
    'VALUES',
    storeItems
      .map((storeItem) =>
        formatValues([
          `item_availability_${toSqlIdFragment(storeItem.storeItemSlug)}`,
          storeItem.variantId,
          'available',
          true,
          'CURRENT_TIMESTAMP',
        ]),
      )
      .join(',\n'),
    'ON CONFLICT("variantId") DO UPDATE SET',
    '    "status" = excluded."status",',
    '    "canBuy" = excluded."canBuy",',
    '    "updatedAt" = CURRENT_TIMESTAMP;',
  ].join('\n');
}

function createStockSql(storeItems: LocalMockStoreItem[]): string {
  return [
    'INSERT INTO "Stock" (',
    '    "id",',
    '    "variantId",',
    '    "quantity",',
    '    "onlineQuantity",',
    '    "createdAt",',
    '    "updatedAt"',
    ')',
    'VALUES',
    storeItems
      .map((storeItem) =>
        formatValues([
          `stock_${toSqlIdFragment(storeItem.storeItemSlug)}`,
          storeItem.variantId,
          mockQuantity,
          mockQuantity,
          'CURRENT_TIMESTAMP',
          'CURRENT_TIMESTAMP',
        ]),
      )
      .join(',\n'),
    'ON CONFLICT("variantId") DO UPDATE SET',
    '    "quantity" = excluded."quantity",',
    '    "onlineQuantity" = excluded."onlineQuantity",',
    '    "updatedAt" = CURRENT_TIMESTAMP;',
  ].join('\n');
}

function createVariantStripeMappingSql(storeItems: LocalMockStoreItem[]): string {
  return [
    'INSERT INTO "VariantStripeMapping" (',
    '    "id",',
    '    "variantId",',
    '    "stripePriceId",',
    '    "createdAt",',
    '    "updatedAt"',
    ')',
    'VALUES',
    storeItems
      .map((storeItem) =>
        formatValues([
          `variant_stripe_mapping_${toSqlIdFragment(storeItem.storeItemSlug)}_mock`,
          storeItem.variantId,
          createMockStripePriceId(storeItem.storeItemSlug),
          'CURRENT_TIMESTAMP',
          'CURRENT_TIMESTAMP',
        ]),
      )
      .join(',\n'),
    'ON CONFLICT("variantId") DO UPDATE SET',
    '    "stripePriceId" = excluded."stripePriceId",',
    '    "updatedAt" = CURRENT_TIMESTAMP;',
  ].join('\n');
}

function formatValues(values: Array<boolean | number | string>): string {
  return `    (${values.map(formatSqlValue).join(', ')})`;
}

function formatSqlValue(value: boolean | number | string): string {
  if (value === 'CURRENT_TIMESTAMP') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}

function toSqlIdFragment(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'item';
}

function applySql(sql: string): number {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'blackbox-local-mock-commerce-'));
  const tempSqlPath = path.join(tempDir, 'local-mock-commerce-state.sql');

  try {
    writeFileSync(tempSqlPath, sql);

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
      shell: false,
      stdio: 'inherit',
    });

    if (result.error) {
      console.error(result.error.message);
    }

    return result.status ?? 1;
  } finally {
    rmSync(tempDir, { force: true, recursive: true });
  }
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

async function main(): Promise<void> {
  const storeItems = await readLocalMockStoreItems();
  console.log(`Seeding local mock commerce state for ${storeItems.length} store item(s).`);
  process.exit(applySql(createLocalMockCommerceSql(storeItems)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
