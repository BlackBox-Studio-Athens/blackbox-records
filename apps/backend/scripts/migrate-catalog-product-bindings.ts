import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Stripe from 'stripe';
import { loadStripeCatalogStoreItemContracts } from '../../../scripts/stripe-catalog-contract';
import { createStoreOfferPriceFromCatalogPrice } from '../src/application/commerce/catalog-sync/money';
import { StripeCatalogGatewayClient } from '../src/infrastructure/stripe/stripe-catalog-gateway';

const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(backend, '../..');
const args = process.argv.slice(2);
const environment = args[args.indexOf('--env') + 1];
const apply = args.includes('--apply');
if (environment !== 'uat' && environment !== 'prd') throw new Error('Select --env uat|prd.');
if (apply && environment === 'prd' && !args.includes('--confirm-live-catalog-changes')) {
  throw new Error('PRD migration requires --confirm-live-catalog-changes for this run.');
}
const key = process.env.STRIPE_SECRET_KEY ?? '';
if (!key.startsWith(environment === 'uat' ? 'sk_test_' : 'sk_live_')) throw new Error('Wrong Stripe key mode.');
const stripe = new Stripe(key);
const gateway = new StripeCatalogGatewayClient(stripe);
const evidence = path.join(root, '.codex-artifacts/catalog-migration', `${environment}-${Date.now()}`);
await mkdir(evidence, { recursive: true });

function wrangler(args: string[]): string {
  return execFileSync(process.execPath, [path.join(backend, 'node_modules/wrangler/bin/wrangler.js'), ...args], {
    cwd: backend,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 8 * 1024 * 1024,
  });
}
function query(sql: string): string {
  return wrangler(['d1', 'execute', 'COMMERCE_DB', '--env', environment!, '--remote', '--command', sql, '--json']);
}
function quote(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

wrangler([
  'd1',
  'export',
  'COMMERCE_DB',
  '--env',
  environment,
  '--remote',
  '--output',
  path.join(evidence, 'before.sql'),
  '--table',
  'StoreItemOption',
  '--table',
  'VariantStripeMapping',
  '--table',
  'StoreOfferSnapshot',
  '--table',
  'Stock',
  '--table',
  'ItemAvailability',
]);
const output = query('SELECT variantId, stripePriceId, stripeProductId FROM VariantStripeMapping');
const rows = JSON.parse(output.slice(output.indexOf('['), output.lastIndexOf(']') + 1))[0].results as Array<{
  variantId: string;
  stripePriceId: string;
  stripeProductId: string | null;
}>;
const contracts = (
  await loadStripeCatalogStoreItemContracts({
    projectRoot: root,
    productEnvironment: environment === 'uat' ? 'UAT' : 'PRD',
  })
).filter((c) => c.desiredCatalogEntry.targetEnvironments.includes(environment));
const plan = [];
for (const contract of contracts) {
  const mapping = rows.find((row) => row.variantId === contract.variantId);
  if (mapping?.stripeProductId) continue;
  const priceId = mapping?.stripePriceId;
  if (!priceId) throw new Error(`${contract.storeItemSlug}: trusted Price mapping is missing.`);
  const price = await gateway.retrievePrice(priceId);
  const expected = {
    appEnv: environment,
    sourceId: contract.sourceId,
    sourceKind: contract.sourceKind,
    storeItemSlug: contract.storeItemSlug,
    variantId: contract.variantId,
  };
  if (
    !price?.productId ||
    !Object.entries(expected).every(([k, v]) => price.productMetadata[k] === v) ||
    Object.entries(expected).some(([k, v]) => price.metadata[k] !== undefined && price.metadata[k] !== v) ||
    !createStoreOfferPriceFromCatalogPrice(price) ||
    price.productTaxCode !== 'txcd_99999999'
  ) {
    throw new Error(`${contract.storeItemSlug}: Price identity, currency, amount, or tax needs review.`);
  }
  const providerPrice = await stripe.prices.retrieve(priceId);
  if (providerPrice.type !== 'one_time' || providerPrice.livemode !== (environment === 'prd'))
    throw new Error(`${contract.storeItemSlug}: unsupported Price.`);
  const product = await stripe.products.retrieve(price.productId);
  if ('deleted' in product) throw new Error(`${contract.storeItemSlug}: Product was deleted.`);
  const currentDefault = typeof product.default_price === 'string' ? product.default_price : product.default_price?.id;
  if (currentDefault && currentDefault !== priceId)
    throw new Error(`${contract.storeItemSlug}: default differs from trusted mapping.`);
  if (!price.active || !product.active)
    throw new Error(`${contract.storeItemSlug}: paused objects require explicit review.`);
  plan.push({
    variantId: contract.variantId,
    productId: product.id,
    priceId,
    currentDefault,
  });
}
await writeFile(path.join(evidence, 'bindings.json'), JSON.stringify(plan, null, 2));
console.log(
  `${environment.toUpperCase()} migration: ${plan.length} validated bindings; ${apply ? 'applying' : 'dry run'}.`,
);
if (apply) {
  for (const item of plan) {
    if (!item.currentDefault)
      await stripe.products.update(item.productId, {
        default_price: item.priceId,
      });
  }
  if (plan.length) {
    const sql = plan
      .map(
        (item) =>
          `INSERT INTO VariantStripeMapping (id, variantId, stripePriceId, stripeProductId, createdAt, updatedAt) VALUES (${quote(`mapping_${item.variantId}`)}, ${quote(item.variantId)}, ${quote(item.priceId)}, ${quote(item.productId)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(variantId) DO UPDATE SET stripeProductId=excluded.stripeProductId, updatedAt=CURRENT_TIMESTAMP;`,
      )
      .join('\n');
    const sqlPath = path.join(evidence, 'bindings.sql');
    await writeFile(sqlPath, sql);
    wrangler(['d1', 'execute', 'COMMERCE_DB', '--env', environment, '--remote', '--file', sqlPath, '--json']);
  }
}
