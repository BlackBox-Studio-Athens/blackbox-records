import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL, fileURLToPath } from 'node:url';

import { chromium, type Browser, type Frame, type Page } from 'playwright';

import { currentCatalogProductProjectionEntries } from '../apps/backend/src/application/commerce/catalog-sync/catalog-product-projections';

export type StripeSandboxSmokeScenarioName =
  | 'checkout_surface'
  | 'card_declined'
  | 'expired_card'
  | 'happy_path_paid'
  | 'incorrect_cvc'
  | 'insufficient_funds'
  | 'processing_error'
  | 'three_d_secure';

export type StripeSandboxSmokeScenarioSelection = StripeSandboxSmokeScenarioName | 'all';
export type StripeSandboxScreenshotMode = 'always' | 'never' | 'on-failure';

export type StripeSandboxSmokeScenario = {
  cardNumber?: string;
  checkoutSurfaceExpectation?: StripeCheckoutSurfaceExpectation;
  description: string;
  expectedOrderStatus: 'not_paid_or_pending' | 'not_submitted' | 'paid';
  expectedStripeErrorPattern?: RegExp;
  name: StripeSandboxSmokeScenarioName;
  stripeFormExpectation: string;
};

export type StripeCheckoutSurfaceExpectation = {
  expectedAmountText: string;
  expectedPaymentMethodLabels: string[];
  expectedSessionProjection: StripeCheckoutSessionProjectionExpectation;
  minimumDynamicPaymentMethodCount: number;
};

export type StripeCheckoutSessionProjectionExpectation = {
  expectedAmountMinor: number;
  expectedCurrencyCode: string;
  expectedProductImageUrl: string;
  expectedProductName: string;
};

export type StripeCheckoutSurfaceObservation = {
  amountTextPresent: boolean;
  dynamicPaymentMethodLabels: string[];
  expectedAmountText: string;
  expectedPaymentMethodLabels: string[];
  issues: string[];
  observedAmountTexts: string[];
  paymentMethodLabels: string[];
};

export type StripeCheckoutSessionProjectionObservation = {
  amountMatches: boolean;
  currencyMatches: boolean;
  expectedAmountMinor: number;
  expectedCurrencyCode: string;
  expectedProductImageUrl: string;
  expectedProductName: string;
  issues: string[];
  observedAmountMinor: number | null;
  observedCurrencyCode: string | null;
  observedProductImageUrls: string[];
  observedProductName: string | null;
  productImageMatches: boolean;
  productNameMatches: boolean;
};

export type StripeSandboxSmokeOptions = {
  debug: boolean;
  declineConcurrency: number;
  expectedPaymentMethodLabels: string[];
  fieldActionTimeoutMs: number;
  headed: boolean;
  scenarioSelection: StripeSandboxSmokeScenarioSelection;
  screenshots: StripeSandboxScreenshotMode;
  siteUrl: string;
  timeoutMs: number;
  trace: boolean;
  workerUrl: string;
};

export type LocalCheckoutOrderRow = {
  checkoutSessionId: string;
  createdAt: string;
  id: string;
  needsReviewAt: string | null;
  notPaidAt: string | null;
  paidAt: string | null;
  shippingLockerCountryCode: string | null;
  shippingLockerId: string | null;
  shippingLockerNameOrLabel: string | null;
  status: 'needs_review' | 'not_paid' | 'paid' | 'pending_payment';
  stripePaymentIntentId: string | null;
  updatedAt: string;
};

export type StripeSandboxSmokePreflightInput = {
  gitignoreText: string | null;
  minimumSmokeOnlineQuantity: number;
  options: Pick<StripeSandboxSmokeOptions, 'siteUrl' | 'workerUrl'>;
  remoteD1Summary: RemoteD1ReadinessSummary | null;
  scenarios: readonly StripeSandboxSmokeScenario[];
  secretNames: string[];
  siteReady: boolean;
  workerReady: boolean;
  wranglerReady: boolean;
};

export type RemoteD1ReadinessSummary = {
  availableStockCount: number;
  checkoutOrderCount: number;
  realStripeMappingCount: number;
  smokeVariantCanBuy: boolean;
  smokeVariantOnlineQuantity: number;
};

export type StripeSandboxScenarioAutomationResult = {
  checkoutSessionProjection: StripeCheckoutSessionProjectionObservation | null;
  checkoutSurface: StripeCheckoutSurfaceObservation | null;
  checkoutSessionId: string | null;
  durations: StripeSandboxSmokeDurations;
  finalUrl: string;
  observedStripeUi: string;
  order: LocalCheckoutOrderRow | null;
  screenshotPath: string | null;
};

export type StripeSandboxSmokeEvidence = {
  checkoutSessionProjection: StripeCheckoutSessionProjectionObservation | null;
  checkoutSurface: StripeCheckoutSurfaceObservation | null;
  checkoutPageUrl: string;
  durations: StripeSandboxSmokeDurations;
  finalUrl: string;
  generatedAt: string;
  observedStripeUi: string;
  order: ReturnType<typeof sanitizeOrderForReport> | null;
  passed: boolean;
  runId: string;
  scenario: {
    expectedOrderStatus: StripeSandboxSmokeScenario['expectedOrderStatus'];
    name: StripeSandboxSmokeScenarioName;
  };
  screenshotPath: string | null;
  siteUrl: string;
  tracePath: string | null;
  workerUrl: string;
};

export type StripeSandboxScenarioGroups = {
  checkoutSurfaceScenarios: StripeSandboxSmokeScenario[];
  declineScenarios: StripeSandboxSmokeScenario[];
  paidScenarios: StripeSandboxSmokeScenario[];
};

export type StripeSandboxSmokeDurations = {
  checkoutOpenMs: number;
  evidenceWriteMs: number;
  remoteOrderPollMs: number;
  stripeFormFillMs: number;
  stripeOutcomeMs: number;
  stripeSubmitMs: number;
  totalMs: number;
};

type StripeSandboxSmokeDurationKey = Exclude<keyof StripeSandboxSmokeDurations, 'evidenceWriteMs' | 'totalMs'>;

type D1JsonResult = Array<{
  results?: unknown;
  success?: boolean;
}>;

type StripeCheckoutLineItemsApiResponse = {
  data?: Array<{
    amount_total?: number | null;
    currency?: string | null;
    price?: {
      product?: StripeProductApiObject | string | null;
    } | null;
  }>;
};

type StripeProductApiObject = {
  images?: string[] | null;
  name?: string | null;
};

type PublicStoreOfferResponse = {
  canCheckout?: boolean;
  price?: {
    display?: string;
  } | null;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const backendDir = path.join(rootDir, 'apps', 'backend');
const nodeRequire = createRequire(import.meta.url);
const wranglerBin = nodeRequire.resolve('wrangler/bin/wrangler.js', { paths: [backendDir] });
const artifactRootDir = path.join(rootDir, '.codex-artifacts', 'stripe-sandbox-smoke');
const defaultSiteUrl = 'https://blackbox-records-web.pages.dev';
const defaultWorkerUrl = 'https://blackbox-records-backend-sandbox.blackboxrecordsathens.workers.dev';
const smokeStoreItemSlug = 'disintegration-black-vinyl-lp';
const smokeVariantId = 'variant_disintegration-black-vinyl-lp_standard';
const smokeCatalogProjectionEntry = currentCatalogProductProjectionEntries.find(
  (entry) => entry.storeItemSlug === smokeStoreItemSlug && entry.variantId === smokeVariantId,
);
const allScenarioNames: readonly StripeSandboxSmokeScenarioName[] = [
  'checkout_surface',
  'happy_path_paid',
  'three_d_secure',
  'card_declined',
  'insufficient_funds',
  'expired_card',
  'incorrect_cvc',
  'processing_error',
];

const sandboxFormDefaults = {
  addressLine1: '1 Stripe Test Street',
  city: 'Athens',
  country: 'Greece',
  cvc: '123',
  expiry: '12 / 34',
  name: 'BlackBox Sandbox Customer',
  phone: '6912345678',
  postalCode: '10557',
};

function requireSmokeCatalogProjectionEntry() {
  const expectedSandboxPrice = smokeCatalogProjectionEntry?.expectedSandboxPrice;

  if (!smokeCatalogProjectionEntry || !expectedSandboxPrice) {
    throw new Error(`Missing checkout-eligible Product Projection for ${smokeStoreItemSlug} / ${smokeVariantId}.`);
  }

  return { ...smokeCatalogProjectionEntry, expectedSandboxPrice };
}

const disintegrationCheckoutSurfaceExpectation: StripeCheckoutSurfaceExpectation = {
  expectedAmountText: 'Worker Store Offer price',
  expectedPaymentMethodLabels: [],
  expectedSessionProjection: {
    expectedAmountMinor: requireSmokeCatalogProjectionEntry().expectedSandboxPrice.amountMinor,
    expectedCurrencyCode: requireSmokeCatalogProjectionEntry().expectedSandboxPrice.currencyCode,
    expectedProductImageUrl: requireSmokeCatalogProjectionEntry().productProjection.imageUrls[0] ?? '',
    expectedProductName: requireSmokeCatalogProjectionEntry().productProjection.name,
  },
  minimumDynamicPaymentMethodCount: 1,
};

export const STRIPE_TEST_CARD_DOCS_URL = 'https://docs.stripe.com/testing#cards';
export const STRIPE_SANDBOX_SMOKE_SCENARIOS: Record<StripeSandboxSmokeScenarioName, StripeSandboxSmokeScenario> = {
  checkout_surface: {
    checkoutSurfaceExpectation: disintegrationCheckoutSurfaceExpectation,
    description: 'Hosted Checkout amount and dynamic payment method surface, without submitting payment.',
    expectedOrderStatus: 'not_submitted',
    name: 'checkout_surface',
    stripeFormExpectation:
      'Stripe should show the storefront amount and at least one dynamic payment option before payment is submitted.',
  },
  happy_path_paid: {
    cardNumber: '4242 4242 4242 4242',
    checkoutSurfaceExpectation: disintegrationCheckoutSurfaceExpectation,
    description: 'Immediate successful card payment.',
    expectedOrderStatus: 'paid',
    name: 'happy_path_paid',
    stripeFormExpectation:
      'Stripe should accept the card, return to the checkout return page, and emit a paid webhook.',
  },
  three_d_secure: {
    cardNumber: '4000 0000 0000 3220',
    description: '3D Secure authentication is required for every transaction.',
    expectedOrderStatus: 'paid',
    name: 'three_d_secure',
    stripeFormExpectation:
      'Stripe should open a 3D Secure challenge. The runner completes it and expects paid order evidence.',
  },
  card_declined: {
    cardNumber: '4000 0000 0000 0002',
    description: 'Generic card decline.',
    expectedOrderStatus: 'not_paid_or_pending',
    expectedStripeErrorPattern: /card (?:was )?declined|declined/i,
    name: 'card_declined',
    stripeFormExpectation: 'Stripe should show a declined-card error and remain on hosted Checkout.',
  },
  insufficient_funds: {
    cardNumber: '4000 0000 0000 9995',
    description: 'Insufficient funds decline.',
    expectedOrderStatus: 'not_paid_or_pending',
    expectedStripeErrorPattern: /insufficient funds|declined/i,
    name: 'insufficient_funds',
    stripeFormExpectation: 'Stripe should show an insufficient-funds error and remain on hosted Checkout.',
  },
  expired_card: {
    cardNumber: '4000 0000 0000 0069',
    description: 'Expired card decline.',
    expectedOrderStatus: 'not_paid_or_pending',
    expectedStripeErrorPattern: /expired|declined/i,
    name: 'expired_card',
    stripeFormExpectation: 'Stripe should show an expired-card error and remain on hosted Checkout.',
  },
  incorrect_cvc: {
    cardNumber: '4000 0000 0000 0127',
    description: 'Incorrect CVC decline.',
    expectedOrderStatus: 'not_paid_or_pending',
    expectedStripeErrorPattern: /security code|cvc|declined/i,
    name: 'incorrect_cvc',
    stripeFormExpectation: 'Stripe should show an incorrect-CVC error and remain on hosted Checkout.',
  },
  processing_error: {
    cardNumber: '4000 0000 0000 0119',
    description: 'Processing error decline.',
    expectedOrderStatus: 'not_paid_or_pending',
    expectedStripeErrorPattern: /processing error|try again|declined/i,
    name: 'processing_error',
    stripeFormExpectation: 'Stripe should show a processing-error decline and remain on hosted Checkout.',
  },
};

export function parseStripeSandboxSmokeArgs(args: string[]): StripeSandboxSmokeOptions {
  const options: StripeSandboxSmokeOptions = {
    debug: false,
    declineConcurrency: 3,
    expectedPaymentMethodLabels: parsePaymentMethodLabelList(process.env.STRIPE_SANDBOX_EXPECTED_PAYMENT_LABELS ?? ''),
    fieldActionTimeoutMs: 2_000,
    headed: false,
    scenarioSelection: 'all',
    screenshots: 'on-failure',
    siteUrl: defaultSiteUrl,
    timeoutMs: 120_000,
    trace: false,
    workerUrl: defaultWorkerUrl,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--headed') {
      options.headed = true;
      continue;
    }

    if (arg === '--debug') {
      options.debug = true;
      options.headed = true;
      options.trace = true;
      continue;
    }

    if (arg === '--trace') {
      options.trace = true;
      continue;
    }

    if (arg === '--decline-concurrency') {
      const value = args[index + 1];
      index += 1;
      options.declineConcurrency = parsePositiveInteger(value, '--decline-concurrency');
      continue;
    }

    if (arg?.startsWith('--decline-concurrency=')) {
      options.declineConcurrency = parsePositiveInteger(
        arg.slice('--decline-concurrency='.length),
        '--decline-concurrency',
      );
      continue;
    }

    if (arg === '--field-action-timeout-ms') {
      const value = args[index + 1];
      index += 1;
      options.fieldActionTimeoutMs = parsePositiveInteger(value, '--field-action-timeout-ms');
      continue;
    }

    if (arg === '--expected-payment-label') {
      const value = args[index + 1];
      index += 1;
      options.expectedPaymentMethodLabels.push(parsePaymentMethodLabel(value, '--expected-payment-label'));
      continue;
    }

    if (arg?.startsWith('--expected-payment-label=')) {
      options.expectedPaymentMethodLabels.push(
        parsePaymentMethodLabel(arg.slice('--expected-payment-label='.length), '--expected-payment-label'),
      );
      continue;
    }

    if (arg === '--expected-payment-labels') {
      const value = args[index + 1];
      index += 1;
      options.expectedPaymentMethodLabels = parsePaymentMethodLabelList(value, '--expected-payment-labels');
      continue;
    }

    if (arg?.startsWith('--expected-payment-labels=')) {
      options.expectedPaymentMethodLabels = parsePaymentMethodLabelList(
        arg.slice('--expected-payment-labels='.length),
        '--expected-payment-labels',
      );
      continue;
    }

    if (arg?.startsWith('--field-action-timeout-ms=')) {
      options.fieldActionTimeoutMs = parsePositiveInteger(
        arg.slice('--field-action-timeout-ms='.length),
        '--field-action-timeout-ms',
      );
      continue;
    }

    if (arg === '--screenshots') {
      const value = args[index + 1];
      index += 1;
      options.screenshots = parseScreenshotMode(value);
      continue;
    }

    if (arg?.startsWith('--screenshots=')) {
      options.screenshots = parseScreenshotMode(arg.slice('--screenshots='.length));
      continue;
    }

    if (arg === '--use-running-stack' || arg === '--manual-timeout-ms') {
      if (arg === '--manual-timeout-ms') {
        index += 1;
      }

      console.warn(`${arg} is ignored; smoke:stripe-sandbox now targets the deployed sandbox only.`);
      continue;
    }

    if (arg?.startsWith('--manual-timeout-ms=')) {
      console.warn('--manual-timeout-ms is ignored; use --timeout-ms for browser automation timeouts.');
      continue;
    }

    if (arg === '--timeout-ms') {
      const value = args[index + 1];
      index += 1;
      options.timeoutMs = parsePositiveInteger(value, '--timeout-ms');
      continue;
    }

    if (arg?.startsWith('--timeout-ms=')) {
      options.timeoutMs = parsePositiveInteger(arg.slice('--timeout-ms='.length), '--timeout-ms');
      continue;
    }

    if (arg === '--scenario') {
      const value = args[index + 1];
      index += 1;
      options.scenarioSelection = parseScenarioSelection(value);
      continue;
    }

    if (arg?.startsWith('--scenario=')) {
      options.scenarioSelection = parseScenarioSelection(arg.slice('--scenario='.length));
      continue;
    }

    if (arg === '--site-url') {
      const value = args[index + 1];
      index += 1;
      options.siteUrl = normalizeBaseUrl(value, '--site-url');
      continue;
    }

    if (arg?.startsWith('--site-url=')) {
      options.siteUrl = normalizeBaseUrl(arg.slice('--site-url='.length), '--site-url');
      continue;
    }

    if (arg === '--worker-url') {
      const value = args[index + 1];
      index += 1;
      options.workerUrl = normalizeBaseUrl(value, '--worker-url');
      continue;
    }

    if (arg?.startsWith('--worker-url=')) {
      options.workerUrl = normalizeBaseUrl(arg.slice('--worker-url='.length), '--worker-url');
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

export function resolveSelectedStripeSandboxScenarios(
  selection: StripeSandboxSmokeScenarioSelection,
): StripeSandboxSmokeScenario[] {
  const scenarioNames = selection === 'all' ? allScenarioNames : [selection];

  return scenarioNames.map((name) => STRIPE_SANDBOX_SMOKE_SCENARIOS[name]);
}

export function groupStripeSandboxSmokeScenarios(
  scenarios: readonly StripeSandboxSmokeScenario[],
): StripeSandboxScenarioGroups {
  return {
    checkoutSurfaceScenarios: scenarios.filter((scenario) => scenario.expectedOrderStatus === 'not_submitted'),
    declineScenarios: scenarios.filter((scenario) => scenario.expectedOrderStatus === 'not_paid_or_pending'),
    paidScenarios: scenarios.filter((scenario) => scenario.expectedOrderStatus === 'paid'),
  };
}

export function createCheckoutPageUrl(siteUrl: string, storeItemSlug = smokeStoreItemSlug): string {
  return `${normalizeBaseUrl(siteUrl, 'siteUrl')}/store/${encodeURIComponent(storeItemSlug)}/checkout/`;
}

export function createScenarioEmail(runId: string, scenarioName: string): string {
  return `sandbox-checkout+${runId}-${scenarioName}@blackbox.example`;
}

export function createRemoteD1ReadinessSql(): string {
  return [
    'SELECT',
    '  (SELECT COUNT(*) FROM "VariantStripeMapping" WHERE "stripePriceId" LIKE \'price_%\' AND "stripePriceId" NOT LIKE \'price_mock_%\') AS "realStripeMappingCount",',
    '  (SELECT COUNT(*) FROM "Stock" WHERE "onlineQuantity" > 0) AS "availableStockCount",',
    '  (SELECT COALESCE(MAX("onlineQuantity"), 0) FROM "Stock" WHERE "variantId" = \'' +
      smokeVariantId +
      '\') AS "smokeVariantOnlineQuantity",',
    '  (SELECT COALESCE(MAX("canBuy"), 0) FROM "ItemAvailability" WHERE "variantId" = \'' +
      smokeVariantId +
      '\') AS "smokeVariantCanBuy",',
    '  (SELECT COUNT(*) FROM "CheckoutOrder") AS "checkoutOrderCount";',
  ].join('\n');
}

export function createSandboxSmokeStockTopUpSql(minimumQuantity: number): string {
  if (!Number.isInteger(minimumQuantity) || minimumQuantity < 1) {
    throw new Error('Sandbox smoke stock top-up quantity must be a positive integer.');
  }

  return [
    'UPDATE "Stock"',
    'SET',
    `  "quantity" = CASE WHEN "quantity" < ${minimumQuantity} THEN ${minimumQuantity} ELSE "quantity" END,`,
    `  "onlineQuantity" = CASE WHEN "onlineQuantity" < ${minimumQuantity} THEN ${minimumQuantity} ELSE "onlineQuantity" END,`,
    '  "updatedAt" = CURRENT_TIMESTAMP',
    `WHERE "variantId" = '${smokeVariantId}';`,
    '',
    'UPDATE "ItemAvailability"',
    'SET',
    '  "status" = \'available\',',
    '  "canBuy" = 1,',
    '  "updatedAt" = CURRENT_TIMESTAMP',
    `WHERE "variantId" = '${smokeVariantId}';`,
  ].join('\n');
}

export function createCheckoutOrderBySessionSql(checkoutSessionId: string): string {
  return [
    'SELECT',
    '  "id",',
    '  "checkoutSessionId",',
    '  "stripePaymentIntentId",',
    '  "shippingLockerId",',
    '  "shippingLockerCountryCode",',
    '  "shippingLockerNameOrLabel",',
    '  "status",',
    '  "createdAt",',
    '  "updatedAt",',
    '  "paidAt",',
    '  "notPaidAt",',
    '  "needsReviewAt"',
    'FROM "CheckoutOrder"',
    `WHERE "checkoutSessionId" = '${escapeSqlLiteral(checkoutSessionId)}'`,
    'LIMIT 1;',
  ].join('\n');
}

export function parseD1CheckoutOrderRows(jsonText: string): LocalCheckoutOrderRow[] {
  const parsed = JSON.parse(jsonText) as D1JsonResult;
  const firstResult = parsed[0];

  if (!firstResult?.success || !Array.isArray(firstResult.results)) {
    throw new Error('Wrangler did not return a successful D1 result set.');
  }

  return firstResult.results.map(toCheckoutOrderRow);
}

export function parseRemoteD1ReadinessSummary(jsonText: string): RemoteD1ReadinessSummary {
  const parsed = JSON.parse(jsonText) as D1JsonResult;
  const firstResult = parsed[0];
  const row = Array.isArray(firstResult?.results) ? firstResult.results[0] : null;

  if (!firstResult?.success || !row || typeof row !== 'object') {
    throw new Error('Wrangler did not return sandbox D1 readiness rows.');
  }

  return {
    availableStockCount: readNumberField(row, 'availableStockCount'),
    checkoutOrderCount: readNumberField(row, 'checkoutOrderCount'),
    realStripeMappingCount: readNumberField(row, 'realStripeMappingCount'),
    smokeVariantCanBuy: readNumberField(row, 'smokeVariantCanBuy') === 1,
    smokeVariantOnlineQuantity: readNumberField(row, 'smokeVariantOnlineQuantity'),
  };
}

export function checkStripeSandboxSmokePreflight(input: StripeSandboxSmokePreflightInput): string[] {
  const issues: string[] = [];
  const requiresPaidWebhook = input.scenarios.some((scenario) => scenario.expectedOrderStatus === 'paid');

  if (!input.siteReady) {
    issues.push(`Sandbox site is not reachable: ${input.options.siteUrl}`);
  }

  if (!input.workerReady) {
    issues.push(`Sandbox Worker is not reachable: ${input.options.workerUrl}`);
  }

  if (!input.wranglerReady) {
    issues.push('Wrangler is not authenticated for sandbox D1/secret-name inspection.');
  }

  if (!input.gitignoreText?.includes('.codex-artifacts/')) {
    issues.push('.codex-artifacts/ must remain gitignored before writing sandbox smoke evidence.');
  }

  if (!input.secretNames.includes('STRIPE_SECRET_KEY')) {
    issues.push(
      'Sandbox Worker secret STRIPE_SECRET_KEY is not configured. Set it from apps/backend with: pnpm exec wrangler secret put STRIPE_SECRET_KEY --env sandbox',
    );
  }

  if (requiresPaidWebhook && !input.secretNames.includes('STRIPE_WEBHOOK_SECRET')) {
    issues.push(
      'Sandbox Worker secret STRIPE_WEBHOOK_SECRET is not configured. Set it from apps/backend with: pnpm exec wrangler secret put STRIPE_WEBHOOK_SECRET --env sandbox',
    );
  }

  if (!input.remoteD1Summary) {
    issues.push('Sandbox D1 readiness could not be inspected.');
  } else {
    if (input.remoteD1Summary.realStripeMappingCount < 1) {
      issues.push('Sandbox D1 has no real Stripe price mappings.');
    }

    if (input.remoteD1Summary.availableStockCount < 1) {
      issues.push('Sandbox D1 has no positive online stock rows.');
    }

    if (!input.remoteD1Summary.smokeVariantCanBuy) {
      issues.push(`Sandbox D1 smoke item ${smokeVariantId} is not marked buyable.`);
    }

    if (input.remoteD1Summary.smokeVariantOnlineQuantity < input.minimumSmokeOnlineQuantity) {
      issues.push(
        `Sandbox D1 smoke item ${smokeVariantId} needs at least ${input.minimumSmokeOnlineQuantity} online stock for the selected paid scenario(s). Current online stock: ${input.remoteD1Summary.smokeVariantOnlineQuantity}.`,
      );
    }
  }

  return issues;
}

export function formatStripeSandboxSmokeRunHeader(input: {
  options: StripeSandboxSmokeOptions;
  runId: string;
  scenarios: StripeSandboxSmokeScenario[];
}): string {
  return [
    '',
    '============================================================',
    'Stripe sandbox checkout Playwright smoke',
    '============================================================',
    `Run id: ${input.runId}`,
    `Site: ${input.options.siteUrl}`,
    `Worker: ${input.options.workerUrl}`,
    `Checkout: ${createCheckoutPageUrl(input.options.siteUrl)}`,
    `Scenarios: ${input.scenarios.map((scenario) => scenario.name).join(', ')}`,
    `Headed: ${input.options.headed ? 'yes' : 'no'}`,
    `Trace: ${input.options.trace ? 'yes' : 'no'}`,
    `Screenshots: ${input.options.screenshots}`,
    `Expected payment labels: ${
      input.options.expectedPaymentMethodLabels.length ? input.options.expectedPaymentMethodLabels.join(', ') : 'none'
    }`,
    `Field action timeout: ${input.options.fieldActionTimeoutMs}ms`,
    `Decline concurrency: ${input.options.declineConcurrency}`,
    '',
    'Required outside this process for paid scenarios:',
    `- Persistent Stripe Dashboard/Workbench webhook endpoint: ${input.options.workerUrl}/api/stripe/webhooks`,
    '- The sandbox Worker STRIPE_WEBHOOK_SECRET must match the persistent endpoint signing secret.',
    '- Run pnpm stripe:webhooks:verify --env sandbox before accepting deployed-sandbox webhook readiness.',
    '- stripe listen is local/temporary diagnostic tooling only; it is not persistent readiness evidence.',
    '- Real sandbox Stripe Price mappings and positive online stock must exist in sandbox D1.',
    '',
    `Stripe test card reference: ${STRIPE_TEST_CARD_DOCS_URL}`,
    '============================================================',
    '',
  ].join('\n');
}

export function formatStripeSandboxSmokePreflightSummary(input: {
  issues: string[];
  remoteD1Summary: RemoteD1ReadinessSummary | null;
  secretNames: string[];
  siteReady: boolean;
  workerReady: boolean;
  wranglerReady: boolean;
}): string {
  return [
    '',
    'Preflight summary:',
    `- site reachable: ${input.siteReady ? 'yes' : 'no'}`,
    `- worker reachable: ${input.workerReady ? 'yes' : 'no'}`,
    `- wrangler ready: ${input.wranglerReady ? 'yes' : 'no'}`,
    `- sandbox secret names: ${input.secretNames.length ? input.secretNames.join(', ') : 'none'}`,
    `- real Stripe mappings: ${input.remoteD1Summary?.realStripeMappingCount ?? 'unknown'}`,
    `- positive online stock rows: ${input.remoteD1Summary?.availableStockCount ?? 'unknown'}`,
    `- smoke item online stock: ${input.remoteD1Summary?.smokeVariantOnlineQuantity ?? 'unknown'}`,
    `- smoke item buyable: ${input.remoteD1Summary ? (input.remoteD1Summary.smokeVariantCanBuy ? 'yes' : 'no') : 'unknown'}`,
    `- existing checkout orders: ${input.remoteD1Summary?.checkoutOrderCount ?? 'unknown'}`,
    `- preflight result: ${input.issues.length ? `${input.issues.length} issue(s)` : 'OK'}`,
    ...input.issues.map((issue) => `  - ${issue}`),
    '',
  ].join('\n');
}

export function didScenarioPass(
  order: LocalCheckoutOrderRow | null,
  scenario: StripeSandboxSmokeScenario,
  observedStripeUi: string,
  checkoutSurface: StripeCheckoutSurfaceObservation | null = null,
  checkoutSessionProjection: StripeCheckoutSessionProjectionObservation | null = null,
): boolean {
  if (checkoutSurface?.issues.length) {
    return false;
  }

  if (checkoutSessionProjection?.issues.length) {
    return false;
  }

  if (scenario.checkoutSurfaceExpectation && !checkoutSessionProjection) {
    return false;
  }

  if (scenario.expectedOrderStatus === 'not_submitted') {
    return Boolean(checkoutSurface);
  }

  if (scenario.expectedOrderStatus === 'paid') {
    return order?.status === 'paid';
  }

  return Boolean(scenario.expectedStripeErrorPattern?.test(observedStripeUi)) && order?.status !== 'paid';
}

export function scrubSensitiveStripeSmokeText(text: string): string {
  return text
    .replace(/sk_test_[A-Za-z0-9_]+/g, '[redacted_stripe_secret_key]')
    .replace(/sk_live_[A-Za-z0-9_]+/g, '[redacted_stripe_secret_key]')
    .replace(/whsec_[A-Za-z0-9_]+/g, '[redacted_stripe_webhook_secret]')
    .replace(/(cs_(?:test|live)_[A-Za-z0-9_]*?_secret_)[A-Za-z0-9_]+/g, '$1[redacted]')
    .replace(/(seti_(?:test|live)_[A-Za-z0-9_]*?_secret_)[A-Za-z0-9_]+/g, '$1[redacted]');
}

export function buildStripeSandboxSmokeEvidence(input: {
  artifactPaths: { tracePath: string | null };
  checkoutPageUrl: string;
  options: Pick<StripeSandboxSmokeOptions, 'siteUrl' | 'workerUrl'>;
  result: StripeSandboxScenarioAutomationResult;
  runId: string;
  scenario: StripeSandboxSmokeScenario;
}): StripeSandboxSmokeEvidence {
  const passed = didScenarioPass(
    input.result.order,
    input.scenario,
    input.result.observedStripeUi,
    input.result.checkoutSurface,
    input.result.checkoutSessionProjection,
  );

  return {
    checkoutSessionProjection: input.result.checkoutSessionProjection,
    checkoutSurface: input.result.checkoutSurface,
    checkoutPageUrl: input.checkoutPageUrl,
    durations: input.result.durations,
    finalUrl: input.result.finalUrl,
    generatedAt: new Date().toISOString(),
    observedStripeUi: input.result.observedStripeUi,
    order: input.result.order ? sanitizeOrderForReport(input.result.order) : null,
    passed,
    runId: input.runId,
    scenario: {
      expectedOrderStatus: input.scenario.expectedOrderStatus,
      name: input.scenario.name,
    },
    screenshotPath: input.result.screenshotPath,
    siteUrl: input.options.siteUrl,
    tracePath: input.artifactPaths.tracePath,
    workerUrl: input.options.workerUrl,
  };
}

async function main() {
  const options = parseStripeSandboxSmokeArgs(process.argv.slice(2));
  const scenarios = resolveSelectedStripeSandboxScenarios(options.scenarioSelection);
  const runId = createRunId();
  const runArtifactDir = path.join(artifactRootDir, runId);
  const minimumSmokeOnlineQuantity = calculateMinimumSmokeOnlineQuantity(scenarios);

  mkdirSync(runArtifactDir, { recursive: true });
  console.log(formatStripeSandboxSmokeRunHeader({ options, runId, scenarios }));
  ensureSandboxSmokeStock(minimumSmokeOnlineQuantity);

  const preflight = await runPreflight(options);
  const preflightIssues = checkStripeSandboxSmokePreflight({
    ...preflight,
    minimumSmokeOnlineQuantity,
    options,
    scenarios,
  });

  console.log(formatStripeSandboxSmokePreflightSummary({ ...preflight, issues: preflightIssues }));

  if (preflightIssues.length) {
    throw new Error('Stripe sandbox smoke preflight failed. Fix the listed issue(s), then rerun.');
  }

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: !options.headed,
      slowMo: options.debug ? 150 : 0,
    });

    const scenarioGroups = groupStripeSandboxSmokeScenarios(scenarios);

    for (const scenario of scenarioGroups.checkoutSurfaceScenarios) {
      await runScenarioAndWriteEvidence({ browser, options, runArtifactDir, runId, scenario });
    }

    for (const scenario of scenarioGroups.paidScenarios) {
      await runScenarioAndWriteEvidence({ browser, options, runArtifactDir, runId, scenario });
    }

    if (scenarioGroups.declineScenarios.length) {
      console.log(
        `Running ${scenarioGroups.declineScenarios.length} decline scenario(s) with concurrency ${options.declineConcurrency}.`,
      );
      await runInBatches(scenarioGroups.declineScenarios, options.declineConcurrency, async (scenario) =>
        runScenarioAndWriteEvidence({ browser: browser!, options, runArtifactDir, runId, scenario }),
      );
    }
  } finally {
    await browser?.close();
  }
}

async function runScenarioAndWriteEvidence(input: {
  browser: Browser;
  options: StripeSandboxSmokeOptions;
  runArtifactDir: string;
  runId: string;
  scenario: StripeSandboxSmokeScenario;
}): Promise<void> {
  console.log(`Running ${input.scenario.name}: ${input.scenario.description}`);

  const checkoutPageUrl = createCheckoutPageUrl(input.options.siteUrl);
  const scenarioArtifactDir = path.join(input.runArtifactDir, input.scenario.name);
  mkdirSync(scenarioArtifactDir, { recursive: true });
  const scenario = input.scenario.checkoutSurfaceExpectation
    ? {
        ...input.scenario,
        checkoutSurfaceExpectation: await resolveCheckoutSurfaceExpectation(
          input.options.workerUrl,
          input.scenario.checkoutSurfaceExpectation,
          input.options.expectedPaymentMethodLabels,
        ),
      }
    : input.scenario;

  const result = await runScenarioWithBrowser({
    browser: input.browser,
    checkoutPageUrl,
    options: input.options,
    runId: input.runId,
    scenario,
    scenarioArtifactDir,
  });
  const tracePath = input.options.trace ? path.join(scenarioArtifactDir, 'trace.zip') : null;

  const evidence = buildStripeSandboxSmokeEvidence({
    artifactPaths: { tracePath },
    checkoutPageUrl,
    options: input.options,
    result,
    runId: input.runId,
    scenario,
  });
  const evidencePath = path.join(scenarioArtifactDir, 'evidence.json');
  const evidenceWriteStartedAt = Date.now();

  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  evidence.durations.evidenceWriteMs = Date.now() - evidenceWriteStartedAt;
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);

  console.log(
    [
      `Scenario ${scenario.name}: ${evidence.passed ? 'PASSED' : 'FAILED'} in ${formatDuration(
        evidence.durations.totalMs,
      )}`,
      `- checkout session: ${result.checkoutSessionId ?? 'not observed'}`,
      `- checkout surface: ${
        result.checkoutSurface
          ? result.checkoutSurface.issues.length
            ? `FAILED (${result.checkoutSurface.issues.join(' ')})`
            : `OK (${formatCheckoutSurfaceLabelSummary(result.checkoutSurface)})`
          : 'not checked'
      }`,
      `- checkout session projection: ${
        result.checkoutSessionProjection
          ? result.checkoutSessionProjection.issues.length
            ? `FAILED (${result.checkoutSessionProjection.issues.join(' ')})`
            : `OK (${formatCheckoutSessionProjectionSummary(result.checkoutSessionProjection)})`
          : 'not checked'
      }`,
      `- order status: ${result.order?.status ?? 'none'}`,
      `- screenshot: ${result.screenshotPath ?? 'skipped'}`,
      `- evidence: ${evidencePath}`,
    ].join('\n'),
  );

  if (!evidence.passed) {
    throw new Error(createScenarioFailureMessage(scenario, result));
  }
}

export function countPaidStripeSandboxScenarios(scenarios: readonly StripeSandboxSmokeScenario[]): number {
  return scenarios.filter((scenario) => scenario.expectedOrderStatus === 'paid').length;
}

export function calculateMinimumSmokeOnlineQuantity(scenarios: readonly StripeSandboxSmokeScenario[]): number {
  const paidScenarioCount = countPaidStripeSandboxScenarios(scenarios);
  const hasDeclineScenario = scenarios.some((scenario) => scenario.expectedOrderStatus === 'not_paid_or_pending');

  return Math.max(1, paidScenarioCount + (hasDeclineScenario ? 1 : 0));
}

export function createEmptyStripeSandboxSmokeDurations(): StripeSandboxSmokeDurations {
  return {
    checkoutOpenMs: 0,
    evidenceWriteMs: 0,
    remoteOrderPollMs: 0,
    stripeFormFillMs: 0,
    stripeOutcomeMs: 0,
    stripeSubmitMs: 0,
    totalMs: 0,
  };
}

export async function runInBatches<T>(
  items: readonly T[],
  concurrency: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  for (let index = 0; index < items.length; index += concurrency) {
    await Promise.all(items.slice(index, index + concurrency).map((item) => task(item)));
  }
}

function ensureSandboxSmokeStock(minimumQuantity: number): void {
  if (minimumQuantity < 1) {
    return;
  }

  console.log(
    `Ensuring sandbox smoke stock for ${smokeVariantId}: at least ${minimumQuantity} online unit(s), without deleting or resetting D1.`,
  );
  runRemoteD1Sql(createSandboxSmokeStockTopUpSql(minimumQuantity));
}

async function runPreflight(
  options: StripeSandboxSmokeOptions,
): Promise<Omit<StripeSandboxSmokePreflightInput, 'minimumSmokeOnlineQuantity' | 'options' | 'scenarios'>> {
  const [siteReady, workerReady] = await Promise.all([
    isHttpReady(options.siteUrl),
    isHttpReady(`${options.workerUrl}/api/store/capabilities`),
  ]);
  const secretNamesResult = readSandboxSecretNames();
  const d1SummaryResult = readRemoteD1ReadinessSummary();

  return {
    gitignoreText: readOptionalFile('.gitignore'),
    remoteD1Summary: d1SummaryResult,
    secretNames: secretNamesResult,
    siteReady,
    workerReady,
    wranglerReady: secretNamesResult.length > 0 || d1SummaryResult !== null,
  };
}

async function runScenarioWithBrowser(input: {
  browser: Browser;
  checkoutPageUrl: string;
  options: StripeSandboxSmokeOptions;
  runId: string;
  scenario: StripeSandboxSmokeScenario;
  scenarioArtifactDir: string;
}): Promise<StripeSandboxScenarioAutomationResult> {
  const scenarioStartedAt = Date.now();
  const durations = createEmptyStripeSandboxSmokeDurations();
  const context = await input.browser.newContext({
    locale: 'en-US',
    viewport: { height: 900, width: 1280 },
  });
  const tracePath = input.options.trace ? path.join(input.scenarioArtifactDir, 'trace.zip') : null;

  if (tracePath) {
    await context.tracing.start({ screenshots: true, snapshots: true });
  }

  const page = await context.newPage();
  page.setDefaultTimeout(input.options.timeoutMs);

  try {
    await timeStripeSandboxStep(input.scenario.name, 'checkout open', durations, 'checkoutOpenMs', async () => {
      await page.goto(input.checkoutPageUrl, { waitUntil: 'domcontentloaded' });
      await Promise.all([
        page.waitForURL(/checkout\.stripe\.com/, { timeout: input.options.timeoutMs, waitUntil: 'commit' }),
        page.getByRole('button', { name: /(?:pay securely with|continue to) stripe(?: checkout)?/i }).click(),
      ]);
    });

    const checkoutSessionId = extractCheckoutSessionId(page.url());
    const checkoutSurface = input.scenario.checkoutSurfaceExpectation
      ? await readStripeCheckoutSurface(page, input.scenario.checkoutSurfaceExpectation, input.options.timeoutMs)
      : null;
    const checkoutSessionProjection = input.scenario.checkoutSurfaceExpectation
      ? checkoutSessionId
        ? await readStripeCheckoutSessionProjection(
            checkoutSessionId,
            input.scenario.checkoutSurfaceExpectation.expectedSessionProjection,
          )
        : createStripeCheckoutSessionProjectionObservation(
            null,
            input.scenario.checkoutSurfaceExpectation.expectedSessionProjection,
            ['Checkout Session ID was not observed in the hosted Checkout URL.'],
          )
      : null;

    if (
      checkoutSurface?.issues.length ||
      checkoutSessionProjection?.issues.length ||
      input.scenario.expectedOrderStatus === 'not_submitted'
    ) {
      const screenshotPath =
        input.options.screenshots === 'always' ? path.join(input.scenarioArtifactDir, 'final.png') : null;

      if (screenshotPath) {
        await page.screenshot({ fullPage: true, path: screenshotPath });
      }

      durations.totalMs = Date.now() - scenarioStartedAt;

      return {
        checkoutSessionProjection,
        checkoutSurface,
        checkoutSessionId,
        durations,
        finalUrl: page.url(),
        observedStripeUi: await page.locator('body').innerText({ timeout: input.options.timeoutMs }),
        order: null,
        screenshotPath,
      };
    }

    await timeStripeSandboxStep(input.scenario.name, 'Stripe form fill', durations, 'stripeFormFillMs', async () => {
      await fillStripeHostedCheckout(
        page,
        input.scenario,
        createScenarioEmail(input.runId, input.scenario.name),
        input.options.fieldActionTimeoutMs,
      );
    });
    await timeStripeSandboxStep(input.scenario.name, 'Stripe submit', durations, 'stripeSubmitMs', async () => {
      await clickStripePayButton(page);
    });

    const observedStripeUi = await timeStripeSandboxStep(
      input.scenario.name,
      'Stripe outcome',
      durations,
      'stripeOutcomeMs',
      async () => observeStripeOutcome(page, input.scenario, input.options),
    );
    const finalUrl = page.url();
    const resolvedCheckoutSessionId = extractCheckoutSessionId(finalUrl) ?? checkoutSessionId;
    const order = resolvedCheckoutSessionId
      ? await timeStripeSandboxStep(input.scenario.name, 'remote D1 poll', durations, 'remoteOrderPollMs', async () =>
          waitForRemoteOrderAfterCheckout(resolvedCheckoutSessionId, input.scenario, input.options.timeoutMs),
        )
      : null;
    const screenshotPath =
      input.options.screenshots === 'always' ? path.join(input.scenarioArtifactDir, 'final.png') : null;

    if (screenshotPath) {
      await page.screenshot({ fullPage: true, path: screenshotPath });
    }

    durations.totalMs = Date.now() - scenarioStartedAt;

    return {
      checkoutSessionProjection,
      checkoutSurface,
      checkoutSessionId: resolvedCheckoutSessionId,
      durations,
      finalUrl,
      observedStripeUi,
      order,
      screenshotPath,
    };
  } catch (error) {
    const failureScreenshotPath =
      input.options.screenshots === 'never' ? null : path.join(input.scenarioArtifactDir, 'failure.png');

    try {
      if (failureScreenshotPath) {
        await page.screenshot({ fullPage: true, path: failureScreenshotPath });
        console.error(`- ${input.scenario.name}: failure screenshot: ${failureScreenshotPath}`);
      }
      console.error(`- ${input.scenario.name}: browser URL at failure: ${scrubSensitiveStripeSmokeText(page.url())}`);
      if (input.options.screenshots !== 'never') {
        console.error(
          `- ${input.scenario.name}: visible text at failure: ${truncateForConsole(
            scrubSensitiveStripeSmokeText(await page.locator('body').innerText({ timeout: 2_000 })),
          )}`,
        );
      }
    } catch (screenshotError) {
      console.error(`- ${input.scenario.name}: failed to capture failure screenshot: ${String(screenshotError)}`);
    }

    throw error;
  } finally {
    if (tracePath) {
      await context.tracing.stop({ path: tracePath });
    }

    await context.close();
  }
}

async function readStripeCheckoutSurface(
  page: Page,
  expectation: StripeCheckoutSurfaceExpectation,
  timeoutMs: number,
): Promise<StripeCheckoutSurfaceObservation> {
  await page.waitForFunction(
    () => {
      const text = document.body?.innerText?.trim() ?? '';

      return text.length > 0 && /card information|email|payment method/i.test(text);
    },
    undefined,
    { timeout: timeoutMs },
  );

  const bodyText = await page.locator('body').innerText({ timeout: 10_000 });

  return createStripeCheckoutSurfaceObservation(bodyText, expectation);
}

export async function resolveCheckoutSurfaceExpectation(
  workerUrl: string,
  baseExpectation: StripeCheckoutSurfaceExpectation,
  expectedPaymentMethodLabels: string[],
): Promise<StripeCheckoutSurfaceExpectation> {
  const offer = await readWorkerStoreOffer(workerUrl);

  if (!offer.canCheckout || !offer.price?.display) {
    throw new Error('Worker Store Offer is not checkout-ready for sandbox smoke.');
  }

  return {
    ...baseExpectation,
    expectedAmountText: offer.price.display,
    expectedPaymentMethodLabels,
  };
}

export function createStripeCheckoutSurfaceObservation(
  bodyText: string,
  expectation: StripeCheckoutSurfaceExpectation,
): StripeCheckoutSurfaceObservation {
  const normalizedBodyText = normalizeVisibleStripeText(bodyText);
  const paymentMethodLabels = extractPaymentMethodLabels(normalizedBodyText);
  const dynamicPaymentMethodLabels = extractDynamicPaymentMethodLabels(normalizedBodyText);
  const observedPaymentSurfaceLabels = uniqueStrings([...paymentMethodLabels, ...dynamicPaymentMethodLabels]);
  const observedAmountTexts = extractAmountTexts(normalizedBodyText);
  const amountTextPresent = normalizedBodyText.includes(expectation.expectedAmountText);
  const expectedPaymentMethodLabels = uniqueStrings(
    expectation.expectedPaymentMethodLabels.map(normalizePaymentMethodLabel),
  );
  const missingPaymentMethodLabels = expectedPaymentMethodLabels.filter(
    (expectedLabel) =>
      !observedPaymentSurfaceLabels.some((label) => normalizePaymentMethodLabel(label) === expectedLabel),
  );
  const issues: string[] = [];

  if (!amountTextPresent) {
    issues.push(
      `Expected hosted Checkout amount ${expectation.expectedAmountText}; observed: ${
        observedAmountTexts.length ? observedAmountTexts.join(', ') : 'none'
      }.`,
    );
  }

  if (dynamicPaymentMethodLabels.length < expectation.minimumDynamicPaymentMethodCount) {
    issues.push(
      `Expected at least ${expectation.minimumDynamicPaymentMethodCount} dynamic payment method surface label(s); observed: ${
        observedPaymentSurfaceLabels.length ? observedPaymentSurfaceLabels.join(', ') : 'none'
      }.`,
    );
  }

  if (missingPaymentMethodLabels.length) {
    issues.push(
      `Expected hosted Checkout payment method label(s) ${missingPaymentMethodLabels.join(', ')}; observed: ${
        observedPaymentSurfaceLabels.length ? observedPaymentSurfaceLabels.join(', ') : 'none'
      }.`,
    );
  }

  return {
    amountTextPresent,
    dynamicPaymentMethodLabels,
    expectedAmountText: expectation.expectedAmountText,
    expectedPaymentMethodLabels,
    issues,
    observedAmountTexts,
    paymentMethodLabels,
  };
}

export async function readStripeCheckoutSessionProjection(
  checkoutSessionId: string,
  expectation: StripeCheckoutSessionProjectionExpectation,
  secretKey = process.env.STRIPE_SECRET_KEY ?? '',
): Promise<StripeCheckoutSessionProjectionObservation> {
  const normalizedSecretKey = secretKey.trim();

  if (!normalizedSecretKey) {
    return createStripeCheckoutSessionProjectionObservation(null, expectation, [
      'STRIPE_SECRET_KEY is required to verify hosted Checkout Product Projection through Stripe API.',
    ]);
  }

  const apiBaseUrl = (process.env.STRIPE_API_BASE_URL?.trim() || 'https://api.stripe.com').replace(/\/+$/, '');
  const searchParams = new URLSearchParams({
    limit: '1',
  });
  searchParams.append('expand[]', 'data.price.product');
  const response = await fetch(
    `${apiBaseUrl}/v1/checkout/sessions/${encodeURIComponent(checkoutSessionId)}/line_items?${searchParams}`,
    {
      headers: {
        Authorization: `Bearer ${normalizedSecretKey}`,
      },
    },
  );

  if (!response.ok) {
    const responseText = await response.text();

    return createStripeCheckoutSessionProjectionObservation(null, expectation, [
      `Stripe Checkout Session line item read failed with HTTP ${response.status}: ${scrubSensitiveStripeSmokeText(
        responseText,
      )}`,
    ]);
  }

  const body = (await response.json()) as StripeCheckoutLineItemsApiResponse;
  const lineItem = body.data?.[0] ?? null;
  const product = getExpandedStripeProduct(lineItem?.price?.product ?? null);

  return createStripeCheckoutSessionProjectionObservation(
    lineItem && product
      ? {
          amountMinor: typeof lineItem.amount_total === 'number' ? lineItem.amount_total : null,
          currencyCode: lineItem.currency ?? null,
          productImageUrls: product.images ?? [],
          productName: product.name ?? null,
        }
      : null,
    expectation,
    lineItem && product ? [] : ['Stripe Checkout Session line item Product was not expanded.'],
  );
}

export function createStripeCheckoutSessionProjectionObservation(
  observed: {
    amountMinor: number | null;
    currencyCode: string | null;
    productImageUrls: string[];
    productName: string | null;
  } | null,
  expectation: StripeCheckoutSessionProjectionExpectation,
  extraIssues: string[] = [],
): StripeCheckoutSessionProjectionObservation {
  const observedCurrencyCode = observed?.currencyCode?.toUpperCase() ?? null;
  const expectedCurrencyCode = expectation.expectedCurrencyCode.toUpperCase();
  const observedProductImageUrls = observed?.productImageUrls ?? [];
  const amountMatches = observed?.amountMinor === expectation.expectedAmountMinor;
  const currencyMatches = observedCurrencyCode === expectedCurrencyCode;
  const productNameMatches = observed?.productName === expectation.expectedProductName;
  const productImageMatches = observedProductImageUrls.includes(expectation.expectedProductImageUrl);
  const issues = [...extraIssues];

  if (!amountMatches) {
    issues.push(
      `Expected Checkout Session amount ${expectation.expectedAmountMinor}; observed ${observed?.amountMinor ?? 'none'}.`,
    );
  }

  if (!currencyMatches) {
    issues.push(
      `Expected Checkout Session currency ${expectedCurrencyCode}; observed ${observedCurrencyCode ?? 'none'}.`,
    );
  }

  if (!productNameMatches) {
    issues.push(
      `Expected Checkout Session Product name "${expectation.expectedProductName}"; observed "${
        observed?.productName ?? 'none'
      }".`,
    );
  }

  if (!productImageMatches) {
    issues.push(
      `Expected Checkout Session Product image ${expectation.expectedProductImageUrl}; observed ${
        observedProductImageUrls.length ? observedProductImageUrls.join(', ') : 'none'
      }.`,
    );
  }

  return {
    amountMatches,
    currencyMatches,
    expectedAmountMinor: expectation.expectedAmountMinor,
    expectedCurrencyCode,
    expectedProductImageUrl: expectation.expectedProductImageUrl,
    expectedProductName: expectation.expectedProductName,
    issues,
    observedAmountMinor: observed?.amountMinor ?? null,
    observedCurrencyCode,
    observedProductImageUrls,
    observedProductName: observed?.productName ?? null,
    productImageMatches,
    productNameMatches,
  };
}

function getExpandedStripeProduct(value: StripeProductApiObject | string | null): StripeProductApiObject | null {
  return value && typeof value === 'object' ? value : null;
}

function normalizeVisibleStripeText(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .trim();
}

function extractPaymentMethodLabels(text: string): string[] {
  const lines = createVisibleTextLines(text);
  const paymentMethodIndex = lines.findIndex((line) => /^payment method$/i.test(line));

  if (paymentMethodIndex < 0) {
    return [];
  }

  const terminalIndex = lines.findIndex(
    (line, index) =>
      index > paymentMethodIndex &&
      /^(card information|billing information|billing info is same as shipping|save my information|pay)$/i.test(line),
  );
  const labels = lines.slice(paymentMethodIndex + 1, terminalIndex > paymentMethodIndex ? terminalIndex : undefined);

  return uniqueStrings(
    labels.filter((line) =>
      /^(?:card|link|apple pay|google pay|pay with link|pay with apple pay|pay with google pay)$/i.test(line),
    ),
  );
}

function extractDynamicPaymentMethodLabels(text: string): string[] {
  const labels: string[] = [];

  for (const line of createVisibleTextLines(text)) {
    if (/^(?:apple pay|pay with apple pay)$/i.test(line)) {
      labels.push('Apple Pay');
    }

    if (/^(?:google pay|pay with google pay)$/i.test(line)) {
      labels.push('Google Pay');
    }

    if (/^(?:link|pay with link)$/i.test(line)) {
      labels.push('Link');
    }
  }

  if (/pay securely\b[\s\S]*\blink is accepted\b/i.test(text)) {
    labels.push('Link');
  }

  return uniqueStrings(labels);
}

function normalizePaymentMethodLabel(label: string): string {
  return label.trim().replace(/\s+/g, ' ');
}

function extractAmountTexts(text: string): string[] {
  return uniqueStrings(text.match(/(?:€|CHF|USD|EUR|GBP)\s?\d+(?:[.,]\d{2})?/g) ?? []);
}

function createVisibleTextLines(text: string): string[] {
  return normalizeVisibleStripeText(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

async function fillStripeHostedCheckout(
  page: Page,
  scenario: StripeSandboxSmokeScenario,
  email: string,
  fieldActionTimeoutMs: number,
) {
  if (!scenario.cardNumber) {
    throw new Error(`Scenario ${scenario.name} does not define a Stripe test card number.`);
  }

  await page.locator('input[name="cardNumber"]').waitFor({ state: 'visible' });
  await fillRequiredVisibleSelector(page, 'input[name="email"]', email, fieldActionTimeoutMs);
  await fillRequiredVisibleSelector(page, 'input[name="shippingName"]', sandboxFormDefaults.name, fieldActionTimeoutMs);
  await selectFirstVisibleSelector(
    page,
    'select[name="shippingCountry"]',
    sandboxFormDefaults.country,
    fieldActionTimeoutMs,
  );
  await fillRequiredVisibleSelector(
    page,
    'input[name="shippingAddressLine1"]',
    sandboxFormDefaults.addressLine1,
    fieldActionTimeoutMs,
  );
  await fillRequiredVisibleSelector(
    page,
    'input[name="shippingLocality"]',
    sandboxFormDefaults.city,
    fieldActionTimeoutMs,
  );
  await fillRequiredVisibleSelector(
    page,
    'input[name="shippingPostalCode"]',
    sandboxFormDefaults.postalCode,
    fieldActionTimeoutMs,
  );
  await fillRequiredVisibleSelector(page, 'input[name="phoneNumber"]', sandboxFormDefaults.phone, fieldActionTimeoutMs);
  await fillRequiredVisibleSelector(page, 'input[name="cardNumber"]', scenario.cardNumber, fieldActionTimeoutMs);
  await fillRequiredVisibleSelector(page, 'input[name="cardExpiry"]', sandboxFormDefaults.expiry, fieldActionTimeoutMs);
  await fillRequiredVisibleSelector(page, 'input[name="cardCvc"]', sandboxFormDefaults.cvc, fieldActionTimeoutMs);
  await fillFirstVisible(
    page,
    [/name on card/i, /cardholder name/i, /^name$/i],
    sandboxFormDefaults.name,
    fieldActionTimeoutMs,
  );
}

async function clickStripePayButton(page: Page) {
  const button = page.getByRole('button', { name: /pay|complete|submit/i }).last();
  await button.click();
}

async function observeStripeOutcome(
  page: Page,
  scenario: StripeSandboxSmokeScenario,
  options: StripeSandboxSmokeOptions,
): Promise<string> {
  if (scenario.name === 'three_d_secure') {
    await completeThreeDSChallenge(page, options.timeoutMs);
  }

  if (scenario.expectedOrderStatus === 'paid') {
    await page.waitForURL(/\/checkout\/return\/?\?session_id=/, { timeout: options.timeoutMs, waitUntil: 'commit' });
    return page.locator('body').innerText({ timeout: options.timeoutMs });
  }

  const pattern = scenario.expectedStripeErrorPattern ?? /declined|error/i;
  await page.getByText(pattern).first().waitFor({ state: 'visible', timeout: options.timeoutMs });

  return page.locator('body').innerText({ timeout: options.timeoutMs });
}

async function completeThreeDSChallenge(page: Page, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  let clickedChallenge = false;

  while (Date.now() < deadline) {
    if (/\/checkout\/return\/?\?session_id=/.test(page.url())) {
      return;
    }

    let clickedThisPass = false;

    for (const frame of page.frames()) {
      if (await clickFirstMatchingButton(frame, /^complete$|complete authentication|authorize|authenticate/i)) {
        clickedChallenge = true;
        clickedThisPass = true;
        console.log('- three_d_secure: clicked Stripe 3D Secure challenge in iframe');
        await sleep(1_000);
        break;
      }
    }

    if (clickedThisPass) {
      continue;
    }

    if (await clickFirstMatchingButton(page, /^complete$|complete authentication|authorize|authenticate/i)) {
      clickedChallenge = true;
      console.log('- three_d_secure: clicked Stripe 3D Secure challenge on page');
      await sleep(1_000);
      continue;
    }

    if (clickedChallenge) {
      console.log('- three_d_secure: Stripe 3D Secure challenge completed');
      return;
    }

    await sleep(500);
  }

  throw new Error('Timed out waiting for the Stripe 3D Secure challenge to complete.');
}

async function clickFirstMatchingButton(scope: Page | Frame, name: RegExp): Promise<boolean> {
  const button = scope.getByRole('button', { name }).first();

  try {
    if (await button.isVisible({ timeout: 250 })) {
      await button.click();
      return true;
    }
  } catch {
    // Keep polling through transient frame states.
  }

  return false;
}

async function waitForRemoteOrderAfterCheckout(
  checkoutSessionId: string,
  scenario: StripeSandboxSmokeScenario,
  timeoutMs: number,
): Promise<LocalCheckoutOrderRow | null> {
  const deadline = Date.now() + (scenario.expectedOrderStatus === 'paid' ? Math.max(timeoutMs, 120_000) : 15_000);
  let latest: LocalCheckoutOrderRow | null = null;

  while (Date.now() < deadline) {
    latest = readRemoteCheckoutOrderBySession(checkoutSessionId);

    if (latest && didScenarioPass(latest, scenario, scenario.expectedStripeErrorPattern?.source ?? '')) {
      return latest;
    }

    if (latest && scenario.expectedOrderStatus !== 'paid') {
      return latest;
    }

    await sleep(1_000);
  }

  return latest;
}

function readRemoteCheckoutOrderBySession(checkoutSessionId: string): LocalCheckoutOrderRow | null {
  const rows = parseD1CheckoutOrderRows(runRemoteD1Sql(createCheckoutOrderBySessionSql(checkoutSessionId)));

  return rows[0] ?? null;
}

async function timeStripeSandboxStep<T>(
  scenarioName: StripeSandboxSmokeScenarioName,
  label: string,
  durations: StripeSandboxSmokeDurations,
  key: StripeSandboxSmokeDurationKey,
  task: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();

  try {
    return await task();
  } finally {
    durations[key] = Date.now() - startedAt;
    console.log(`- ${scenarioName}: ${label} ${formatDuration(durations[key])}`);
  }
}

function readRemoteD1ReadinessSummary(): RemoteD1ReadinessSummary | null {
  try {
    return parseRemoteD1ReadinessSummary(runRemoteD1Sql(createRemoteD1ReadinessSql()));
  } catch {
    return null;
  }
}

function readSandboxSecretNames(): string[] {
  const result = runWrangler(['secret', 'list', '--env', 'sandbox']);

  if (result.error || result.status !== 0) {
    return [];
  }

  return parseWranglerSecretNames(result.stdout);
}

function parseWranglerSecretNames(text: string): string[] {
  try {
    const parsed = JSON.parse(text) as unknown;

    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) =>
          entry && typeof entry === 'object' && 'name' in entry ? String((entry as { name: unknown }).name) : null,
        )
        .filter((name): name is string => Boolean(name));
    }
  } catch {
    // Wrangler may return table output depending on version.
  }

  return text.match(/\b[A-Z][A-Z0-9_]+\b/g) ?? [];
}

function runRemoteD1Sql(sql: string): string {
  const result = runWrangler([
    'd1',
    'execute',
    'COMMERCE_DB',
    '--env',
    'sandbox',
    '--remote',
    '--command',
    sql,
    '--json',
  ]);

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      scrubSensitiveStripeSmokeText([result.stderr.trim(), result.stdout.trim()].filter(Boolean).join('\n')),
    );
  }

  return result.stdout;
}

function runWrangler(args: string[]): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [wranglerBin, ...args], {
    cwd: backendDir,
    encoding: 'utf8',
    shell: false,
  });
}

async function isHttpReady(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);

    return response.status < 500;
  } catch {
    return false;
  }
}

async function readWorkerStoreOffer(workerUrl: string): Promise<PublicStoreOfferResponse> {
  const response = await fetch(
    `${normalizeBaseUrl(workerUrl, 'workerUrl')}/api/store/items/${encodeURIComponent(smokeStoreItemSlug)}`,
  );

  if (!response.ok) {
    throw new Error(`Worker Store Offer read failed with HTTP ${response.status}.`);
  }

  return (await response.json()) as PublicStoreOfferResponse;
}

async function fillFirstVisible(
  page: Page,
  labelPatterns: RegExp[],
  value: string,
  fieldActionTimeoutMs: number,
): Promise<boolean> {
  const scopes: Array<Page | Frame> = [page, ...page.frames()];

  for (const pattern of labelPatterns) {
    for (const scope of scopes) {
      const locator = scope.getByLabel(pattern).first();

      try {
        if (await locator.isVisible({ timeout: 250 })) {
          await locator.fill(value, { timeout: fieldActionTimeoutMs });
          return true;
        }
      } catch {
        // Try the next known field shape.
      }
    }
  }

  return false;
}

async function fillRequiredVisibleSelector(
  page: Page,
  selector: string,
  value: string,
  fieldActionTimeoutMs: number,
): Promise<void> {
  if (!(await fillFirstVisibleSelector(page, selector, value, fieldActionTimeoutMs))) {
    throw new Error(`Stripe Checkout field did not become fillable: ${selector}`);
  }
}

export async function fillFirstVisibleSelector(
  page: Page,
  selector: string,
  value: string,
  fieldActionTimeoutMs: number,
): Promise<boolean> {
  const scopes: Array<Page | Frame> = [page, ...page.frames()];

  for (const scope of scopes) {
    const locator = scope.locator(selector).first();

    try {
      if (await locator.isVisible({ timeout: 250 })) {
        await locator.fill(value, { timeout: fieldActionTimeoutMs });
        return true;
      }
    } catch {
      // Try the next frame.
    }
  }

  return false;
}

export async function selectFirstVisibleSelector(
  page: Page,
  selector: string,
  label: string,
  fieldActionTimeoutMs: number,
): Promise<boolean> {
  const scopes: Array<Page | Frame> = [page, ...page.frames()];

  for (const scope of scopes) {
    const locator = scope.locator(selector).first();

    try {
      if (await locator.isVisible({ timeout: 250 })) {
        await locator.selectOption({ label }, { timeout: fieldActionTimeoutMs });
        return true;
      }
    } catch {
      // Try the next frame.
    }
  }

  return false;
}

function extractCheckoutSessionId(value: string): string | null {
  const decoded = decodeURIComponent(value);
  const querySession = new URL(decoded, 'https://example.test').searchParams.get('session_id');

  if (querySession?.startsWith('cs_')) {
    return querySession;
  }

  return /cs_(?:test|live)_[A-Za-z0-9]+/.exec(decoded)?.[0] ?? null;
}

function parseScenarioSelection(value: string | undefined): StripeSandboxSmokeScenarioSelection {
  if (value === 'all') {
    return value;
  }

  if (value && value in STRIPE_SANDBOX_SMOKE_SCENARIOS) {
    return value as StripeSandboxSmokeScenarioName;
  }

  throw new Error(
    `Unknown Stripe sandbox smoke scenario: ${value ?? '<missing>'}. Use one of: ${['all', ...allScenarioNames].join(', ')}.`,
  );
}

function parseScreenshotMode(value: string | undefined): StripeSandboxScreenshotMode {
  if (value === 'always' || value === 'never' || value === 'on-failure') {
    return value;
  }

  throw new Error(`--screenshots must be one of: on-failure, always, never.`);
}

function parsePositiveInteger(value: string | undefined, flag: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }

  return parsed;
}

function parsePaymentMethodLabel(value: string | undefined, flag: string): string {
  const label = normalizePaymentMethodLabel(value ?? '');

  if (!label) {
    throw new Error(`${flag} must include a payment method label.`);
  }

  return label;
}

function parsePaymentMethodLabelList(
  value: string | undefined,
  flag = 'STRIPE_SANDBOX_EXPECTED_PAYMENT_LABELS',
): string[] {
  return uniqueStrings(
    (value ?? '')
      .split(',')
      .map((label) => label.trim())
      .filter(Boolean)
      .map((label) => parsePaymentMethodLabel(label, flag)),
  );
}

function normalizeBaseUrl(value: string | undefined, flag: string): string {
  if (!value?.trim()) {
    throw new Error(`${flag} must be a URL.`);
  }

  const url = new URL(value);
  url.pathname = url.pathname.replace(/\/+$/, '');
  url.search = '';
  url.hash = '';

  return url.toString().replace(/\/$/, '');
}

function readOptionalFile(relativePath: string): string | null {
  const absolutePath = path.join(rootDir, ...relativePath.split('/'));

  if (!existsSync(absolutePath)) {
    return null;
  }

  return readFileSync(absolutePath, 'utf8');
}

function readNumberField(row: object, field: keyof RemoteD1ReadinessSummary): number {
  const value = (row as Record<string, unknown>)[field];

  return typeof value === 'number' ? value : Number(value ?? 0);
}

function toCheckoutOrderRow(value: unknown): LocalCheckoutOrderRow {
  if (!value || typeof value !== 'object') {
    throw new Error('D1 returned a non-object checkout order row.');
  }

  const row = value as Record<string, unknown>;

  return {
    checkoutSessionId: readString(row, 'checkoutSessionId'),
    createdAt: readString(row, 'createdAt'),
    id: readString(row, 'id'),
    needsReviewAt: readNullableString(row, 'needsReviewAt'),
    notPaidAt: readNullableString(row, 'notPaidAt'),
    paidAt: readNullableString(row, 'paidAt'),
    shippingLockerCountryCode: readNullableString(row, 'shippingLockerCountryCode'),
    shippingLockerId: readNullableString(row, 'shippingLockerId'),
    shippingLockerNameOrLabel: readNullableString(row, 'shippingLockerNameOrLabel'),
    status: parseOrderStatus(readString(row, 'status')),
    stripePaymentIntentId: readNullableString(row, 'stripePaymentIntentId'),
    updatedAt: readString(row, 'updatedAt'),
  };
}

function sanitizeOrderForReport(order: LocalCheckoutOrderRow) {
  return {
    checkoutSessionId: order.checkoutSessionId,
    createdAt: order.createdAt,
    needsReviewAt: order.needsReviewAt,
    notPaidAt: order.notPaidAt,
    paidAt: order.paidAt,
    shippingLocker: {
      countryCode: order.shippingLockerCountryCode,
      id: order.shippingLockerId,
      nameOrLabel: order.shippingLockerNameOrLabel,
    },
    status: order.status,
    stripePaymentIntentRecorded: Boolean(order.stripePaymentIntentId),
    updatedAt: order.updatedAt,
  };
}

function readString(row: Record<string, unknown>, key: string): string {
  const value = row[key];

  if (typeof value !== 'string') {
    throw new Error(`D1 checkout order row is missing string field ${key}.`);
  }

  return value;
}

function readNullableString(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`D1 checkout order row has invalid nullable string field ${key}.`);
  }

  return value;
}

function parseOrderStatus(value: string): LocalCheckoutOrderRow['status'] {
  if (value === 'needs_review' || value === 'not_paid' || value === 'paid' || value === 'pending_payment') {
    return value;
  }

  throw new Error(`Unexpected checkout order status: ${value}`);
}

function escapeSqlLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

function createRunId(): string {
  return new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14);
}

function createScenarioFailureMessage(
  scenario: StripeSandboxSmokeScenario,
  result: StripeSandboxScenarioAutomationResult,
): string {
  if (result.checkoutSurface?.issues.length) {
    return [
      `Scenario ${scenario.name} failed hosted Checkout surface expectations.`,
      ...result.checkoutSurface.issues,
      `Observed payment surface: ${formatCheckoutSurfaceLabelSummary(result.checkoutSurface)}.`,
    ].join(' ');
  }

  if (result.checkoutSessionProjection?.issues.length) {
    return [
      `Scenario ${scenario.name} failed hosted Checkout Session Product Projection expectations.`,
      ...result.checkoutSessionProjection.issues,
      `Observed Checkout Session projection: ${formatCheckoutSessionProjectionSummary(result.checkoutSessionProjection)}.`,
    ].join(' ');
  }

  if (scenario.expectedOrderStatus === 'not_submitted') {
    return `Scenario ${scenario.name} did not complete the hosted Checkout surface check.`;
  }

  if (scenario.expectedOrderStatus === 'paid') {
    return [
      `Scenario ${scenario.name} did not produce a paid CheckoutOrder.`,
      `Observed order status: ${result.order?.status ?? 'none'}.`,
      'Likely causes: the persistent Stripe webhook endpoint is not delivering to the sandbox Worker, or sandbox STRIPE_WEBHOOK_SECRET does not match the persistent endpoint signing secret.',
    ].join(' ');
  }

  return `Scenario ${scenario.name} did not show the expected Stripe decline state or produced a paid order.`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncateForConsole(text: string, maxLength = 1_200): string {
  const normalized = text.replace(/\s+/g, ' ').trim();

  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function formatDuration(ms: number): string {
  return ms >= 1_000 ? `${(ms / 1_000).toFixed(1)}s` : `${ms}ms`;
}

function formatCheckoutSurfaceLabelSummary(surface: StripeCheckoutSurfaceObservation): string {
  const paymentLabels = surface.paymentMethodLabels.length ? surface.paymentMethodLabels.join(', ') : 'none';
  const dynamicLabels = surface.dynamicPaymentMethodLabels.length
    ? surface.dynamicPaymentMethodLabels.join(', ')
    : 'none';

  return `payment methods: ${paymentLabels}; dynamic surface: ${dynamicLabels}`;
}

function formatCheckoutSessionProjectionSummary(projection: StripeCheckoutSessionProjectionObservation): string {
  return [
    `amount: ${projection.observedAmountMinor ?? 'none'} ${projection.observedCurrencyCode ?? 'none'}`,
    `product: ${projection.observedProductName ?? 'none'}`,
    `images: ${projection.observedProductImageUrls.length}`,
  ].join('; ');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(scrubSensitiveStripeSmokeText(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  });
}
