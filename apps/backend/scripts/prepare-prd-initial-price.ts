import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import Stripe from 'stripe';
import { parseStoreItemSlug, parseVariantId } from '../src/domain/commerce';
import {
  catalogManifest,
  createStripeCatalogLookupKey,
  createStripeCatalogMetadata,
  createStripeCatalogMutationContext,
  CatalogReconciler,
  type StripeCatalogPriceChangeInput,
} from '../src/application/commerce/catalog-sync';
import { createStripeCatalogGateway } from '../src/infrastructure/stripe';
import {
  createD1CatalogReadSql,
  createD1CatalogRepositories,
  parseD1Rows,
  redactStripeCatalogDiagnostic,
  type D1CatalogRow,
} from '../../../scripts/stripe-catalog-verify';

// Explicit cutover tooling; never called by ordinary install/build/runtime paths.
const slug = 'disintegration-black-vinyl-lp';
const operationId = 'emdash-prd-disintegration-initial-20260915';
const backend = fileURLToPath(new URL('../', import.meta.url));

export function requireInitialPriceApproval(
  apply: boolean,
  confirmed: boolean,
  reviewed: string | undefined,
  actual: string,
) {
  if (apply && (!confirmed || reviewed !== actual))
    throw new Error('PRD apply requires one-run confirmation and the exact reviewed plan SHA-256.');
}

export async function preparePrdInitialPrice() {
  const { values } = parseArgs({
    options: {
      apply: { type: 'boolean', default: false },
      'confirm-live-catalog-changes': { type: 'boolean', default: false },
      'plan-sha256': { type: 'string' },
    },
  });
  const source = catalogManifest.entries.find((item) => item.storeItemSlug === slug);
  assert.ok(source && source.targetEnvironments.includes('prd'));
  const entry = {
    ...source,
    storeItemSlug: parseStoreItemSlug(source.storeItemSlug),
    variantId: parseVariantId(source.variantId),
  };
  const metadata = createStripeCatalogMetadata('prd', entry);
  const productId = `prod_blackbox_prd_${entry.variantId}`;
  const intent = {
    environment: 'prd',
    database: 'de66a606-908d-446c-8415-39504e653f49',
    operationId,
    metadata,
    productId,
    projection: entry.productProjection,
    amountMinor: 2800,
    currencyCode: 'EUR',
    taxBehavior: 'inclusive',
    physicalStock: 15,
    onlineStock: 12,
    checkoutLaunch: false,
  };
  const planSha256 = createHash('sha256').update(JSON.stringify(intent)).digest('hex');
  requireInitialPriceApproval(values.apply, values['confirm-live-catalog-changes'], values['plan-sha256'], planSha256);
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  assert.ok(key && /^[sr]k_live_/.test(key), 'A live Stripe key is required.');
  assert.equal(process.env.STRIPE_API_BASE_URL, undefined, 'Provider overrides are not allowed.');
  const query = (sql: string) =>
    execFileSync(
      process.execPath,
      [
        fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url)),
        'd1',
        'execute',
        'COMMERCE_DB',
        '--env',
        'prd',
        '--remote',
        '--command',
        sql,
        '--json',
      ],
      { cwd: backend, encoding: 'utf8', windowsHide: true, maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] },
    );
  const rows = parseD1Rows<D1CatalogRow>(query(createD1CatalogReadSql([entry])));
  assert.equal(rows.length, 1, 'Expected exactly the retained Disintegration identity.');
  assert.equal(rows[0].storeItemSlug, slug);
  assert.equal(rows[0].sourceKind, entry.sourceKind);
  assert.equal(rows[0].sourceId, entry.sourceId);
  const stock = parseD1Rows<{ quantity: number; onlineQuantity: number }>(
    query(`SELECT quantity, onlineQuantity FROM Stock WHERE variantId = '${entry.variantId}'`),
  );
  assert.deepEqual(stock, [{ quantity: 15, onlineQuantity: 12 }], 'Retained stock changed; review before proceeding.');
  const stripe = new Stripe(key);
  const products: Stripe.Product[] = [];
  let startingAfter: string | undefined;
  for (let page = 0; page < 3; page++) {
    const result = await stripe.products.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    products.push(...result.data);
    if (!result.has_more) break;
    assert.ok(page < 2, 'Product inventory exceeds the 300-object review budget.');
    startingAfter = result.data.at(-1)?.id;
    assert.ok(startingAfter);
  }
  const matches = products.filter(
    (product) =>
      product.id === productId ||
      (product.metadata.appEnv === 'prd' &&
        (product.metadata.variantId === entry.variantId || product.metadata.storeItemSlug === slug)),
  );
  assert.ok(
    matches.length <= 1 &&
      matches.every(
        (product) => product.id === productId && product.active && product.metadata.catalogOperationId === operationId,
      ),
    'An existing Product needs explicit binding review; no new Product will be created.',
  );
  assert.ok(
    !rows[0].mappingStripeProductId || rows[0].mappingStripeProductId === productId,
    'Existing binding belongs to a different Product.',
  );
  assert.ok(
    !rows[0].mappingStripePriceId || rows[0].mappingStripeProductId === productId,
    'A Price-only binding needs migration review.',
  );
  console.log(
    JSON.stringify(
      {
        ...intent,
        planSha256,
        productsInspected: products.length,
        existingSetupProducts: matches.length,
        apply: values.apply,
      },
      null,
      2,
    ),
  );
  if (!values.apply) return;
  const gateway = createStripeCatalogGateway({ STRIPE_SECRET_KEY: key });
  const productInput = { operationId, metadata, projection: entry.productProjection, confirmLiveSetup: true };
  const productContext = createStripeCatalogMutationContext({
    environment: 'prd',
    variantId: entry.variantId,
    action: 'create_catalog_price',
    identity: operationId,
    requestShape: productInput,
  });
  await gateway.ensureSetupProduct(productInput, productContext);
  const input: StripeCatalogPriceChangeInput = {
    operationId,
    metadata,
    productId,
    expectedDefaultPriceId: null,
    kind: 'fixed',
    amountMinor: 2800,
    currencyCode: 'EUR',
    lookupKey: createStripeCatalogLookupKey('prd', entry),
    productName: entry.productProjection.name,
    productProjection: entry.productProjection,
  };
  const context = createStripeCatalogMutationContext({
    environment: 'prd',
    variantId: entry.variantId,
    action: 'create_catalog_price',
    identity: operationId,
    requestShape: input,
  });
  const price = await gateway.createReplacementPrice(input, context);
  await gateway.selectReplacementPrice(input, price.priceId, context);
  const repositories = createD1CatalogRepositories('prd', rows);
  await repositories.variantStripeMappings.save({
    variantId: entry.variantId,
    stripeProductId: productId,
    stripePriceId: price.priceId,
  });
  const result = await new CatalogReconciler({
    environment: 'prd',
    stripeCatalog: gateway,
    ...repositories,
  }).reconcileVariant(entry, { apply: true });
  assert.equal(result.issues.length, 0, 'Catalog reconciliation needs review.');
  assert.deepEqual(
    parseD1Rows(query(`SELECT quantity, onlineQuantity FROM Stock WHERE variantId = '${entry.variantId}'`)),
    stock,
  );
  console.log(JSON.stringify({ applied: true, planSha256, stockUnchanged: true, checkoutLaunch: false }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  preparePrdInitialPrice().catch((error) => {
    console.error(redactStripeCatalogDiagnostic(error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  });
}
