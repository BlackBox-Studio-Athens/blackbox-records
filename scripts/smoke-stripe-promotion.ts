import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  currentDesiredCatalogEntries,
  type DesiredCatalogEnvironment,
  type DesiredCatalogEntry,
} from '../apps/backend/src/application/commerce/catalog-sync/desired-catalog-state';
import { parseProductEnvironmentCliTarget, type ProductEnvironment } from '../apps/backend/src/env';
import {
  createRunId as createSmokeRunId,
  createSmokeEvidencePath,
  createSmokeScenarioArtifactDir,
  createSmokeSummaryPath,
  parseRequiredValue as parseSmokeRequiredValue,
  redactSensitiveSmokeText,
  writeJsonFile,
} from './smoke-core';

export type PromotionSmokeEnvironment = Extract<ProductEnvironment, 'UAT' | 'PRD'>;
export type PromotionSmokeScenarioSelection = 'all' | 'checkout_surface' | 'paid';
export type PromotionSmokeStatus = 'failed' | 'not_configured' | 'passed';

export type PromotionSmokeOptions = {
  environment: PromotionSmokeEnvironment;
  evidenceDir: string;
  scenario: PromotionSmokeScenarioSelection;
  siteUrl: string;
  workerUrl: string;
};

export type PromotionSmokeEvidence = {
  amountMinor: number | null;
  checkoutUrlHost: string | null;
  currencyCode: string | null;
  environment: PromotionSmokeEnvironment;
  generatedAt: string;
  paymentMethodTypes: string[];
  productImageMatched: boolean | null;
  productName: string | null;
  productNameMatched: boolean | null;
  scenario: Exclude<PromotionSmokeScenarioSelection, 'all'>;
  sessionId: string | null;
  shippingAddressCollection: boolean | null;
  siteUrl: string;
  status: PromotionSmokeStatus;
  storeItemSlug: string;
  summary: string;
  variantId: string;
  workerUrl: string;
};

type StripeCheckoutSessionResponse = {
  amount_total?: number | null;
  currency?: string | null;
  id?: string | null;
  payment_method_types?: string[] | null;
  shipping_address_collection?: unknown;
};

type StripeCheckoutLineItemsResponse = {
  data?: Array<{
    price?: {
      product?: {
        images?: string[] | null;
        name?: string | null;
      } | null;
    } | null;
  }>;
};

const defaultPrdSiteUrl = 'https://blackbox-records-web.pages.dev';
const defaultPrdWorkerUrl = 'https://blackbox-records-backend-prd.blackboxrecordsathens.workers.dev';

export function parsePromotionSmokeArgs(args: string[]): PromotionSmokeOptions {
  const options: PromotionSmokeOptions = {
    environment: 'PRD',
    evidenceDir: path.join('.codex-artifacts', 'smoke', 'prd', 'stripe-promotion'),
    scenario: 'checkout_surface',
    siteUrl: defaultPrdSiteUrl,
    workerUrl: defaultPrdWorkerUrl,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: pnpm smoke:stripe-promotion -- --env prd --scenario checkout_surface|paid|all [--site-url <url>] [--worker-url <url>] [--evidence-dir <dir>]',
      );
      process.exit(0);
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

    if (arg === '--scenario') {
      options.scenario = parseScenario(args[index + 1]);
      index += 1;
      continue;
    }

    if (arg?.startsWith('--scenario=')) {
      options.scenario = parseScenario(arg.slice('--scenario='.length));
      continue;
    }

    if (arg === '--site-url') {
      options.siteUrl = parseRequiredValue('--site-url', args[index + 1]);
      index += 1;
      continue;
    }

    if (arg?.startsWith('--site-url=')) {
      options.siteUrl = parseRequiredValue('--site-url', arg.slice('--site-url='.length));
      continue;
    }

    if (arg === '--worker-url') {
      options.workerUrl = parseRequiredValue('--worker-url', args[index + 1]);
      index += 1;
      continue;
    }

    if (arg?.startsWith('--worker-url=')) {
      options.workerUrl = parseRequiredValue('--worker-url', arg.slice('--worker-url='.length));
      continue;
    }

    if (arg === '--evidence-dir') {
      options.evidenceDir = parseRequiredValue('--evidence-dir', args[index + 1]);
      index += 1;
      continue;
    }

    if (arg?.startsWith('--evidence-dir=')) {
      options.evidenceDir = parseRequiredValue('--evidence-dir', arg.slice('--evidence-dir='.length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

export function selectPromotionSmokeEntry(
  entries: readonly DesiredCatalogEntry[],
  environment: PromotionSmokeEnvironment,
): DesiredCatalogEntry {
  const entry = entries.find(
    (candidate) =>
      candidate.availability === 'published' &&
      candidate.targetEnvironments.includes(toDesiredCatalogEnvironment(environment)),
  );

  if (!entry) {
    throw new Error(`No published ${environment} Desired Catalog entry is available for promotion smoke.`);
  }

  return entry;
}

export async function runPromotionSmoke(options: PromotionSmokeOptions): Promise<PromotionSmokeEvidence[]> {
  const entry = selectPromotionSmokeEntry(currentDesiredCatalogEntries, options.environment);
  const scenarios = options.scenario === 'all' ? (['checkout_surface', 'paid'] as const) : [options.scenario];
  const evidence: PromotionSmokeEvidence[] = [];
  const runId = createSmokeRunId();
  const runArtifactDir = path.join(options.evidenceDir, runId);
  const evidencePaths: string[] = [];

  for (const scenario of scenarios) {
    const result =
      scenario === 'paid'
        ? createPaidSmokePolicyEvidence(options, entry)
        : await runCheckoutSurfaceSmoke(options, entry);
    const evidencePath = writePromotionSmokeEvidence(runArtifactDir, result);
    evidencePaths.push(evidencePath);
    evidence.push(result);
  }

  writeJsonFile(createSmokeSummaryPath(runArtifactDir), {
    evidencePaths,
    environment: options.environment,
    failedScenarioCount: evidence.filter((item) => item.status === 'failed').length,
    generatedAt: new Date().toISOString(),
    passedScenarioCount: evidence.filter((item) => item.status !== 'failed').length,
    runId,
    scenarioNames: scenarios,
    siteUrl: options.siteUrl,
    status: evidence.some((item) => item.status === 'failed') ? 'failed' : 'passed',
    suite: 'stripe-promotion',
    workerUrl: options.workerUrl,
  });

  return evidence;
}

export function createPaidSmokePolicyEvidence(
  options: PromotionSmokeOptions,
  entry: DesiredCatalogEntry,
): PromotionSmokeEvidence {
  const paidSmokeConfigured =
    (process.env.PRD_PAID_SMOKE_POLICY ?? process.env.PRODUCTION_PAID_SMOKE_POLICY) === 'enabled';

  return {
    amountMinor: null,
    checkoutUrlHost: null,
    currencyCode: null,
    environment: options.environment,
    generatedAt: new Date().toISOString(),
    paymentMethodTypes: [],
    productImageMatched: null,
    productName: null,
    productNameMatched: null,
    scenario: 'paid',
    sessionId: null,
    shippingAddressCollection: null,
    siteUrl: options.siteUrl,
    status: paidSmokeConfigured ? 'failed' : 'not_configured',
    storeItemSlug: entry.storeItemSlug,
    summary: paidSmokeConfigured
      ? 'PRD paid smoke policy is enabled, but no live paid smoke implementation is configured in this runner.'
      : 'PRD paid smoke policy is not configured; no live payment was attempted.',
    variantId: entry.variantId,
    workerUrl: options.workerUrl,
  };
}

async function runCheckoutSurfaceSmoke(
  options: PromotionSmokeOptions,
  entry: DesiredCatalogEntry,
): Promise<PromotionSmokeEvidence> {
  if (options.environment !== 'PRD') {
    throw new Error('Promotion checkout_surface smoke is currently reserved for PRD live no-payment proof.');
  }

  const startCheckoutResponse = await startCheckoutSession(options.workerUrl, entry);
  const checkoutUrl = new URL(startCheckoutResponse.checkoutUrl);
  const checkoutSessionId = parseCheckoutSessionId(checkoutUrl.href);
  const session = await retrieveStripeCheckoutSession(checkoutSessionId);
  const lineItems = await retrieveStripeCheckoutLineItems(checkoutSessionId);
  const product = lineItems.data?.[0]?.price?.product ?? null;
  const desiredPrice = entry.desiredPrice;
  const fixedDesiredPrice = desiredPrice?.kind === 'fixed' ? desiredPrice : null;
  const productNameMatched = product?.name === entry.productProjection.name;
  const productImageMatched = Boolean(
    entry.productProjection.imageUrls.length &&
    product?.images?.some((imageUrl) => entry.productProjection.imageUrls.includes(imageUrl)),
  );
  const amountMatched = fixedDesiredPrice ? session.amount_total === fixedDesiredPrice.amountMinor : false;
  const currencyMatched = desiredPrice ? session.currency?.toUpperCase() === desiredPrice.currencyCode : false;
  const shippingAddressCollection = Boolean(session.shipping_address_collection);
  const hasPaymentMethods = Boolean(session.payment_method_types?.length);
  const passed =
    amountMatched &&
    currencyMatched &&
    productNameMatched &&
    productImageMatched &&
    shippingAddressCollection &&
    hasPaymentMethods;

  return {
    amountMinor: session.amount_total ?? null,
    checkoutUrlHost: checkoutUrl.host,
    currencyCode: session.currency?.toUpperCase() ?? null,
    environment: options.environment,
    generatedAt: new Date().toISOString(),
    paymentMethodTypes: session.payment_method_types ?? [],
    productImageMatched,
    productName: product?.name ?? null,
    productNameMatched,
    scenario: 'checkout_surface',
    sessionId: redactStripeObjectId(session.id ?? checkoutSessionId),
    shippingAddressCollection,
    siteUrl: options.siteUrl,
    status: passed ? 'passed' : 'failed',
    storeItemSlug: entry.storeItemSlug,
    summary: passed
      ? 'Live hosted Checkout surface matched Desired Catalog State before payment submission.'
      : 'Live hosted Checkout surface did not match Desired Catalog State before payment submission.',
    variantId: entry.variantId,
    workerUrl: options.workerUrl,
  };
}

async function startCheckoutSession(workerUrl: string, entry: DesiredCatalogEntry): Promise<{ checkoutUrl: string }> {
  const response = await fetch(new URL('/api/checkout/sessions', workerUrl), {
    body: JSON.stringify({
      lines: [
        {
          quantity: 1,
          storeItemSlug: entry.storeItemSlug,
          variantId: entry.variantId,
        },
      ],
    }),
    headers: {
      'content-type': 'application/json',
      origin: defaultPrdSiteUrl,
    },
    method: 'POST',
  });
  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`PRD checkout start failed (${response.status}): ${bodyText}`);
  }

  const payload = JSON.parse(bodyText) as { checkoutUrl?: unknown };

  if (typeof payload.checkoutUrl !== 'string' || !payload.checkoutUrl.trim()) {
    throw new Error('PRD checkout start did not return checkoutUrl.');
  }

  return { checkoutUrl: payload.checkoutUrl };
}

async function retrieveStripeCheckoutSession(sessionId: string): Promise<StripeCheckoutSessionResponse> {
  return requestStripeApi(`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
}

async function retrieveStripeCheckoutLineItems(sessionId: string): Promise<StripeCheckoutLineItemsResponse> {
  return requestStripeApi(
    `/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=1&expand[]=data.price.product`,
  );
}

async function requestStripeApi<T>(requestPath: string): Promise<T> {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is required for promotion smoke.');
  }

  const response = await fetch(`https://api.stripe.com${requestPath}`, {
    headers: {
      authorization: `Bearer ${secretKey}`,
    },
  });
  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`Stripe API request failed (${response.status}): ${redactSensitiveValues(bodyText)}`);
  }

  return JSON.parse(bodyText) as T;
}

export function parseCheckoutSessionId(checkoutUrl: string): string {
  const match = /\bcs_(?:test|live)_[A-Za-z0-9_]+/.exec(checkoutUrl);

  if (!match) {
    throw new Error('Could not parse Checkout Session ID from checkoutUrl.');
  }

  return match[0];
}

function writePromotionSmokeEvidence(runArtifactDir: string, evidence: PromotionSmokeEvidence): string {
  const scenarioArtifactDir = createSmokeScenarioArtifactDir(runArtifactDir, evidence.scenario);
  const evidencePath = createSmokeEvidencePath(scenarioArtifactDir);
  writeJsonFile(evidencePath, evidence);

  return evidencePath;
}

function parseEnvironment(value: string | undefined): PromotionSmokeEnvironment {
  try {
    const productEnvironment = parseProductEnvironmentCliTarget(value);

    if (productEnvironment === 'UAT' || productEnvironment === 'PRD') {
      return productEnvironment;
    }
  } catch {
    // Fall through to the stable CLI error below.
  }

  throw new Error('--env must be prd or uat. Legacy platform aliases accepted: sandbox, production.');
}

function toDesiredCatalogEnvironment(environment: PromotionSmokeEnvironment): DesiredCatalogEnvironment {
  return environment === 'PRD' ? 'prd' : 'uat';
}

function parseScenario(value: string | undefined): PromotionSmokeScenarioSelection {
  if (value === 'checkout_surface' || value === 'paid' || value === 'all') {
    return value;
  }

  throw new Error('--scenario must be checkout_surface, paid, or all.');
}

function parseRequiredValue(name: string, value: string | undefined): string {
  return parseSmokeRequiredValue(name, value);
}

function redactStripeObjectId(value: string): string {
  const trimmed = value.trim();
  const underscoreIndex = trimmed.indexOf('_');

  if (underscoreIndex === -1) {
    return '[redacted]';
  }

  return `${trimmed.slice(0, underscoreIndex + 1)}...${trimmed.slice(-4)}`;
}

function redactSensitiveValues(value: string): string {
  return redactSensitiveSmokeText(value).replace(/\b(?:cs|price|prod)_(?:test|live)?_?[A-Za-z0-9_]+\b/g, (match) =>
    redactStripeObjectId(match),
  );
}

async function main(): Promise<void> {
  const options = parsePromotionSmokeArgs(process.argv.slice(2));
  const evidence = await runPromotionSmoke(options);
  const failedEvidence = evidence.filter((item) => item.status === 'failed');

  if (failedEvidence.length) {
    console.error(JSON.stringify(failedEvidence, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(evidence, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(redactSensitiveValues(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  });
}
