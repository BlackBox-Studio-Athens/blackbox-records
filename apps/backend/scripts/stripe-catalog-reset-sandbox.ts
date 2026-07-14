import process from 'node:process';
import { pathToFileURL } from 'node:url';

import Stripe from 'stripe';

import {
  createStripeCatalogMutationContext,
  redactStripeObjectId,
  type StripeCatalogEnvironment,
} from '../src/application/commerce/catalog-sync';
import {
  loadStripeCatalogStoreItemContracts,
  type StripeCatalogStoreItemContract,
} from '../../../scripts/stripe-catalog-contract';

type ResetMode = 'confirm' | 'dry-run';

const DEFAULT_PRICE_ARCHIVE_ERROR = 'This price cannot be archived because it is the default price of its product.';

type ResetOptions = {
  environment: StripeCatalogEnvironment;
  mode: ResetMode;
};

type ResetPlan = {
  productsToDeactivate: string[];
  pricesToReset: string[];
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
    await applyResetPlan(options.environment, stripe, plan);
  }

  return plan;
}

export async function createResetPlan(
  environment: StripeCatalogEnvironment,
  stripe: ResetStripeClient,
  contracts: StripeCatalogStoreItemContract[],
): Promise<ResetPlan> {
  const expectedLegacyProductNames = new Set(
    contracts.flatMap((contract) => createLegacySandboxProductNames(contract.productProjection.name)),
  );
  const [activePrices, inactivePrices, products] = await Promise.all([
    listAllStripeObjects((startingAfter) =>
      stripe.prices.list({
        active: true,
        expand: ['data.product'],
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      }),
    ),
    listAllStripeObjects((startingAfter) =>
      stripe.prices.list({
        active: false,
        expand: ['data.product'],
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      }),
    ),
    listAllStripeObjects((startingAfter) =>
      stripe.products.list({
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      }),
    ),
  ]);

  const selectedPrices = [
    ...new Map([...activePrices, ...inactivePrices].map((price) => [price.id, price])).values(),
  ].filter((price) => isRepoOwnedSandboxPrice(price, environment, expectedLegacyProductNames));
  const pricesToReset = selectedPrices.map((price) => price.id).sort();
  const productIdsFromPrices = new Set(
    selectedPrices.map((price) => extractProductId(price.product)).filter((value): value is string => Boolean(value)),
  );
  const productsToDeactivate = [
    ...new Set([
      ...productIdsFromPrices,
      ...products
        .filter(
          (product) =>
            hasRepoOwnedCatalogMetadata(normalizeMetadata(product.metadata), environment) ||
            hasLegacyRepoOwnedSandboxProductName(product, expectedLegacyProductNames),
        )
        .map((product) => product.id),
    ]),
  ].sort();

  return {
    pricesToReset,
    productsToDeactivate,
  };
}

async function listAllStripeObjects<T extends { id: string }>(
  listPage: (startingAfter?: string) => Promise<{ data: T[]; has_more: boolean }>,
): Promise<T[]> {
  const objects: T[] = [];
  let startingAfter: string | undefined;

  do {
    const page = await listPage(startingAfter);
    objects.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;

    if (page.has_more && !startingAfter) {
      throw new Error('Stripe catalog reset pagination did not return a cursor.');
    }
  } while (startingAfter);

  return objects;
}

export function formatStripeCatalogResetSandboxReport(plan: ResetPlan, options: ResetOptions): string {
  return [
    'Stripe sandbox catalog reset report',
    `Mode: ${options.mode}`,
    `Prices to reset: ${plan.pricesToReset.length}`,
    ...plan.pricesToReset.map((priceId) => `- ${redactStripeObjectId(priceId)}`),
    `Products to deactivate: ${plan.productsToDeactivate.length}`,
    ...plan.productsToDeactivate.map((productId) => `- ${redactStripeObjectId(productId)}`),
    options.mode === 'dry-run'
      ? 'Dry-run only. Rerun with --confirm to reset these sandbox objects.'
      : 'Confirmed reset completed. Run pnpm stripe:catalog:verify --env uat --apply --promotion-run-id <stable-run-id> to create fresh Products/Prices and sync D1.',
  ].join('\n');
}

async function applyResetPlan(
  environment: StripeCatalogEnvironment,
  stripe: ResetStripeClient,
  plan: ResetPlan,
): Promise<void> {
  for (const productId of plan.productsToDeactivate) {
    const context = createStripeCatalogMutationContext({
      action: 'reset_product',
      environment,
      identity: 'product',
      requestShape: {
        active: false,
        metadata: '',
        productId,
      },
      variantId: 'catalog-reset',
    });

    await stripe.products.update(
      productId,
      { active: false, metadata: '' },
      { idempotencyKey: context.idempotencyKey },
    );
  }

  for (const priceId of plan.pricesToReset) {
    const lookupKey = createResetPriceLookupKey(environment, priceId);
    const context = createStripeCatalogMutationContext({
      action: 'reset_price',
      environment,
      identity: 'price',
      requestShape: {
        active: false,
        lookupKey,
        metadata: '',
        priceId,
      },
      variantId: 'catalog-reset',
    });

    try {
      await stripe.prices.update(
        priceId,
        { active: false, lookup_key: lookupKey, metadata: '' },
        { idempotencyKey: context.idempotencyKey },
      );
    } catch (error: unknown) {
      if (!isDefaultPriceArchiveError(error)) {
        throw error;
      }

      await detachDefaultPrice(environment, stripe, priceId);
    }
  }
}

async function detachDefaultPrice(
  environment: StripeCatalogEnvironment,
  stripe: ResetStripeClient,
  priceId: string,
): Promise<void> {
  const lookupKey = createResetPriceLookupKey(environment, priceId);
  const context = createStripeCatalogMutationContext({
    action: 'detach_default_price',
    environment,
    identity: 'price',
    requestShape: {
      lookupKey,
      metadata: '',
      priceId,
    },
    variantId: 'catalog-reset',
  });

  await stripe.prices.update(
    priceId,
    { lookup_key: lookupKey, metadata: '' },
    { idempotencyKey: context.idempotencyKey },
  );
}

function isDefaultPriceArchiveError(error: unknown): boolean {
  return error instanceof Error && error.message === DEFAULT_PRICE_ARCHIVE_ERROR;
}

function isRepoOwnedSandboxPrice(
  price: Stripe.Price,
  environment: StripeCatalogEnvironment,
  expectedLegacyProductNames: Set<string>,
): boolean {
  const priceMetadata = normalizeMetadata(price.metadata);
  const product = typeof price.product === 'object' && !price.product.deleted ? price.product : null;
  const productMetadata = normalizeMetadata(product?.metadata);

  return (
    Boolean(price.lookup_key && price.lookup_key.startsWith(`blackbox:${environment}:`)) ||
    Boolean(price.lookup_key && isLegacySandboxLookupKey(price.lookup_key)) ||
    hasRepoOwnedCatalogMetadata(priceMetadata, environment) ||
    hasRepoOwnedCatalogMetadata(productMetadata, environment) ||
    Boolean(product && hasLegacyRepoOwnedSandboxProductName(product, expectedLegacyProductNames))
  );
}

function hasLegacyRepoOwnedSandboxProductName(
  product: Stripe.Product,
  expectedLegacyProductNames: Set<string>,
): boolean {
  return Boolean(product.name && expectedLegacyProductNames.has(normalizeLegacyProductName(product.name)));
}

function isLegacySandboxLookupKey(value: string): boolean {
  return value.startsWith('blackbox:sandbox:');
}

function hasRepoOwnedCatalogMetadata(metadata: Record<string, string>, environment: StripeCatalogEnvironment): boolean {
  return (
    (metadata.appEnv === environment || (environment === 'uat' && metadata.appEnv === 'sandbox')) &&
    Boolean(metadata.sourceId && metadata.sourceKind && metadata.storeItemSlug && metadata.variantId)
  );
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

function normalizeMetadata(metadata: Stripe.Metadata | null | undefined): Record<string, string> {
  return Object.fromEntries(Object.entries(metadata ?? {}).map(([key, value]) => [key, String(value)]));
}

function extractProductId(product: string | Stripe.Product | Stripe.DeletedProduct): string | null {
  return typeof product === 'string' ? product : (product.id ?? null);
}

function createResetPriceLookupKey(environment: StripeCatalogEnvironment, priceId: string): string {
  return `blackbox-reset:${environment}:${priceId}`;
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
