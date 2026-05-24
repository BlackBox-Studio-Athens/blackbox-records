import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { format } from 'prettier';

import { loadStripeCatalogStoreItemContracts, type StripeCatalogStoreItemContract } from './stripe-catalog-contract';

type GenerateMode = 'check' | 'write';

const projectionPath = path.join(
  process.cwd(),
  'apps',
  'backend',
  'src',
  'application',
  'commerce',
  'catalog-sync',
  'catalog-product-projections.ts',
);
const sandboxUatSeedPath = path.join(
  process.cwd(),
  'apps',
  'backend',
  'prisma',
  'seeds',
  'sandbox-uat-commerce-state.sql',
);

export function createSandboxUatCatalogStock(contract: Pick<StripeCatalogStoreItemContract, 'storeItemSlug'>): {
  onlineQuantity: number;
  quantity: number;
} {
  return contract.storeItemSlug === 'afterglow-tape'
    ? {
        onlineQuantity: 1,
        quantity: 1,
      }
    : {
        onlineQuantity: 99,
        quantity: 99,
      };
}

export function createCatalogProductProjectionSource(contracts: StripeCatalogStoreItemContract[]): string {
  const entries = contracts.map((contract) => ({
    alignmentStatus: contract.alignmentStatus,
    expectedSandboxPrice: contract.expectedSandboxPrice,
    productProjection: contract.productProjection,
    sourceId: contract.sourceId,
    sourceKind: contract.sourceKind,
    storeItemSlug: contract.storeItemSlug,
    variantId: contract.variantId,
  }));

  return `${[
    "import type { StoreItemOptionRecord } from '../../../domain/commerce/repositories/spi';",
    "import type { StripeCatalogEnvironment, StripeCatalogExpectedPrice, StripeCatalogProductProjection } from './types';",
    '',
    "export type CatalogProductProjectionAlignmentStatus = 'checkout_eligible' | 'future_buyable' | 'unavailable';",
    '',
    'export type CatalogProductProjectionEntry = {',
    '  alignmentStatus: CatalogProductProjectionAlignmentStatus;',
    '  expectedSandboxPrice: StripeCatalogExpectedPrice | null;',
    '  productProjection: StripeCatalogProductProjection;',
    '  sourceId: string;',
    "  sourceKind: StoreItemOptionRecord['sourceKind'];",
    '  storeItemSlug: string;',
    '  variantId: string;',
    '};',
    '',
    'export type CatalogProductProjectionReader = {',
    '  findByStoreItem(storeItem: StoreItemOptionRecord): StripeCatalogProductProjection | null;',
    '};',
    '',
    'export const currentCatalogProductProjectionEntries: CatalogProductProjectionEntry[] = ',
    `${JSON.stringify(entries, null, 2)};`,
    '',
    'export function createCurrentCatalogProductProjectionReader(): CatalogProductProjectionReader {',
    '  return {',
    '    findByStoreItem: findCurrentCatalogProductProjection,',
    '  };',
    '}',
    '',
    'export function findCurrentCatalogProductProjection(',
    '  storeItem: StoreItemOptionRecord,',
    '): StripeCatalogProductProjection | null {',
    '  return findCurrentCatalogProductProjectionEntry(storeItem)?.productProjection ?? null;',
    '}',
    '',
    'export function findCurrentCatalogProductProjectionEntry(',
    '  storeItem: StoreItemOptionRecord,',
    '): CatalogProductProjectionEntry | null {',
    '  return (',
    '    currentCatalogProductProjectionEntries.find(',
    '      (entry) =>',
    '        entry.storeItemSlug === storeItem.storeItemSlug &&',
    '        entry.variantId === storeItem.variantId &&',
    '        entry.sourceKind === storeItem.sourceKind &&',
    '        entry.sourceId === storeItem.sourceId,',
    '    ) ?? null',
    '  );',
    '}',
    '',
    'export function createCurrentCatalogExpectedProductProjectionMap(): Map<string, StripeCatalogProductProjection> {',
    '  return new Map(currentCatalogProductProjectionEntries.map((entry) => [entry.variantId, entry.productProjection]));',
    '}',
    '',
    'export function createCurrentCatalogExpectedSandboxPriceMap(',
    '  environment: StripeCatalogEnvironment,',
    '): Map<string, StripeCatalogExpectedPrice> {',
    "  if (environment !== 'sandbox') {",
    '    return new Map();',
    '  }',
    '',
    '  return new Map(',
    '    currentCatalogProductProjectionEntries.flatMap((entry) =>',
    '      entry.expectedSandboxPrice ? [[entry.variantId, entry.expectedSandboxPrice] as const] : [],',
    '    ),',
    '  );',
    '}',
    '',
  ].join('\n')}`;
}

export function createSandboxUatCommerceSql(contracts: StripeCatalogStoreItemContract[]): string {
  if (contracts.length === 0) {
    throw new Error('No Store Item contracts found for sandbox UAT commerce seed.');
  }

  return [
    '-- Sandbox-only UAT commerce readiness seed generated from Astro store content.',
    '-- This file contains no Stripe IDs or secrets; Price mappings and Store Offer snapshots are owned by catalog apply.',
    createStaleIdentityCleanupSql(),
    createStoreItemOptionSql(contracts),
    createItemAvailabilitySql(contracts),
    createStockSql(contracts),
    '',
  ].join('\n\n');
}

async function run(mode: GenerateMode): Promise<void> {
  const contracts = await loadStripeCatalogStoreItemContracts();
  const generated = [
    {
      content: await format(createCatalogProductProjectionSource(contracts), {
        parser: 'typescript',
        printWidth: 120,
        singleQuote: true,
      }),
      label: 'catalog Product Projection manifest',
      path: projectionPath,
    },
    {
      content: createSandboxUatCommerceSql(contracts),
      label: 'sandbox UAT commerce seed',
      path: sandboxUatSeedPath,
    },
  ];

  if (mode === 'write') {
    await Promise.all(generated.map((artifact) => writeFile(artifact.path, artifact.content, 'utf8')));
    console.log(`Generated ${generated.map((artifact) => artifact.label).join(' and ')}.`);
    return;
  }

  const drifted: string[] = [];
  for (const artifact of generated) {
    const current = await readFile(artifact.path, 'utf8').catch(() => '');
    if (current.replace(/\r\n/g, '\n') !== artifact.content.replace(/\r\n/g, '\n')) {
      drifted.push(artifact.path);
    }
  }

  if (drifted.length > 0) {
    throw new Error(`Generated Stripe UAT catalog artifact drift detected:\n${drifted.join('\n')}`);
  }

  console.log('Generated Stripe UAT catalog artifacts are up to date.');
}

function createStaleIdentityCleanupSql(): string {
  return [
    '-- Cleanup for renamed sandbox-only identities from the pre-decoupling Barren Point / Disintegration catalog.',
    'UPDATE "StoreItemOption"',
    'SET "id" = \'store_item_option_disintegration_black_vinyl_lp\',',
    '    "sourceKind" = \'release\',',
    '    "sourceId" = \'disintegration\',',
    '    "variantId" = \'variant_disintegration-black-vinyl-lp_standard\',',
    '    "updatedAt" = CURRENT_TIMESTAMP',
    'WHERE "storeItemSlug" = \'disintegration-black-vinyl-lp\'',
    '  AND "variantId" = \'variant_barren-point_standard\';',
    '',
    'DELETE FROM "StoreOfferSnapshot"',
    'WHERE "storeItemSlug" = \'mass-culture-lp\'',
    "   OR \"variantId\" IN ('variant_mass-culture-lp_standard', 'variant_barren-point_standard', 'variant_disintegration-black-vinyl-lp_standard');",
    '',
    'DELETE FROM "VariantStripeMapping"',
    "WHERE \"variantId\" IN ('variant_mass-culture-lp_standard', 'variant_barren-point_standard', 'variant_disintegration-black-vinyl-lp_standard');",
    '',
    'DELETE FROM "Stock"',
    "WHERE \"variantId\" IN ('variant_mass-culture-lp_standard', 'variant_barren-point_standard', 'variant_disintegration-black-vinyl-lp_standard');",
    '',
    'DELETE FROM "ItemAvailability"',
    "WHERE \"variantId\" IN ('variant_mass-culture-lp_standard', 'variant_barren-point_standard', 'variant_disintegration-black-vinyl-lp_standard');",
    '',
    'DELETE FROM "StoreItemOption"',
    'WHERE "storeItemSlug" = \'mass-culture-lp\'',
    '   OR "variantId" = \'variant_mass-culture-lp_standard\';',
  ].join('\n');
}

function createStoreItemOptionSql(contracts: StripeCatalogStoreItemContract[]): string {
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
    contracts
      .map((contract) =>
        formatValues([
          `store_item_option_${toSqlIdFragment(contract.storeItemSlug)}`,
          contract.storeItemSlug,
          contract.sourceKind,
          contract.sourceId,
          contract.variantId,
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

function createItemAvailabilitySql(contracts: StripeCatalogStoreItemContract[]): string {
  return [
    'INSERT INTO "ItemAvailability" (',
    '    "id",',
    '    "variantId",',
    '    "status",',
    '    "canBuy",',
    '    "updatedAt"',
    ')',
    'VALUES',
    contracts
      .map((contract) =>
        formatValues([
          `item_availability_${toSqlIdFragment(contract.storeItemSlug)}`,
          contract.variantId,
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

function createStockSql(contracts: StripeCatalogStoreItemContract[]): string {
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
    contracts
      .map((contract) => {
        const stock = createSandboxUatCatalogStock(contract);
        return formatValues([
          `stock_${toSqlIdFragment(contract.storeItemSlug)}`,
          contract.variantId,
          stock.quantity,
          stock.onlineQuantity,
          'CURRENT_TIMESTAMP',
          'CURRENT_TIMESTAMP',
        ]);
      })
      .join(',\n'),
    'ON CONFLICT("variantId") DO UPDATE SET',
    '    "quantity" = excluded."quantity",',
    '    "onlineQuantity" = excluded."onlineQuantity",',
    '    "updatedAt" = CURRENT_TIMESTAMP;',
  ].join('\n');
}

function formatValues(values: Array<boolean | number | string>): string {
  return `    (${values.map(formatSqlValue).join(', ')})`;
}

function formatSqlValue(value: boolean | number | string): string {
  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  if (value === 'CURRENT_TIMESTAMP') {
    return value;
  }

  return `'${value.replace(/'/g, "''")}'`;
}

function toSqlIdFragment(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || 'item';
}

function parseMode(args: string[]): GenerateMode {
  if (args.includes('--write')) {
    return 'write';
  }

  if (args.includes('--check')) {
    return 'check';
  }

  throw new Error('Usage: pnpm stripe:catalog:artifacts:check or pnpm stripe:catalog:artifacts:generate');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  run(parseMode(process.argv.slice(2))).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
