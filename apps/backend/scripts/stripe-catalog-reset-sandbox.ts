import process from 'node:process';
import { pathToFileURL } from 'node:url';

import Stripe from 'stripe';

import {
  createStripeCatalogLookupKey,
  createStripeCatalogMetadata,
  redactStripeObjectId,
  type StripeCatalogEnvironment,
} from '../src/application/commerce/catalog-sync';
import { parseStoreItemSlug, parseVariantId } from '../src/domain/commerce';
import type { StoreItemOptionRecord } from '../src/domain/commerce/repositories/spi';
import {
  loadStripeCatalogStoreItemContracts,
  type StripeCatalogStoreItemContract,
} from '../../../scripts/stripe-catalog-contract';

type ResetMode = 'confirm' | 'dry-run';

type ResetOptions = {
  environment: StripeCatalogEnvironment;
  mode: ResetMode;
};

type ResetPlan = {
  productsToDeactivate: string[];
  pricesToDeactivate: string[];
};

type ResetStripeClient = {
  prices: {
    list(params: Stripe.PriceListParams): Promise<Stripe.ApiList<Stripe.Price>>;
    update(id: string, params: Stripe.PriceUpdateParams, options?: Stripe.RequestOptions): Promise<Stripe.Price>;
  };
  products: {
    list(params: Stripe.ProductListParams): Promise<Stripe.ApiList<Stripe.Product>>;
    update(id: string, params: Stripe.ProductUpdateParams, options?: Stripe.RequestOptions): Promise<Stripe.Product>;
  };
};

export function parseStripeCatalogResetSandboxArgs(args: string[]): ResetOptions {
  const options: ResetOptions = {
    environment: 'uat',
    mode: 'dry-run',
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--dry-run') {
      options.mode = 'dry-run';
      continue;
    }

    if (arg === '--confirm') {
      options.mode = 'confirm';
      continue;
    }

    if (arg === '--env') {
      options.environment = parseEnvironment(args[index + 1]);
      index += 1;
      continue;
    }

    if (arg?.startsWith('--env=')) {
      options.environment = parseEnvironment(arg.slice('--env='.length));
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log('Usage: pnpm stripe:catalog:reset-uat --env uat [--dry-run|--confirm]');
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.environment !== 'uat') {
    throw new Error('Stripe sandbox catalog reset is allowed only with --env uat.');
  }

  return options;
}

export async function resetStripeSandboxCatalog(
  options: ResetOptions,
  stripe: ResetStripeClient,
  contracts: StripeCatalogStoreItemContract[],
): Promise<ResetPlan> {
  const plan = await createResetPlan(options.environment, stripe, contracts);

  if (options.mode === 'confirm') {
    await applyResetPlan(stripe, plan);
  }

  return plan;
}

export async function createResetPlan(
  environment: StripeCatalogEnvironment,
  stripe: ResetStripeClient,
  contracts: StripeCatalogStoreItemContract[],
): Promise<ResetPlan> {
  const expectedLookupKeys = new Set(
    contracts.flatMap((contract) => {
      const storeItem = toStoreItemOptionRecord(contract);
      return [createStripeCatalogLookupKey(environment, storeItem), createLegacySandboxLookupKey(storeItem)];
    }),
  );
  const expectedIdentities = contracts.map((contract) =>
    createStripeCatalogMetadata(environment, toStoreItemOptionRecord(contract)),
  );
  const expectedLegacyProductNames = new Set(
    contracts.flatMap((contract) => createLegacySandboxProductNames(contract.productProjection.name)),
  );
  const [prices, products] = await Promise.all([
    stripe.prices.list({ active: true, expand: ['data.product'], limit: 100 }),
    stripe.products.list({ active: true, limit: 100 }),
  ]);

  const pricesToDeactivate = prices.data
    .filter((price) =>
      isRepoOwnedSandboxPrice(price, expectedLookupKeys, expectedIdentities, expectedLegacyProductNames),
    )
    .map((price) => price.id)
    .sort();
  const productIdsFromPrices = new Set(
    prices.data
      .filter((price) => pricesToDeactivate.includes(price.id))
      .map((price) => extractProductId(price.product))
      .filter((value): value is string => Boolean(value)),
  );
  const productsToDeactivate = products.data
    .filter(
      (product) =>
        productIdsFromPrices.has(product.id) ||
        hasExpectedMetadata(normalizeMetadata(product.metadata), expectedIdentities) ||
        isLegacyRepoOwnedSandboxProduct(product, expectedLegacyProductNames),
    )
    .map((product) => product.id)
    .sort();

  return {
    pricesToDeactivate,
    productsToDeactivate,
  };
}

export function formatStripeCatalogResetSandboxReport(plan: ResetPlan, options: ResetOptions): string {
  return [
    'Stripe sandbox catalog reset report',
    `Mode: ${options.mode}`,
    `Prices to deactivate: ${plan.pricesToDeactivate.length}`,
    ...plan.pricesToDeactivate.map((priceId) => `- ${redactStripeObjectId(priceId)}`),
    `Products to deactivate: ${plan.productsToDeactivate.length}`,
    ...plan.productsToDeactivate.map((productId) => `- ${redactStripeObjectId(productId)}`),
    options.mode === 'dry-run'
      ? 'Dry-run only. Rerun with --confirm to deactivate these sandbox objects.'
      : 'Confirmed reset completed. Run pnpm stripe:catalog:verify --env uat --apply to create fresh Products/Prices and sync D1.',
  ].join('\n');
}

async function applyResetPlan(stripe: ResetStripeClient, plan: ResetPlan): Promise<void> {
  for (const priceId of plan.pricesToDeactivate) {
    await stripe.prices.update(
      priceId,
      { active: false },
      { idempotencyKey: `blackbox-sandbox-catalog-reset-price-${priceId}` },
    );
  }

  for (const productId of plan.productsToDeactivate) {
    await stripe.products.update(
      productId,
      { active: false },
      { idempotencyKey: `blackbox-sandbox-catalog-reset-product-${productId}` },
    );
  }
}

function isRepoOwnedSandboxPrice(
  price: Stripe.Price,
  expectedLookupKeys: Set<string>,
  expectedIdentities: Array<Record<string, string>>,
  expectedLegacyProductNames: Set<string>,
): boolean {
  const priceMetadata = normalizeMetadata(price.metadata);
  const product = typeof price.product === 'object' && !price.product.deleted ? price.product : null;
  const productMetadata = normalizeMetadata(product?.metadata);

  return (
    Boolean(price.lookup_key && expectedLookupKeys.has(price.lookup_key)) ||
    hasExpectedMetadata(priceMetadata, expectedIdentities) ||
    hasExpectedMetadata(productMetadata, expectedIdentities) ||
    Boolean(product && isLegacyRepoOwnedSandboxProduct(product, expectedLegacyProductNames))
  );
}

function isLegacyRepoOwnedSandboxProduct(product: Stripe.Product, expectedLegacyProductNames: Set<string>): boolean {
  return Boolean(product.name && expectedLegacyProductNames.has(normalizeLegacyProductName(product.name)));
}

function createLegacySandboxProductNames(productProjectionName: string): string[] {
  const displayName = productProjectionName.replace(/^BlackBox Records - /, '').trim();
  const [title, optionLabel] = displayName.split(' - ').map((part) => part.trim());
  const titleOnly = title || displayName;

  return [
    displayName,
    titleOnly,
    `BlackBox UAT - ${displayName}`,
    `BlackBox UAT - ${titleOnly}`,
    optionLabel ? `${titleOnly} - ${optionLabel}` : titleOnly,
  ].map(normalizeLegacyProductName);
}

function normalizeLegacyProductName(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function hasExpectedMetadata(
  candidate: Record<string, string>,
  expectedIdentities: Array<Record<string, string>>,
): boolean {
  return expectedIdentities.some((expected) =>
    Object.entries(expected).every(([key, value]) => candidate[key] === String(value)),
  );
}

function normalizeMetadata(metadata: Stripe.Metadata | null | undefined): Record<string, string> {
  return Object.fromEntries(Object.entries(metadata ?? {}).map(([key, value]) => [key, String(value)]));
}

function extractProductId(product: string | Stripe.Product | Stripe.DeletedProduct): string | null {
  return typeof product === 'string' ? product : (product.id ?? null);
}

function toStoreItemOptionRecord(contract: StripeCatalogStoreItemContract): StoreItemOptionRecord {
  return {
    sourceId: contract.sourceId,
    sourceKind: contract.sourceKind,
    storeItemSlug: parseStoreItemSlug(contract.storeItemSlug),
    variantId: parseVariantId(contract.variantId),
  };
}

function parseEnvironment(value: string | undefined): StripeCatalogEnvironment {
  if (value === 'uat') {
    return value;
  }

  if (value === 'sandbox') {
    return 'uat';
  }

  if (value === 'local' || value === 'prd') {
    return value;
  }

  throw new Error(`Unsupported Stripe catalog environment: ${value ?? '(missing)'}`);
}

function createLegacySandboxLookupKey(storeItem: Pick<StoreItemOptionRecord, 'storeItemSlug' | 'variantId'>): string {
  return `blackbox:sandbox:${storeItem.storeItemSlug}:${storeItem.variantId}`;
}

async function main(): Promise<void> {
  const options = parseStripeCatalogResetSandboxArgs(process.argv.slice(2));
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!stripeSecretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY for Stripe sandbox catalog reset.');
  }

  const stripe = new Stripe(stripeSecretKey);
  const contracts = await loadStripeCatalogStoreItemContracts();
  const plan = await resetStripeSandboxCatalog(options, stripe, contracts);
  console.log(formatStripeCatalogResetSandboxReport(plan, options));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
