import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {
  createStripeCatalogLookupKey,
  createStripeCatalogMetadata,
  readRuntimeCatalogPresentation,
  STORE_OFFER_FRESHNESS_MS,
  CatalogPriceConflictError,
  type StripeCatalogPrice,
  type StripeCatalogProductProjection,
} from '../src/application/commerce/catalog-sync';
import { parseStoreItemSlug, parseStripePriceId, parseVariantId } from '../src/domain/commerce';
import { createStripeAccountCatalogGateway, type StripeAccountCatalogInput } from '../src/infrastructure/stripe';
import { productEnvironmentProfileFromWorkerRuntimeTarget } from '../src/platform/env';

type Environment = 'uat' | 'prd';
type Row = Record<string, string | number | null>;
type Gateway = ReturnType<typeof createStripeAccountCatalogGateway>;
type ProductFacts = NonNullable<Awaited<ReturnType<Gateway['inspectSetupProduct']>>>;
type Preserved = Record<string, { count: number; hash: string }>;
type Database = {
  query(sql: string): Promise<Row[]>;
  batch(statements: string[]): Promise<void>;
};
type Dependencies = {
  database: Database;
  cmsDatabase: Pick<Database, 'query'>;
  source: Gateway;
  target: Gateway;
  checkImage(url: string): Promise<void>;
  saveJournal(journal: AccountMigrationJournal): Promise<void>;
};
type ManifestRow = {
  item: Row;
  mapping: Row | null;
  offer: Row | null;
  stock: Row | null;
  availability: Row | null;
  projection: StripeCatalogProductProjection | null;
  sourceProduct: ProductFacts | null;
  sourcePrice: StripeCatalogPrice | null;
  targetProductId: string | null;
  operationId: string;
  lookupKey: string;
};
type CmsSource = {
  sourceKind: 'release' | 'distro';
  id: string;
  slug: string | null;
  status: string;
  version: number;
  liveRevisionId: string | null;
  draftRevisionId: string | null;
  updatedAt: string;
  rowHash: string;
  catalogVariantId: string | null;
};
type CmsBookkeeping = {
  schedulerHeartbeat: Row | null;
  mediaUsageCleanup: Row | null;
};
export type AccountMigrationManifest = {
  version: 2;
  environment: Environment;
  sourceAccount: string;
  targetAccount: string;
  live: boolean;
  databaseIdentity: string;
  createdAt: string;
  preserved: Preserved;
  bookkeeping: CmsBookkeeping;
  cmsSources: CmsSource[];
  rows: ManifestRow[];
  hash: string;
};
export type AccountMigrationJournal = {
  version: 2;
  manifestHash: string;
  rows: Record<string, { productId: string; priceId: string; preparedAt: string }>;
  steps: Array<{ mode: 'prepare' | 'apply' | 'restore'; variantId: string; at: string }>;
  bookkeeping: Array<{
    mode: 'apply' | 'restore';
    phase: 'before' | 'prepared' | 'after';
    at: string;
    observed: CmsBookkeeping;
  }>;
};
type Options = {
  mode: 'plan' | 'apply' | 'restore';
  environment: Environment;
  sourceAccount: string;
  targetAccount: string;
  manifestPath: string;
  journalPath: string;
  reviewedHash?: string;
  prepareOnly: boolean;
  confirmLiveChanges: boolean;
};

const accountSuffixes = { uat: ['AFb7Ub', 'PfsVCp'], prd: ['dyR3DM', 'GRpxub'] } as const;
const rowSchema = z.record(z.string(), z.union([z.string(), z.number().finite(), z.null()]));
const mutableTables = ['VariantStripeMapping', 'StoreOfferSnapshot'];
const mappingFields = ['stripeProductId', 'stripePriceId', 'updatedAt'];
const offerFields = [
  'stripePriceId',
  'stripeLookupKey',
  'amountMinor',
  'currencyCode',
  'priceActive',
  'productActive',
  'syncedAt',
  'freshUntil',
  'updatedAt',
];

class AccountMigrationError extends Error {}
export function formatAccountMigrationError(error: unknown): string {
  const reason =
    error instanceof AccountMigrationError || error instanceof CatalogPriceConflictError
      ? error.message
      : error instanceof z.ZodError
        ? 'Invalid operator input or incomplete runtime catalog data; review the account map and source fields.'
        : 'Provider, database or private-file request failed; check credentials, permissions and the retained journal.';
  return `Catalog migration stopped: ${reason} Keep checkout closed.`;
}

export function parseAccountMigrationQueryRows(results: unknown): Row[] {
  if (!Array.isArray(results))
    throw new AccountMigrationError('D1 migration SELECT returned invalid rows; checkout must remain closed.');
  return results;
}

function hash(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex');
}
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}
function same(a: unknown, b: unknown): boolean {
  return stableJson(a) === stableJson(b);
}
function sql(value: string | number | null): string {
  if (value === null) return 'NULL';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new AccountMigrationError('Invalid SQL number.');
    return String(value);
  }
  return `'${value.replaceAll("'", "''")}'`;
}
function identifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}
function one(rows: Row[], field: string, value: string): Row | null {
  const matches = rows.filter((row) => row[field] === value);
  if (matches.length > 1) throw new AccountMigrationError('Duplicate runtime catalog identity.');
  return matches[0] ?? null;
}
function cleanPrice(price: StripeCatalogPrice): StripeCatalogPrice {
  const result = { ...price };
  delete result.requestId;
  delete result.idempotentReplayed;
  return result;
}
function itemIdentity(item: Row) {
  const sourceKind = z.enum(['release', 'distro']).parse(item.sourceKind);
  return {
    storeItemSlug: parseStoreItemSlug(z.string().parse(item.storeItemSlug)),
    variantId: parseVariantId(z.string().parse(item.variantId)),
    sourceKind,
    sourceId: z.string().trim().min(1).parse(item.sourceId),
  };
}
function runtimeProjection(item: Row, environment: Environment) {
  return readRuntimeCatalogPresentation(
    {
      ...item,
      productProjection:
        typeof item.productProjection === 'string' ? JSON.parse(item.productProjection) : item.productProjection,
    },
    environment,
  );
}
function assertAccounts(environment: Environment, source: string, target: string): void {
  const [sourceSuffix, targetSuffix] = accountSuffixes[environment];
  if (
    !/^acct_[A-Za-z0-9]+$/.test(source) ||
    !/^acct_[A-Za-z0-9]+$/.test(target) ||
    !source.endsWith(sourceSuffix) ||
    !target.endsWith(targetSuffix) ||
    source === target
  )
    throw new AccountMigrationError('Account assertions do not match this change’s environment map.');
}

export async function verifyAccountMigrationImage(
  value: string,
  environment: Environment,
  request: typeof fetch = fetch,
): Promise<void> {
  const url = new URL(value);
  const profile = productEnvironmentProfileFromWorkerRuntimeTarget(environment);
  const media = /^\/media\/(published|content)\/[a-f0-9]{64}$/.exec(url.pathname);
  const origin = media?.[1] === 'published' ? profile.publicBackendOrigin : profile.publicSite.origin;
  if (url.protocol !== 'https:' || url.origin !== origin || !media || url.search || url.hash)
    throw new AccountMigrationError('Product image is not this environment’s runtime media URL.');
  const response = await request(url, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(15_000) });
  await response.body?.cancel();
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/'))
    throw new AccountMigrationError('Destination Product image does not resolve.');
}

async function readDatabase(database: Pick<Database, 'query'>) {
  const pageSize = 1000;
  const schema = await database.query(
    "SELECT name, type, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name",
  );
  const tables: Record<string, Row[]> = {};
  for (const entry of schema.filter((row) => row.type === 'table')) {
    const name = z.string().parse(entry.name);
    const rows: Row[] = [];
    for (let offset = 0; ; offset += pageSize) {
      if (offset >= 100_000)
        throw new AccountMigrationError('Protected-data export exceeds 100,000 rows; review the operation budget.');
      const page = await database.query(`SELECT * FROM ${identifier(name)} LIMIT ${pageSize} OFFSET ${offset}`);
      rows.push(...page);
      if (page.length < pageSize) break;
    }
    tables[name] = rows;
  }
  return { schema, tables };
}
async function readState(database: Database, cmsDatabase: Pick<Database, 'query'>) {
  const { schema, tables } = await readDatabase(database);
  const cms = await readDatabase(cmsDatabase);
  for (const required of [
    'StoreItemOption',
    ...mutableTables,
    'Stock',
    'ItemAvailability',
    'AvailabilityAlert',
    'AvailabilityAlertSendDay',
    'CheckoutOrder',
    'CatalogOperation',
  ]) {
    if (!tables[required]) throw new AccountMigrationError('Required current D1 schema is missing.');
  }
  const preserved: Preserved = { schema: { count: schema.length, hash: hash(schema) } };
  for (const [name, rows] of Object.entries(tables)) {
    if (!mutableTables.includes(name))
      preserved[name] = {
        count: rows.length,
        hash: hash(rows.map(stableJson).sort()),
      };
  }
  preserved['CMS:schema'] = { count: cms.schema.length, hash: hash(cms.schema) };
  for (const [name, rows] of Object.entries(cms.tables))
    preserved[`CMS:${name}`] = {
      count: rows.length,
      hash: hash(
        rows
          .map((row) => {
            const protectedRow = { ...row };
            if (name === 'options' && row.name === 'system:scheduler:last_completed_at') {
              for (const field of ['value', 'revision']) if (Object.hasOwn(row, field)) protectedRow[field] = null;
            } else if (name === '_emdash_media_usage_cleanup' && row.task_key === 'projection_gc') {
              for (const field of [
                'next_eligible_at',
                'last_started_at',
                'last_completed_at',
                'last_duration_ms',
                'updated_at',
              ])
                if (Object.hasOwn(row, field)) protectedRow[field] = null;
            }
            return stableJson(protectedRow);
          })
          .sort(),
      ),
    };
  const bookkeeping: CmsBookkeeping = {
    schedulerHeartbeat: cms.tables.options?.find((row) => row.name === 'system:scheduler:last_completed_at') ?? null,
    mediaUsageCleanup: cms.tables._emdash_media_usage_cleanup?.find((row) => row.task_key === 'projection_gc') ?? null,
  };
  const cmsSources: CmsSource[] = [];
  // Native EmDash content tables retain live/draft revision pointers, including sources never set up in Items.
  for (const sourceKind of ['release', 'distro'] as const) {
    const sources = cms.tables[sourceKind === 'release' ? 'ec_releases' : 'ec_distro'];
    if (!sources) throw new AccountMigrationError('Required native CMS item-source tables are missing.');
    for (const source of sources) {
      const id = z.string().min(1).parse(source.id);
      const slug = z.string().nullable().parse(source.slug);
      const matches = tables.StoreItemOption!.filter(
        (item) =>
          item.sourceKind === sourceKind &&
          (item.cmsSourceId === id || (item.cmsSourceId === null && slug !== null && item.sourceId === slug)),
      );
      if (matches.length > 1) throw new AccountMigrationError('CMS source has ambiguous catalog links.');
      cmsSources.push({
        sourceKind,
        id,
        slug,
        status: z.string().min(1).parse(source.status),
        version: z.number().int().nonnegative().parse(source.version),
        liveRevisionId: z.string().nullable().parse(source.live_revision_id),
        draftRevisionId: z.string().nullable().parse(source.draft_revision_id),
        updatedAt: z.string().parse(source.updated_at),
        rowHash: hash(source),
        catalogVariantId: matches[0] ? z.string().parse(matches[0].variantId) : null,
      });
    }
  }
  cmsSources.sort((a, b) => `${a.sourceKind}:${a.id}`.localeCompare(`${b.sourceKind}:${b.id}`));
  return { tables, preserved, bookkeeping, cmsSources };
}

async function sourceFacts(row: ManifestRow, environment: Environment, source: Gateway) {
  if (!row.mapping) return { product: null, price: null };
  const mappedPrice = await source.retrievePrice(parseStripePriceId(z.string().parse(row.mapping.stripePriceId)));
  const productId = row.mapping.stripeProductId ?? mappedPrice?.productId;
  if (typeof productId !== 'string' || !mappedPrice || mappedPrice.productId !== productId)
    throw new AccountMigrationError('Source mapping does not identify a Product and Price.');
  const product = await source.inspectSetupProduct(productId, environment);
  const price = await source.retrieveDefaultPrice(productId);
  const metadata = createStripeCatalogMetadata(environment, itemIdentity(row.item));
  if (
    !product ||
    product.deleted ||
    product.live !== (environment === 'prd') ||
    !price ||
    product.defaultPriceId !== price.priceId ||
    price.productId !== productId ||
    price.currencyCode !== 'EUR' ||
    price.taxBehavior !== 'inclusive' ||
    product.taxCode !== 'txcd_99999999' ||
    price.productTaxCode !== product.taxCode ||
    price.priceKind !== row.item.priceKind ||
    price.productActive !== product.active ||
    Object.entries(metadata).some(([key, value]) => product.metadata[key] !== value || price.metadata[key] !== value) ||
    (price.lookupKey !== null && price.lookupKey !== row.lookupKey)
  )
    throw new AccountMigrationError(
      'Source Product/default Price conflicts with the runtime identity or tax contract.',
    );
  const amount = z.number().int().min(0).max(99_999_999);
  if (price.priceKind === 'fixed') {
    amount.parse(price.amountMinor);
    if (price.customUnitAmount) throw new AccountMigrationError('Conflicting source fixed Price.');
  } else {
    if (price.amountMinor !== null || !price.customUnitAmount)
      throw new AccountMigrationError('Conflicting source custom Price.');
    const bounds = price.customUnitAmount;
    for (const value of Object.values(bounds)) amount.nullable().parse(value);
    if (
      (bounds.minimumAmountMinor !== null &&
        bounds.maximumAmountMinor !== null &&
        bounds.minimumAmountMinor > bounds.maximumAmountMinor) ||
      (bounds.presetAmountMinor !== null &&
        ((bounds.minimumAmountMinor !== null && bounds.presetAmountMinor < bounds.minimumAmountMinor) ||
          (bounds.maximumAmountMinor !== null && bounds.presetAmountMinor > bounds.maximumAmountMinor)))
    )
      throw new AccountMigrationError('Invalid source custom Price bounds.');
  }
  return { product, price: cleanPrice(price) };
}

export async function planAccountMigration(
  input: {
    environment: Environment;
    sourceAccount: string;
    targetAccount: string;
    databaseIdentity: string;
  },
  dependencies: Dependencies,
): Promise<AccountMigrationManifest> {
  assertAccounts(input.environment, input.sourceAccount, input.targetAccount);
  await dependencies.source.assertAccount(input.sourceAccount, input.environment);
  await dependencies.target.assertAccount(input.targetAccount, input.environment);
  const state = await readState(dependencies.database, dependencies.cmsDatabase);
  const rows: ManifestRow[] = [];
  const identities = new Set<string>();
  for (const raw of state.tables.StoreItemOption!) {
    const item = rowSchema.parse(raw);
    const identity = itemIdentity(item);
    const variantId = identity.variantId;
    for (const key of [
      variantId,
      `slug:${identity.storeItemSlug}`,
      `source:${identity.sourceKind}:${identity.sourceId}`,
    ]) {
      if (identities.has(key)) throw new AccountMigrationError('Duplicate manifest identity.');
      identities.add(key);
    }
    const mapping = one(state.tables.VariantStripeMapping!, 'variantId', variantId);
    const offer = one(state.tables.StoreOfferSnapshot!, 'variantId', variantId);
    const projection = runtimeProjection(item, input.environment);
    const uninitialized = item.catalogRevision === 0 && item.catalogAvailability !== 'published';
    if (
      (mapping && !projection && !uninitialized) ||
      (!mapping && offer) ||
      (offer && offer.storeItemSlug !== identity.storeItemSlug)
    )
      throw new AccountMigrationError('Runtime catalog setup is incomplete or its offer identity conflicts.');
    const row: ManifestRow = {
      item,
      mapping,
      offer,
      stock: one(state.tables.Stock!, 'variantId', variantId),
      availability: one(state.tables.ItemAvailability!, 'variantId', variantId),
      projection,
      sourceProduct: null,
      sourcePrice: null,
      targetProductId: mapping && !uninitialized ? `prod_blackbox_${input.environment}_${variantId}` : null,
      lookupKey: createStripeCatalogLookupKey(input.environment, identity),
      operationId: '',
    };
    const facts = await sourceFacts(row, input.environment, dependencies.source);
    row.sourceProduct = facts.product;
    row.sourcePrice = facts.price;
    if (row.targetProductId && (projection!.taxCode !== facts.product!.taxCode || row.lookupKey.length > 200))
      throw new AccountMigrationError(
        'Runtime presentation tax code or lookup identity conflicts with source authority.',
      );
    if (row.targetProductId) for (const image of projection!.imageUrls) await dependencies.checkImage(image);
    row.operationId = hash({
      environment: input.environment,
      sourceAccount: input.sourceAccount,
      targetAccount: input.targetAccount,
      identity,
      projection,
      sourceProduct: facts.product,
      sourcePrice: facts.price,
    });
    rows.push(row);
  }
  if (
    state.tables.VariantStripeMapping!.some((row) => !rows.some((entry) => entry.item.variantId === row.variantId)) ||
    state.tables.StoreOfferSnapshot!.some((row) => !rows.some((entry) => entry.item.variantId === row.variantId))
  )
    throw new AccountMigrationError('Orphan current mappings or offers need review.');
  const manifest = {
    version: 2 as const,
    ...input,
    live: input.environment === 'prd',
    createdAt: new Date().toISOString(),
    preserved: state.preserved,
    bookkeeping: state.bookkeeping,
    cmsSources: state.cmsSources,
    rows: rows.sort((a, b) => String(a.item.variantId).localeCompare(String(b.item.variantId))),
  };
  return { ...manifest, hash: hash(manifest) };
}

function validateManifest(manifest: AccountMigrationManifest, reviewedHash: string): void {
  const { hash: digest, ...body } = manifest;
  if (
    manifest.version !== 2 ||
    !['uat', 'prd'].includes(manifest.environment) ||
    manifest.live !== (manifest.environment === 'prd') ||
    !/^[a-f0-9]{64}$/.test(reviewedHash) ||
    digest !== reviewedHash ||
    hash(body) !== digest
  )
    throw new AccountMigrationError('Reviewed manifest hash or schema does not match.');
  assertAccounts(manifest.environment, manifest.sourceAccount, manifest.targetAccount);
  for (const row of manifest.rows) {
    rowSchema.parse(row.item);
    const identity = itemIdentity(row.item);
    if (
      !same(row.projection, runtimeProjection(row.item, manifest.environment)) ||
      row.lookupKey !== createStripeCatalogLookupKey(manifest.environment, identity) ||
      row.targetProductId !==
        (row.mapping && !(row.item.catalogRevision === 0 && row.item.catalogAvailability !== 'published')
          ? `prod_blackbox_${manifest.environment}_${identity.variantId}`
          : null) ||
      !/^[a-f0-9]{64}$/.test(row.operationId)
    )
      throw new AccountMigrationError('Manifest row does not match its runtime identity.');
  }
}
function targetRows(row: ManifestRow, journal: AccountMigrationJournal) {
  const entry = journal.rows[String(row.item.variantId)];
  if (!entry || !row.mapping || !row.sourcePrice || !row.targetProductId)
    throw new AccountMigrationError('Destination row is not prepared.');
  if (
    entry.productId !== row.targetProductId ||
    !/^price_[A-Za-z0-9_]+$/.test(entry.priceId) ||
    !Number.isFinite(Date.parse(entry.preparedAt))
  )
    throw new AccountMigrationError('Journal row conflicts with the manifest.');
  const price = row.sourcePrice;
  const mapping = {
    ...row.mapping,
    stripeProductId: entry.productId,
    stripePriceId: entry.priceId,
    updatedAt: entry.preparedAt,
  };
  const offer: Row = {
    ...(row.offer ?? {
      id: `migration_${row.operationId.slice(0, 32)}`,
      storeItemSlug: row.item.storeItemSlug!,
      variantId: row.item.variantId!,
      createdAt: entry.preparedAt,
    }),
    stripePriceId: entry.priceId,
    stripeLookupKey: row.lookupKey,
    amountMinor: price.priceKind === 'fixed' ? price.amountMinor : null,
    currencyCode: price.currencyCode!,
    priceActive: Number(price.active),
    productActive: Number(price.productActive),
    syncedAt: entry.preparedAt,
    freshUntil: new Date(Date.parse(entry.preparedAt) + STORE_OFFER_FRESHNESS_MS).toISOString(),
    updatedAt: entry.preparedAt,
  };
  return { mapping, offer };
}
function rowPredicate(table: string, row: Row | null, variantId: string): string {
  if (!row) return `NOT EXISTS (SELECT 1 FROM ${identifier(table)} WHERE variantId = ${sql(variantId)})`;
  rowSchema.parse(row);
  return `EXISTS (SELECT 1 FROM ${identifier(table)} WHERE ${Object.entries(row)
    .map(([key, value]) => `${identifier(key)} IS ${sql(value)}`)
    .join(' AND ')})`;
}
function replaceRow(table: string, before: Row | null, after: Row | null, fields: string[]): string {
  if (!after) return `DELETE FROM ${identifier(table)} WHERE id = ${sql(before!.id!)}`;
  if (!before)
    return `INSERT INTO ${identifier(table)} (${Object.keys(after).map(identifier).join(',')}) VALUES (${Object.values(after).map(sql).join(',')})`;
  return `UPDATE ${identifier(table)} SET ${fields.map((field) => `${identifier(field)} = ${sql(after[field]!)}`).join(', ')} WHERE id = ${sql(before.id!)}`;
}
export function accountMigrationBatch(row: ManifestRow, journal: AccountMigrationJournal, restore: boolean): string[] {
  const target = targetRows(row, journal);
  const from = restore ? target : row;
  const to = restore ? row : target;
  const variantId = String(row.item.variantId);
  const guard = [
    rowPredicate('StoreItemOption', row.item, variantId),
    rowPredicate('VariantStripeMapping', from.mapping, variantId),
    rowPredicate('StoreOfferSnapshot', from.offer, variantId),
    rowPredicate('Stock', row.stock, variantId),
    rowPredicate('ItemAvailability', row.availability, variantId),
  ].join(' AND ');
  // An assertion error rolls back the entire D1 batch; a failed precondition must not be a successful no-op.
  return [
    `SELECT json(CASE WHEN ${guard} THEN 'null' ELSE 'catalog source drift' END)`,
    replaceRow('VariantStripeMapping', from.mapping, to.mapping, mappingFields),
    replaceRow('StoreOfferSnapshot', from.offer, to.offer, offerFields),
  ];
}
async function verifyTarget(
  row: ManifestRow,
  journal: AccountMigrationJournal,
  environment: Environment,
  dependencies: Dependencies,
) {
  const entry = journal.rows[String(row.item.variantId)];
  if (!entry || !row.sourcePrice || !row.projection)
    throw new AccountMigrationError('Destination row is not prepared.');
  const product = await dependencies.target.inspectSetupProduct(entry.productId, environment);
  const price = await dependencies.target.retrieveDefaultPrice(entry.productId);
  const metadata = {
    ...createStripeCatalogMetadata(environment, itemIdentity(row.item)),
    catalogMigrationId: row.operationId,
  };
  const expected = row.sourcePrice;
  if (
    !product ||
    product.deleted ||
    product.live !== (environment === 'prd') ||
    !price ||
    product.defaultPriceId !== entry.priceId ||
    price.priceId !== entry.priceId ||
    price.productId !== row.targetProductId ||
    price.active !== expected.active ||
    price.productActive !== expected.productActive ||
    price.amountMinor !== expected.amountMinor ||
    price.currencyCode !== expected.currencyCode ||
    price.taxBehavior !== expected.taxBehavior ||
    price.priceKind !== expected.priceKind ||
    !same(price.customUnitAmount, expected.customUnitAmount) ||
    price.lookupKey !== row.lookupKey ||
    price.productName !== row.projection.name ||
    (price.productDescription ?? '') !== row.projection.description ||
    !same(price.productImages, row.projection.imageUrls) ||
    price.productTaxCode !== row.projection.taxCode ||
    Object.entries({ ...row.projection.metadata, ...metadata }).some(
      ([key, value]) => price.productMetadata[key] !== value,
    ) ||
    Object.entries(metadata).some(([key, value]) => price.metadata[key] !== value)
  )
    throw new AccountMigrationError('Destination Product/default Price does not match the manifest.');
  for (const image of price.productImages) await dependencies.checkImage(image);
}
async function verifyState(
  manifest: AccountMigrationManifest,
  journal: AccountMigrationJournal,
  dependencies: Dependencies,
  required: 'source' | 'target' | 'either',
  observation: Pick<AccountMigrationJournal['bookkeeping'][number], 'mode' | 'phase'>,
) {
  const state = await readState(dependencies.database, dependencies.cmsDatabase);
  journal.bookkeeping.push({ ...observation, at: new Date().toISOString(), observed: state.bookkeeping });
  await dependencies.saveJournal(journal);
  if (!same(state.preserved, manifest.preserved))
    throw new AccountMigrationError('Protected data changed; record legitimate activity and review a fresh manifest.');
  if (!same(state.cmsSources, manifest.cmsSources))
    throw new AccountMigrationError('Reviewed CMS item-source inventory changed.');
  if (
    state.tables.VariantStripeMapping!.length !== manifest.rows.filter((row) => row.mapping).length ||
    state.tables.StoreOfferSnapshot!.some(
      (offer) => !manifest.rows.some((row) => row.item.variantId === offer.variantId),
    )
  )
    throw new AccountMigrationError('Current catalog row set changed.');
  const positions = new Map<string, 'source' | 'target'>();
  for (const row of manifest.rows) {
    const variantId = String(row.item.variantId);
    if (!same(one(state.tables.StoreItemOption!, 'variantId', variantId), row.item))
      throw new AccountMigrationError('Source item revision changed.');
    const mapping = one(state.tables.VariantStripeMapping!, 'variantId', variantId);
    const offer = one(state.tables.StoreOfferSnapshot!, 'variantId', variantId);
    const source = same(mapping, row.mapping) && same(offer, row.offer);
    const target = row.targetProductId && journal.rows[variantId] ? targetRows(row, journal) : null;
    const atTarget = target && same(mapping, target.mapping) && same(offer, target.offer);
    if (
      (!source && !atTarget) ||
      (required === 'source' && !source) ||
      (required === 'target' && row.targetProductId && !atTarget)
    )
      throw new AccountMigrationError('Current mapping or offer changed outside the migration.');
    positions.set(variantId, atTarget ? 'target' : 'source');
  }
  return positions;
}

export async function executeAccountMigration(
  manifest: AccountMigrationManifest,
  journal: AccountMigrationJournal,
  options: { mode: 'apply' | 'restore'; reviewedHash: string; confirmLiveChanges: boolean; prepareOnly?: boolean },
  dependencies: Dependencies,
): Promise<void> {
  validateManifest(manifest, options.reviewedHash);
  if (manifest.environment === 'prd' && !options.confirmLiveChanges)
    throw new AccountMigrationError('PRD writes require --confirm-live-catalog-changes.');
  if (
    journal.version !== 2 ||
    !Array.isArray(journal.bookkeeping) ||
    journal.manifestHash !== manifest.hash ||
    Object.keys(journal.rows).some(
      (variantId) => !manifest.rows.some((row) => row.targetProductId && row.item.variantId === variantId),
    )
  )
    throw new AccountMigrationError('Journal does not belong to this manifest.');
  await dependencies.source.assertAccount(manifest.sourceAccount, manifest.environment);
  await dependencies.target.assertAccount(manifest.targetAccount, manifest.environment);
  await verifyState(manifest, journal, dependencies, 'either', { mode: options.mode, phase: 'before' });
  for (const row of manifest.rows) {
    const facts = await sourceFacts(row, manifest.environment, dependencies.source);
    if (!same(facts.product, row.sourceProduct) || !same(facts.price, row.sourcePrice))
      throw new AccountMigrationError('Source provider facts changed.');
  }
  if (options.mode === 'apply') {
    for (const row of manifest.rows.filter((entry) => entry.targetProductId)) {
      const variantId = String(row.item.variantId);
      if (!journal.rows[variantId]) {
        const input: StripeAccountCatalogInput = {
          productId: row.targetProductId!,
          operationId: row.operationId,
          metadata: createStripeCatalogMetadata(manifest.environment, itemIdentity(row.item)),
          lookupKey: row.lookupKey,
          projection: row.projection!,
          sourcePrice: row.sourcePrice!,
          confirmLiveChanges: options.confirmLiveChanges,
        };
        for (const image of input.projection.imageUrls) await dependencies.checkImage(image);
        const price = await dependencies.target.ensureAccountCatalog(input);
        journal.rows[variantId] = {
          productId: row.targetProductId!,
          priceId: price.priceId,
          preparedAt: new Date().toISOString(),
        };
        journal.steps.push({ mode: 'prepare', variantId, at: new Date().toISOString() });
        await dependencies.saveJournal(journal);
      }
      await verifyTarget(row, journal, manifest.environment, dependencies);
    }
  }
  const positions = await verifyState(manifest, journal, dependencies, 'either', {
    mode: options.mode,
    phase: 'prepared',
  });
  if (options.prepareOnly) {
    if (options.mode !== 'apply') throw new AccountMigrationError('--prepare-only is available only for apply.');
    return;
  }
  for (const row of manifest.rows.filter((entry) => entry.targetProductId)) {
    const variantId = String(row.item.variantId);
    const desired = options.mode === 'restore' ? 'source' : 'target';
    if (positions.get(variantId) === desired) continue;
    const facts = await sourceFacts(row, manifest.environment, dependencies.source);
    if (!same(facts.product, row.sourceProduct) || !same(facts.price, row.sourcePrice))
      throw new AccountMigrationError('Source provider facts changed before switch.');
    // Restore may leave unused destination objects staged; it never deletes provider history.
    if (options.mode === 'apply') await verifyTarget(row, journal, manifest.environment, dependencies);
    await dependencies.database.batch(accountMigrationBatch(row, journal, options.mode === 'restore'));
    journal.steps.push({ mode: options.mode, variantId, at: new Date().toISOString() });
    await dependencies.saveJournal(journal);
  }
  await verifyState(manifest, journal, dependencies, options.mode === 'restore' ? 'source' : 'target', {
    mode: options.mode,
    phase: 'after',
  });
  if (options.mode === 'apply')
    for (const row of manifest.rows.filter((entry) => entry.targetProductId))
      await verifyTarget(row, journal, manifest.environment, dependencies);
}

export function parseAccountMigrationArgs(args: string[]): Options {
  const values = new Map<string, string>();
  const flags = new Set<string>();
  const booleans = ['--prepare-only', '--confirm-live-catalog-changes'];
  const names = [
    '--mode',
    '--env',
    '--source-account',
    '--target-account',
    '--manifest',
    '--journal',
    '--reviewed-hash',
  ];
  for (let index = 0; index < args.length; index++) {
    const key = args[index]!;
    if (flags.has(key) || values.has(key)) throw new AccountMigrationError('Duplicate migration argument.');
    if (booleans.includes(key)) flags.add(key);
    else if (names.includes(key) && args[index + 1] && !args[index + 1]!.startsWith('--'))
      values.set(key, args[++index]!);
    else throw new AccountMigrationError('Unknown or incomplete migration argument.');
  }
  const environment = z.enum(['uat', 'prd']).parse(values.get('--env'));
  const mode = z.enum(['plan', 'apply', 'restore']).parse(values.get('--mode') ?? 'plan');
  const sourceAccount = z.string().parse(values.get('--source-account'));
  const targetAccount = z.string().parse(values.get('--target-account'));
  assertAccounts(environment, sourceAccount, targetAccount);
  const manifestPath = z.string().min(1).parse(values.get('--manifest'));
  const prepareOnly = flags.has('--prepare-only');
  if (prepareOnly && mode !== 'apply') throw new AccountMigrationError('--prepare-only requires apply mode.');
  return {
    environment,
    mode,
    sourceAccount,
    targetAccount,
    manifestPath,
    journalPath: values.get('--journal') ?? `${manifestPath}.journal.json`,
    reviewedHash: values.get('--reviewed-hash'),
    prepareOnly,
    confirmLiveChanges: flags.has('--confirm-live-catalog-changes'),
  };
}

const projectRoot = fileURLToPath(new URL('../../../', import.meta.url));
function privatePath(value: string): string {
  const result = path.resolve(projectRoot, value);
  const root = path.join(projectRoot, '.codex-artifacts', 'catalog-migration') + path.sep;
  if (!result.startsWith(root) || !result.endsWith('.json'))
    throw new AccountMigrationError('Keep private migration JSON under .codex-artifacts/catalog-migration/.');
  return result;
}
function savePrivateJson(file: string, data: unknown, create = false): void {
  mkdirSync(path.dirname(file), { recursive: true });
  if (create) writeFileSync(file, JSON.stringify(data, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  else {
    const temporary = `${file}.${process.pid}.tmp`;
    writeFileSync(temporary, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 });
    renameSync(temporary, file);
  }
}
async function main() {
  if (process.argv.includes('--help')) {
    console.log(
      'stripe:catalog:migrate --env uat|prd --source-account <id> --target-account <id> --manifest .codex-artifacts/catalog-migration/<file>.json [--mode plan|apply|restore] [--reviewed-hash <sha256>] [--prepare-only] [--confirm-live-catalog-changes]',
    );
    return;
  }
  const options = parseAccountMigrationArgs(process.argv.slice(2));
  const manifestPath = privatePath(options.manifestPath);
  const journalPath = privatePath(options.journalPath);
  if (manifestPath === journalPath) throw new AccountMigrationError('Manifest and journal paths must differ.');
  if (
    options.mode !== 'plan' &&
    (!options.reviewedHash || (options.environment === 'prd' && !options.confirmLiveChanges))
  )
    throw new AccountMigrationError('Writes require the reviewed hash and PRD live confirmation.');
  const { unstable_readConfig } = await import('wrangler');
  const config = unstable_readConfig(
    { config: path.join(projectRoot, 'apps/backend/wrangler.jsonc'), env: options.environment },
    { hideWarnings: true },
  );
  const binding = config.d1_databases.find(
    (database: { binding?: string; database_id?: string }) => database.binding === 'COMMERCE_DB',
  );
  const account = z
    .string()
    .regex(/^[a-f0-9]{32}$/)
    .parse(process.env.CLOUDFLARE_ACCOUNT_ID);
  const databaseId = z.string().uuid().parse(binding?.database_id);
  const cmsResources = JSON.parse(readFileSync(path.join(projectRoot, 'apps/backend/cms-resources.json'), 'utf8'));
  const cmsDatabaseId = z.string().uuid().parse(cmsResources[options.environment]?.database_id);
  if (cmsDatabaseId === databaseId) throw new AccountMigrationError('CMS_DB and COMMERCE_DB must be separate.');
  if (config.vars.PRODUCT_ENVIRONMENT !== options.environment.toUpperCase())
    throw new AccountMigrationError('D1 configuration environment conflicts.');
  const token = z.string().min(1).parse(process.env.CLOUDFLARE_API_TOKEN);
  const request = async (statements: string[], selectedDatabase = databaseId) => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${selectedDatabase}/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch: statements.map((statement) => ({ sql: statement })) }),
        signal: AbortSignal.timeout(30_000),
      },
    );
    const data = (await response.json()) as {
      success?: boolean;
      result?: Array<{ success?: boolean; results?: unknown }>;
    };
    if (
      !response.ok ||
      !data.success ||
      data.result?.length !== statements.length ||
      data.result.some((result) => !result.success)
    )
      throw new AccountMigrationError('D1 migration request failed; checkout must remain closed.');
    return data.result;
  };
  const database: Database = {
    query: async (statement) => parseAccountMigrationQueryRows((await request([statement]))[0]!.results),
    batch: async (statements) => {
      await request(statements);
    },
  };
  const checkedImages = new Set<string>();
  const dependencies: Dependencies = {
    database,
    cmsDatabase: {
      query: async (statement) =>
        parseAccountMigrationQueryRows((await request([statement], cmsDatabaseId))[0]!.results),
    },
    source: createStripeAccountCatalogGateway(
      { STRIPE_SECRET_KEY: z.string().min(1).parse(process.env.SOURCE_STRIPE_SECRET_KEY) },
      { maxNetworkRetries: 0, timeout: 30_000 },
    ),
    target: createStripeAccountCatalogGateway(
      { STRIPE_SECRET_KEY: z.string().min(1).parse(process.env.TARGET_STRIPE_SECRET_KEY) },
      { maxNetworkRetries: 0, timeout: 30_000 },
    ),
    checkImage: async (value) => {
      if (!checkedImages.has(value)) {
        await verifyAccountMigrationImage(value, options.environment);
        checkedImages.add(value);
      }
    },
    saveJournal: async (journal) => {
      savePrivateJson(journalPath, journal);
    },
  };
  const databaseIdentity = `${account}/${databaseId}/${cmsDatabaseId}`;
  if (options.mode === 'plan') {
    const manifest = await planAccountMigration(
      {
        environment: options.environment,
        sourceAccount: options.sourceAccount,
        targetAccount: options.targetAccount,
        databaseIdentity,
      },
      dependencies,
    );
    savePrivateJson(manifestPath, manifest, true);
    console.log(
      JSON.stringify({
        mode: 'plan',
        environment: options.environment,
        rows: manifest.rows.length,
        initialized: manifest.rows.filter((row) => row.targetProductId).length,
        cmsSources: manifest.cmsSources.length,
        unlinkedCmsSources: manifest.cmsSources.filter((source) => source.catalogVariantId === null).length,
        reviewedHash: manifest.hash,
      }),
    );
    return;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as AccountMigrationManifest;
  validateManifest(manifest, options.reviewedHash!);
  if (
    manifest.environment !== options.environment ||
    manifest.sourceAccount !== options.sourceAccount ||
    manifest.targetAccount !== options.targetAccount ||
    manifest.databaseIdentity !== databaseIdentity
  )
    throw new AccountMigrationError('Run assertions do not match the reviewed manifest.');
  mkdirSync(path.dirname(journalPath), { recursive: true });
  const lockPath = `${journalPath}.lock`;
  if (existsSync(lockPath)) {
    const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as { host: string; pid: number };
    if (lock.host !== hostname()) throw new AccountMigrationError('Another host owns this migration journal.');
    try {
      process.kill(lock.pid, 0);
      throw new AccountMigrationError('Another process owns this migration journal.');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
    }
    unlinkSync(lockPath);
  }
  writeFileSync(lockPath, JSON.stringify({ host: hostname(), pid: process.pid }), { flag: 'wx', mode: 0o600 });
  try {
    const journal: AccountMigrationJournal = existsSync(journalPath)
      ? JSON.parse(readFileSync(journalPath, 'utf8'))
      : { version: 2, manifestHash: manifest.hash, rows: {}, steps: [], bookkeeping: [] };
    if (!existsSync(journalPath)) savePrivateJson(journalPath, journal, true);
    await executeAccountMigration(
      manifest,
      journal,
      {
        mode: options.mode,
        reviewedHash: options.reviewedHash!,
        prepareOnly: options.prepareOnly,
        confirmLiveChanges: options.confirmLiveChanges,
      },
      dependencies,
    );
    console.log(
      JSON.stringify({
        mode: options.prepareOnly ? 'prepare' : options.mode,
        environment: options.environment,
        verifiedRows: manifest.rows.length,
        manifestHash: manifest.hash,
        protectedData: 'unchanged',
      }),
    );
  } finally {
    unlinkSync(lockPath);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(formatAccountMigrationError(error));
    process.exitCode = 1;
  });
}
