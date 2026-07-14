import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { createSlugSuggestion, resolveExplicitOrSuggestedSlug } from '../../web/src/lib/slugs';
import { loadStripeCatalogStoreItemContracts } from '../../../scripts/stripe-catalog-contract';

export type LocalMockStoreItem = {
  mockCheckoutEnabled: boolean;
  taxCategory: 'physical_goods';
  sourceId: string;
  sourceKind: 'release' | 'distro';
  storeItemSlug: string;
  title: string;
  variantId: string;
};

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const nonPhysicalReleaseFormats = new Set(['digital']);
const mockCheckoutStoreItemSlugs = new Set(['anarchotribal-vinyl', 'disintegration-black-vinyl-lp']);
const mockStoreOfferPricesBySlug = new Map([
  ['anarchotribal-vinyl', { amountMinor: 2800, currencyCode: 'EUR' }],
  ['disintegration-black-vinyl-lp', { amountMinor: 2800, currencyCode: 'EUR' }],
]);

const mockQuantity = 99;

export async function readLocalMockStoreItems(): Promise<LocalMockStoreItem[]> {
  return (await loadStripeCatalogStoreItemContracts({ productEnvironment: 'UAT' })).map((contract) => ({
    mockCheckoutEnabled: mockCheckoutStoreItemSlugs.has(contract.storeItemSlug),
    sourceId: contract.sourceId,
    sourceKind: contract.sourceKind,
    storeItemSlug: contract.storeItemSlug,
    taxCategory: 'physical_goods',
    title: contract.productProjection.name,
    variantId: contract.variantId,
  }));
}

export async function readReleaseStoreItems(directory: string): Promise<LocalMockStoreItem[]> {
  const files = (await readdir(directory)).filter((fileName) => fileName.endsWith('.md')).sort();
  const storeItems: LocalMockStoreItem[] = [];

  for (const fileName of files) {
    const sourceId = path.basename(fileName, '.md');
    const frontmatter = parseFrontmatter(await readFile(path.join(directory, fileName), 'utf8'));
    const title = readFrontmatterString(frontmatter.title) ?? sourceId;
    const storeItemSlug = createReleaseStoreItemSlug(title, readFrontmatterStringArray(frontmatter.formats));

    storeItems.push({
      mockCheckoutEnabled: mockCheckoutStoreItemSlugs.has(storeItemSlug),
      taxCategory: 'physical_goods',
      sourceId,
      sourceKind: 'release',
      storeItemSlug,
      title,
      variantId: createVariantId(storeItemSlug),
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
    const title = typeof content.title === 'string' ? content.title : sourceId;
    const storeItemSlug = resolveExplicitOrSuggestedSlug(sourceId, title) || sourceId;

    storeItems.push({
      mockCheckoutEnabled: mockCheckoutStoreItemSlugs.has(storeItemSlug),
      taxCategory: 'physical_goods',
      sourceId,
      sourceKind: 'distro',
      storeItemSlug,
      title,
      variantId: createVariantId(storeItemSlug),
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
    createStoreOfferSnapshotSql(storeItems),
    '',
  ].join('\n\n');
}

export function createVariantId(storeItemSlug: string): string {
  return `variant_${storeItemSlug}_standard`;
}

export function createMockStripePriceId(storeItemSlug: string): string {
  return `price_mock_${toSqlIdFragment(storeItemSlug)}`;
}

export function parseFrontmatter(content: string): Record<string, string | string[]> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);

  if (!match?.[1]) {
    return {};
  }

  const result: Record<string, string | string[]> = {};
  const lines = match[1].split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const keyValueMatch = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);

    if (!keyValueMatch?.[1]) {
      continue;
    }

    const [, key, rawValue = ''] = keyValueMatch;

    if (rawValue === '') {
      const arrayValues: string[] = [];
      let cursor = index + 1;

      while (cursor < lines.length) {
        const arrayMatch = /^\s*-\s+(?<value>.+)$/.exec(lines[cursor]);
        if (!arrayMatch?.groups) {
          break;
        }

        arrayValues.push(arrayMatch.groups.value.replace(/^['"]|['"]$/g, ''));
        cursor += 1;
      }

      result[key] = arrayValues;
      index = cursor - 1;
      continue;
    }

    result[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }

  return result;
}

function readFrontmatterString(value: string | string[] | undefined): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function readFrontmatterStringArray(value: string | string[] | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

function getPrimaryReleaseStoreFormat(formats: readonly string[] | undefined): string | null {
  return (
    formats?.find((format) => {
      const normalized = format.trim().toLowerCase();
      return normalized && !nonPhysicalReleaseFormats.has(normalized);
    }) ?? null
  );
}

function createReleaseStoreItemSlug(title: string, formats: readonly string[]): string {
  const primaryFormat = getPrimaryReleaseStoreFormat(formats);
  return createSlugSuggestion([title, primaryFormat].filter(Boolean).join(' '));
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
    'ON CONFLICT DO UPDATE SET',
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
          storeItem.mockCheckoutEnabled ? 'available' : 'sold_out',
          storeItem.mockCheckoutEnabled,
          'CURRENT_TIMESTAMP',
        ]),
      )
      .join(',\n'),
    'ON CONFLICT DO UPDATE SET',
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
          storeItem.mockCheckoutEnabled ? mockQuantity : 0,
          storeItem.mockCheckoutEnabled ? mockQuantity : 0,
          'CURRENT_TIMESTAMP',
          'CURRENT_TIMESTAMP',
        ]),
      )
      .join(',\n'),
    'ON CONFLICT DO UPDATE SET',
    '    "quantity" = excluded."quantity",',
    '    "onlineQuantity" = excluded."onlineQuantity",',
    '    "updatedAt" = CURRENT_TIMESTAMP;',
  ].join('\n');
}

function createVariantStripeMappingSql(storeItems: LocalMockStoreItem[]): string {
  const checkoutEnabledStoreItems = storeItems.filter((storeItem) => storeItem.mockCheckoutEnabled);
  if (checkoutEnabledStoreItems.length === 0) {
    return '';
  }

  return [
    'INSERT INTO "VariantStripeMapping" (',
    '    "id",',
    '    "variantId",',
    '    "stripePriceId",',
    '    "createdAt",',
    '    "updatedAt"',
    ')',
    'VALUES',
    checkoutEnabledStoreItems
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
    'ON CONFLICT DO UPDATE SET',
    '    "stripePriceId" = excluded."stripePriceId",',
    '    "updatedAt" = CURRENT_TIMESTAMP;',
  ].join('\n');
}

function createStoreOfferSnapshotSql(storeItems: LocalMockStoreItem[]): string {
  const checkoutEnabledStoreItems = storeItems.filter((storeItem) => storeItem.mockCheckoutEnabled);
  if (checkoutEnabledStoreItems.length === 0) {
    return '';
  }

  return [
    'INSERT INTO "StoreOfferSnapshot" (',
    '    "id",',
    '    "storeItemSlug",',
    '    "variantId",',
    '    "stripePriceId",',
    '    "stripeLookupKey",',
    '    "amountMinor",',
    '    "currencyCode",',
    '    "priceActive",',
    '    "productActive",',
    '    "syncedAt",',
    '    "freshUntil",',
    '    "createdAt",',
    '    "updatedAt"',
    ')',
    'VALUES',
    checkoutEnabledStoreItems
      .map((storeItem) => {
        const price = mockStoreOfferPricesBySlug.get(storeItem.storeItemSlug) ?? {
          amountMinor: 0,
          currencyCode: 'EUR',
        };

        return formatValues([
          `store_offer_snapshot_${toSqlIdFragment(storeItem.storeItemSlug)}_mock`,
          storeItem.storeItemSlug,
          storeItem.variantId,
          createMockStripePriceId(storeItem.storeItemSlug),
          `blackbox:local:${storeItem.storeItemSlug}:${storeItem.variantId}`,
          price.amountMinor,
          price.currencyCode,
          true,
          true,
          'CURRENT_TIMESTAMP',
          "datetime('now', '+1 day')",
          'CURRENT_TIMESTAMP',
          'CURRENT_TIMESTAMP',
        ]);
      })
      .join(',\n'),
    'ON CONFLICT DO UPDATE SET',
    '    "storeItemSlug" = excluded."storeItemSlug",',
    '    "stripePriceId" = excluded."stripePriceId",',
    '    "stripeLookupKey" = excluded."stripeLookupKey",',
    '    "amountMinor" = excluded."amountMinor",',
    '    "currencyCode" = excluded."currencyCode",',
    '    "priceActive" = excluded."priceActive",',
    '    "productActive" = excluded."productActive",',
    '    "syncedAt" = CURRENT_TIMESTAMP,',
    "    \"freshUntil\" = datetime('now', '+1 day'),",
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

  if (value === "datetime('now', '+1 day')") {
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
