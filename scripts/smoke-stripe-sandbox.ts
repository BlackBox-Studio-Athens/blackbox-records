import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL, fileURLToPath } from 'node:url';

import { chromium, type Browser, type Frame, type Page } from 'playwright';

import {
  addStoreCartItem,
  STORE_CART_STORAGE_KEY,
  type CartLineItemSnapshot,
  writeStoreCartState,
} from '../apps/web/src/lib/store-cart';
import {
  createRunId as createSmokeRunId,
  createSmokeEvidencePath,
  createSmokeRunArtifactDir,
  createSmokeScenarioArtifactDir,
  createSmokeSummaryPath,
  formatDuration as formatSmokeDuration,
  runInBatches as runSmokeInBatches,
  truncateForConsole as truncateSmokeForConsole,
  writeJsonFile,
} from './smoke-core';
import { parseStripeSandboxSmokeArgs } from './stripe-sandbox-smoke/args';
import {
  createCheckoutOrderBySessionSql,
  createRemoteD1ReadinessSql,
  createSandboxSmokeStockTopUpSql,
  parseD1CheckoutOrderRows,
  parseRemoteD1ReadinessSummary,
} from './stripe-sandbox-smoke/d1-sql';
import {
  createStripeCheckoutSessionProjectionObservation,
  createStripeCheckoutSurfaceObservation,
  readStripeCheckoutSessionProjection,
  resolveCheckoutSurfaceExpectation,
} from './stripe-sandbox-smoke/checkout-surface';
import { smokeVariantId } from './stripe-sandbox-smoke/constants';
import { scrubSensitiveStripeSmokeText, scrubStripeSmokeEvidenceUrl } from './stripe-sandbox-smoke/redaction';
import {
  calculateMinimumSmokeOnlineQuantity,
  createCheckoutPageUrl,
  createScenarioEmail,
  createSmokeStoreCartLineItemSnapshot,
  getStripeSandboxSmokeScenarioVariantId,
  groupStripeSandboxSmokeScenarios,
  resolveSelectedStripeSandboxScenarios,
  STRIPE_TEST_CARD_DOCS_URL,
} from './stripe-sandbox-smoke/scenario-policy';

export {
  createCheckoutOrderBySessionSql,
  createRemoteD1ReadinessSql,
  createSandboxSmokeStockTopUpSql,
  parseD1CheckoutOrderRows,
  parseRemoteD1ReadinessSummary,
} from './stripe-sandbox-smoke/d1-sql';
export {
  createStripeCheckoutSessionProjectionObservation,
  createStripeCheckoutSurfaceObservation,
  readStripeCheckoutSessionProjection,
  resolveCheckoutSurfaceExpectation,
} from './stripe-sandbox-smoke/checkout-surface';
export { scrubSensitiveStripeSmokeText } from './stripe-sandbox-smoke/redaction';
export { parseStripeSandboxSmokeArgs } from './stripe-sandbox-smoke/args';
export {
  calculateMinimumSmokeOnlineQuantity,
  countPaidStripeSandboxScenarios,
  createCheckoutPageUrl,
  createScenarioEmail,
  createSmokeStoreCartLineItemSnapshot,
  getStripeSandboxSmokeScenarioVariantId,
  groupStripeSandboxSmokeScenarios,
  resolveSelectedStripeSandboxScenarios,
  STRIPE_SANDBOX_SMOKE_SCENARIOS,
  STRIPE_TEST_CARD_DOCS_URL,
} from './stripe-sandbox-smoke/scenario-policy';

export type StripeSandboxSmokeScenarioName =
  | 'checkout_surface'
  | 'card_declined'
  | 'expired_card'
  | 'happy_path_paid'
  | 'incorrect_cvc'
  | 'insufficient_funds'
  | 'pay_what_you_want_paid'
  | 'processing_error'
  | 'three_d_secure';

export type StripeSandboxSmokeScenarioSelection = StripeSandboxSmokeScenarioName | 'all';
export type StripeSandboxScreenshotMode = 'always' | 'never' | 'on-failure';

export type StripeSandboxSmokeScenario = {
  cardNumber?: string;
  checkoutAmountMinor?: number;
  checkoutSurfaceExpectation?: StripeCheckoutSurfaceExpectation;
  description: string;
  expectedOrderStatus: 'not_paid_or_pending' | 'not_submitted' | 'paid';
  expectedStripeErrorPattern?: RegExp;
  lineItemSnapshot?: CartLineItemSnapshot;
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
  webhookDeliveryDiagnostics: StripeSandboxWebhookDeliveryDiagnostics | null;
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
  webhookDeliveryDiagnostics: StripeSandboxWebhookDeliveryDiagnostics | null;
  workerUrl: string;
};

export type StripeSandboxSmokeSummary = {
  blocker?: string;
  environment: 'uat';
  failedScenarioCount: number;
  generatedAt: string;
  passedScenarioCount: number;
  runId: string;
  scenarioNames: StripeSandboxSmokeScenarioName[];
  siteUrl: string;
  status: 'failed' | 'passed';
  suite: 'stripe-sandbox';
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
type FetchLike = (input: string, init?: { headers?: Record<string, string>; method?: string }) => Promise<Response>;

export type StripeSandboxWebhookDeliveryDiagnostics = {
  checkoutSession: {
    issue: string | null;
    lookup: 'failed' | 'missing_secret' | 'not_applicable' | 'ok';
    paymentIntentRecorded: boolean | null;
    paymentStatus: string | null;
    status: string | null;
  };
  events: {
    issue: string | null;
    lookup: 'failed' | 'missing_secret' | 'not_applicable' | 'ok';
    pendingRelatedEventCount: number;
    related: StripeSandboxWebhookEventDiagnostic[];
  };
  issues: string[];
};

export type StripeSandboxWebhookEventDiagnostic = {
  created: string | null;
  id: string;
  livemode: boolean | null;
  pendingWebhooks: number | null;
  type: string;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const backendDir = path.join(rootDir, 'apps', 'backend');
const nodeRequire = createRequire(import.meta.url);
const wranglerBin = nodeRequire.resolve('wrangler/bin/wrangler.js', { paths: [backendDir] });
const stripeApiBaseUrl = 'https://api.stripe.com/v1';
const stripeCheckoutWebhookEventTypes = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
] as const;

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
    issues.push('Wrangler is not authenticated for UAT D1/secret-name inspection.');
  }

  if (!input.gitignoreText?.includes('.codex-artifacts/')) {
    issues.push('.codex-artifacts/ must remain gitignored before writing sandbox smoke evidence.');
  }

  if (!input.secretNames.includes('STRIPE_SECRET_KEY')) {
    issues.push(
      'Sandbox Worker secret STRIPE_SECRET_KEY is not configured. Set it from apps/backend with: pnpm exec wrangler secret put STRIPE_SECRET_KEY --env uat',
    );
  }

  if (requiresPaidWebhook && !input.secretNames.includes('STRIPE_WEBHOOK_SECRET')) {
    issues.push(
      'Sandbox Worker secret STRIPE_WEBHOOK_SECRET is not configured. Set it from apps/backend with: pnpm exec wrangler secret put STRIPE_WEBHOOK_SECRET --env uat',
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
    '- The UAT Worker STRIPE_WEBHOOK_SECRET must match the persistent endpoint signing secret.',
    '- Run pnpm stripe:webhooks:verify --env uat before accepting deployed-sandbox webhook readiness.',
    '- stripe listen is local/temporary diagnostic tooling only; it is not persistent readiness evidence.',
    '- Real sandbox Stripe Price mappings and positive online stock must exist in UAT D1.',
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
    finalUrl: scrubStripeSmokeEvidenceUrl(input.result.finalUrl),
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
    webhookDeliveryDiagnostics: input.result.webhookDeliveryDiagnostics,
    workerUrl: input.options.workerUrl,
  };
}

export async function createStripeSandboxWebhookDeliveryDiagnostics(input: {
  checkoutSessionId: string;
  fetchImpl?: FetchLike;
  scenarioStartedAt: number;
  secretKey?: string;
}): Promise<StripeSandboxWebhookDeliveryDiagnostics> {
  const secretKey = input.secretKey ?? process.env.STRIPE_SECRET_KEY ?? '';

  if (!secretKey.trim()) {
    return {
      checkoutSession: {
        issue: 'STRIPE_SECRET_KEY is not available to query Stripe Checkout Session state.',
        lookup: 'missing_secret',
        paymentIntentRecorded: null,
        paymentStatus: null,
        status: null,
      },
      events: {
        issue: 'STRIPE_SECRET_KEY is not available to query Stripe webhook event delivery state.',
        lookup: 'missing_secret',
        pendingRelatedEventCount: 0,
        related: [],
      },
      issues: ['STRIPE_SECRET_KEY is required for Stripe webhook delivery diagnostics.'],
    };
  }

  const fetchImpl = input.fetchImpl ?? fetch;
  const issues: string[] = [];
  const checkoutSession = await readStripeCheckoutSessionDiagnostic(input.checkoutSessionId, secretKey, fetchImpl);
  const events = await readStripeCheckoutEventDiagnostics(input, secretKey, fetchImpl);

  if (checkoutSession.issue) {
    issues.push(checkoutSession.issue);
  } else if (checkoutSession.paymentStatus !== 'paid') {
    issues.push(`Stripe Checkout Session payment_status is ${checkoutSession.paymentStatus ?? 'unknown'}, not paid.`);
  }

  if (events.issue) {
    issues.push(events.issue);
  } else if (!events.related.length) {
    issues.push('No related Stripe checkout webhook events were found for the Checkout Session.');
  } else if (events.pendingRelatedEventCount > 0) {
    issues.push(
      `${events.pendingRelatedEventCount} related Stripe checkout webhook event(s) still have pending webhook delivery.`,
    );
  }

  return {
    checkoutSession,
    events,
    issues,
  };
}

function formatStripeWebhookDeliveryDiagnostics(
  diagnostics: StripeSandboxWebhookDeliveryDiagnostics | null,
): string | null {
  if (!diagnostics) {
    return null;
  }

  const eventSummary = diagnostics.events.related.length
    ? `${diagnostics.events.related.length} related event(s), ${diagnostics.events.pendingRelatedEventCount} pending delivery`
    : 'no related events';

  return [
    `session ${diagnostics.checkoutSession.lookup}`,
    `payment_status=${diagnostics.checkoutSession.paymentStatus ?? 'unknown'}`,
    eventSummary,
    diagnostics.issues.length ? `issues=${diagnostics.issues.join(' ')}` : 'issues=none',
  ].join('; ');
}

async function readStripeCheckoutSessionDiagnostic(
  checkoutSessionId: string,
  secretKey: string,
  fetchImpl: FetchLike,
): Promise<StripeSandboxWebhookDeliveryDiagnostics['checkoutSession']> {
  try {
    const body = await readStripeApiJson(
      `${stripeApiBaseUrl}/checkout/sessions/${encodeURIComponent(checkoutSessionId)}`,
      secretKey,
      fetchImpl,
    );
    const session = isRecord(body) ? body : {};
    const paymentIntent = session.payment_intent;

    return {
      issue: null,
      lookup: 'ok',
      paymentIntentRecorded: typeof paymentIntent === 'string' && paymentIntent.length > 0,
      paymentStatus: readOptionalString(session.payment_status),
      status: readOptionalString(session.status),
    };
  } catch (error) {
    return {
      issue: `Stripe Checkout Session lookup failed: ${scrubSensitiveStripeSmokeText(String(error))}`,
      lookup: 'failed',
      paymentIntentRecorded: null,
      paymentStatus: null,
      status: null,
    };
  }
}

async function readStripeCheckoutEventDiagnostics(
  input: Pick<
    Parameters<typeof createStripeSandboxWebhookDeliveryDiagnostics>[0],
    'checkoutSessionId' | 'scenarioStartedAt'
  >,
  secretKey: string,
  fetchImpl: FetchLike,
): Promise<StripeSandboxWebhookDeliveryDiagnostics['events']> {
  try {
    const body = await readStripeApiJson(createStripeCheckoutEventsUrl(input.scenarioStartedAt), secretKey, fetchImpl);
    const related = readStripeEventList(body)
      .filter((event) => readStripeEventCheckoutSessionId(event) === input.checkoutSessionId)
      .map(toStripeSandboxWebhookEventDiagnostic);

    return {
      issue: null,
      lookup: 'ok',
      pendingRelatedEventCount: related.filter((event) => (event.pendingWebhooks ?? 0) > 0).length,
      related,
    };
  } catch (error) {
    return {
      issue: `Stripe checkout event lookup failed: ${scrubSensitiveStripeSmokeText(String(error))}`,
      lookup: 'failed',
      pendingRelatedEventCount: 0,
      related: [],
    };
  }
}

function createStripeCheckoutEventsUrl(scenarioStartedAt: number): string {
  const params = new URLSearchParams({
    'created[gte]': String(Math.max(0, Math.floor((scenarioStartedAt - 10 * 60_000) / 1000))),
    limit: '100',
  });

  for (const eventType of stripeCheckoutWebhookEventTypes) {
    params.append('types[]', eventType);
  }

  return `${stripeApiBaseUrl}/events?${params.toString()}`;
}

async function readStripeApiJson(url: string, secretKey: string, fetchImpl: FetchLike): Promise<unknown> {
  const response = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
    method: 'GET',
  });
  const responseText = await response.text();
  const body = responseText ? safeParseJson(responseText) : null;

  if (!response.ok) {
    throw new Error(`Stripe API ${response.status}: ${readStripeApiErrorMessage(body)}`);
  }

  return body;
}

function readStripeApiErrorMessage(body: unknown): string {
  if (!isRecord(body) || !isRecord(body.error)) {
    return 'unknown error';
  }

  return readOptionalString(body.error.message) ?? readOptionalString(body.error.type) ?? 'unknown error';
}

function readStripeEventList(body: unknown): Record<string, unknown>[] {
  if (!isRecord(body) || !Array.isArray(body.data)) {
    return [];
  }

  return body.data.filter(isRecord);
}

function readStripeEventCheckoutSessionId(event: Record<string, unknown>): string | null {
  const data = event.data;
  const eventObject = isRecord(data) && isRecord(data.object) ? data.object : null;

  return eventObject ? readOptionalString(eventObject.id) : null;
}

function toStripeSandboxWebhookEventDiagnostic(event: Record<string, unknown>): StripeSandboxWebhookEventDiagnostic {
  const created = readOptionalNumber(event.created);

  return {
    created: typeof created === 'number' ? new Date(created * 1000).toISOString() : null,
    id: readOptionalString(event.id) ?? 'unknown',
    livemode: readOptionalBoolean(event.livemode),
    pendingWebhooks: readOptionalNumber(event.pending_webhooks),
    type: readOptionalString(event.type) ?? 'unknown',
  };
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readOptionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readOptionalNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readOptionalBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

export function buildStripeSandboxSmokeSummary(input: {
  blocker?: string;
  evidence: readonly StripeSandboxSmokeEvidence[];
  options: Pick<StripeSandboxSmokeOptions, 'siteUrl' | 'workerUrl'>;
  runId: string;
  scenarios: readonly StripeSandboxSmokeScenario[];
}): StripeSandboxSmokeSummary {
  const failedScenarioCount = input.evidence.filter((item) => !item.passed).length;
  const passedScenarioCount = input.evidence.filter((item) => item.passed).length;
  const status: StripeSandboxSmokeSummary['status'] = input.blocker || failedScenarioCount > 0 ? 'failed' : 'passed';

  return {
    blocker: input.blocker,
    environment: 'uat',
    failedScenarioCount,
    generatedAt: new Date().toISOString(),
    passedScenarioCount,
    runId: input.runId,
    scenarioNames: input.scenarios.map((scenario) => scenario.name),
    siteUrl: input.options.siteUrl,
    status,
    suite: 'stripe-sandbox',
    workerUrl: input.options.workerUrl,
  };
}

async function main() {
  const options = parseStripeSandboxSmokeArgs(process.argv.slice(2));
  const scenarios = resolveSelectedStripeSandboxScenarios(options.scenarioSelection);
  const runId = createRunId();
  const runArtifactDir = createSmokeRunArtifactDir(rootDir, 'uat', 'stripe-sandbox', runId);
  const summaryPath = createSmokeSummaryPath(runArtifactDir);
  const minimumSmokeOnlineQuantity = calculateMinimumSmokeOnlineQuantity(scenarios);
  const evidence: StripeSandboxSmokeEvidence[] = [];

  mkdirSync(runArtifactDir, { recursive: true });
  console.log(formatStripeSandboxSmokeRunHeader({ options, runId, scenarios }));
  try {
    await verifyStripeSandboxSmokeReadiness({
      minimumSmokeOnlineQuantity,
      options,
      scenarios,
    });

    evidence.push(...(await runStripeSandboxSmokeScenarios({ options, runArtifactDir, runId, scenarios })));

    writeJsonFile(summaryPath, buildStripeSandboxSmokeSummary({ evidence, options, runId, scenarios }));

    const failedEvidence = evidence.filter((item) => !item.passed);

    if (failedEvidence.length) {
      console.error(JSON.stringify(failedEvidence, null, 2));
      process.exit(1);
    }

    console.log(JSON.stringify(evidence, null, 2));
  } catch (error) {
    const blocker = scrubSensitiveStripeSmokeText(error instanceof Error ? error.message : String(error));
    writeJsonFile(summaryPath, buildStripeSandboxSmokeSummary({ blocker, evidence, options, runId, scenarios }));
    console.error(blocker);
    process.exit(1);
  }
}

async function verifyStripeSandboxSmokeReadiness(input: {
  minimumSmokeOnlineQuantity: number;
  options: StripeSandboxSmokeOptions;
  scenarios: readonly StripeSandboxSmokeScenario[];
}): Promise<void> {
  ensureSandboxSmokeStock(input.minimumSmokeOnlineQuantity, [
    ...new Set(input.scenarios.map((scenario) => getStripeSandboxSmokeScenarioVariantId(scenario))),
  ]);

  const preflight = await runPreflight(input.options);
  const preflightIssues = checkStripeSandboxSmokePreflight({
    ...preflight,
    minimumSmokeOnlineQuantity: input.minimumSmokeOnlineQuantity,
    options: input.options,
    scenarios: input.scenarios,
  });

  console.log(formatStripeSandboxSmokePreflightSummary({ ...preflight, issues: preflightIssues }));

  if (preflightIssues.length) {
    throw new Error('Stripe sandbox smoke preflight failed. Fix the listed issue(s), then rerun.');
  }
}

async function runStripeSandboxSmokeScenarios(input: {
  options: StripeSandboxSmokeOptions;
  runArtifactDir: string;
  runId: string;
  scenarios: readonly StripeSandboxSmokeScenario[];
}): Promise<StripeSandboxSmokeEvidence[]> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: !input.options.headed,
      slowMo: input.options.debug ? 150 : 0,
    });

    return await runStripeSandboxSmokeScenarioGroups({ ...input, browser });
  } finally {
    await browser?.close();
  }
}

async function runStripeSandboxSmokeScenarioGroups(input: {
  browser: Browser;
  options: StripeSandboxSmokeOptions;
  runArtifactDir: string;
  runId: string;
  scenarios: readonly StripeSandboxSmokeScenario[];
}): Promise<StripeSandboxSmokeEvidence[]> {
  const evidence: StripeSandboxSmokeEvidence[] = [];
  const scenarioGroups = groupStripeSandboxSmokeScenarios(input.scenarios);

  for (const scenario of scenarioGroups.checkoutSurfaceScenarios) {
    evidence.push(await runScenarioAndWriteEvidence({ ...input, scenario }));
  }

  if (hasFailedStripeSandboxSmokeEvidence(evidence)) {
    logSkippedStripeSandboxSmokeScenarios('checkout surface', [
      ...scenarioGroups.paidScenarios,
      ...scenarioGroups.declineScenarios,
    ]);

    return evidence;
  }

  for (const scenario of scenarioGroups.paidScenarios) {
    evidence.push(await runScenarioAndWriteEvidence({ ...input, scenario }));
  }

  if (hasFailedStripeSandboxSmokeEvidence(evidence)) {
    logSkippedStripeSandboxSmokeScenarios('paid checkout finalization', scenarioGroups.declineScenarios);

    return evidence;
  }

  if (scenarioGroups.declineScenarios.length) {
    console.log(
      `Running ${scenarioGroups.declineScenarios.length} decline scenario(s) with concurrency ${input.options.declineConcurrency}.`,
    );
    const declineEvidence: StripeSandboxSmokeEvidence[] = [];
    await runInBatches(scenarioGroups.declineScenarios, input.options.declineConcurrency, async (scenario) => {
      declineEvidence.push(await runScenarioAndWriteEvidence({ ...input, scenario }));
    });
    evidence.push(...declineEvidence);
  }

  return evidence;
}

function hasFailedStripeSandboxSmokeEvidence(evidence: readonly StripeSandboxSmokeEvidence[]): boolean {
  return evidence.some((item) => !item.passed);
}

function logSkippedStripeSandboxSmokeScenarios(
  failedPhase: string,
  scenarios: readonly StripeSandboxSmokeScenario[],
): void {
  if (!scenarios.length) {
    return;
  }

  console.log(
    `Skipping ${scenarios.length} downstream scenario(s) after ${failedPhase} failure: ${scenarios
      .map((scenario) => scenario.name)
      .join(', ')}.`,
  );
}

async function runScenarioAndWriteEvidence(input: {
  browser: Browser;
  options: StripeSandboxSmokeOptions;
  runArtifactDir: string;
  runId: string;
  scenario: StripeSandboxSmokeScenario;
}): Promise<StripeSandboxSmokeEvidence> {
  console.log(`Running ${input.scenario.name}: ${input.scenario.description}`);

  const checkoutPageUrl = createCheckoutPageUrl(input.options.siteUrl);
  const scenarioArtifactDir = createSmokeScenarioArtifactDir(input.runArtifactDir, input.scenario.name);
  const scenario = input.scenario.checkoutSurfaceExpectation
    ? {
        ...input.scenario,
        checkoutSurfaceExpectation: await resolveCheckoutSurfaceExpectation(
          input.options.workerUrl,
          input.scenario.checkoutSurfaceExpectation,
          input.options.expectedPaymentMethodLabels,
          input.scenario.lineItemSnapshot?.storeItemSlug,
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
  const evidencePath = createSmokeEvidencePath(scenarioArtifactDir);
  const evidenceWriteStartedAt = Date.now();

  writeJsonFile(evidencePath, evidence);
  evidence.durations.evidenceWriteMs = Date.now() - evidenceWriteStartedAt;
  writeJsonFile(evidencePath, evidence);

  const webhookDiagnosticsSummary = formatStripeWebhookDeliveryDiagnostics(evidence.webhookDeliveryDiagnostics);

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
      ...(webhookDiagnosticsSummary ? [`- webhook diagnostics: ${webhookDiagnosticsSummary}`] : []),
      `- screenshot: ${result.screenshotPath ?? 'skipped'}`,
      `- evidence: ${evidencePath}`,
    ].join('\n'),
  );

  return evidence;
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
  return runSmokeInBatches(items, concurrency, task);
}

function ensureSandboxSmokeStock(minimumQuantity: number, variantIds: readonly string[]): void {
  if (minimumQuantity < 1) {
    return;
  }

  for (const variantId of variantIds) {
    console.log(
      `Ensuring sandbox smoke stock for ${variantId}: at least ${minimumQuantity} online unit(s), without deleting or resetting D1.`,
    );
    runRemoteD1Sql(createSandboxSmokeStockTopUpSql(minimumQuantity, variantId));
  }
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
      await page.addInitScript(
        ({ key, value }) => window.localStorage.setItem(key, value),
        createSmokeStoreCartStorageEntry(input.scenario),
      );
      await page.goto(input.checkoutPageUrl, { waitUntil: 'domcontentloaded' });
      const newsletterOptIn = page.getByLabel(/Email me BlackBox Records/i);
      const checkoutButton = page.getByRole('button', {
        name: /(?:pay securely with|continue to) stripe(?: checkout)?/i,
      });

      await newsletterOptIn.waitFor({ state: 'visible', timeout: input.options.timeoutMs });
      await checkoutButton.waitFor({ state: 'visible', timeout: input.options.timeoutMs });
      await newsletterOptIn.check({ timeout: input.options.fieldActionTimeoutMs });
      await Promise.all([
        page.waitForURL(/checkout\.stripe\.com/, { timeout: input.options.timeoutMs, waitUntil: 'commit' }),
        checkoutButton.click({ timeout: input.options.fieldActionTimeoutMs }),
      ]);
    });

    const checkoutSessionId = extractCheckoutSessionId(page.url());
    if (input.scenario.checkoutAmountMinor !== undefined) {
      await fillStripeCustomAmount(page, input.scenario, input.options.fieldActionTimeoutMs);
    }
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
        webhookDeliveryDiagnostics: null,
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
    const webhookDeliveryDiagnostics =
      resolvedCheckoutSessionId && input.scenario.expectedOrderStatus === 'paid' && order?.status !== 'paid'
        ? await createStripeSandboxWebhookDeliveryDiagnostics({
            checkoutSessionId: resolvedCheckoutSessionId,
            scenarioStartedAt,
          })
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
      webhookDeliveryDiagnostics,
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

async function fillStripeCustomAmount(
  page: Page,
  scenario: StripeSandboxSmokeScenario,
  fieldActionTimeoutMs: number,
): Promise<void> {
  if (scenario.checkoutAmountMinor === undefined) {
    return;
  }

  if (await waitForPresetCheckoutAmount(page, scenario, fieldActionTimeoutMs)) {
    return;
  }

  const amount = formatCustomCheckoutAmountInput(scenario.checkoutAmountMinor);
  const filled =
    (await fillFirstVisible(
      page,
      [/amount/i, /pay what you want/i, /payment amount/i, /custom amount/i],
      amount,
      fieldActionTimeoutMs,
    )) ||
    (await fillFirstVisibleSelector(page, 'input[name="customAmount"]', amount, fieldActionTimeoutMs)) ||
    (await fillFirstVisibleSelector(page, 'input[name="custom_amount"]', amount, fieldActionTimeoutMs)) ||
    (await fillFirstVisibleSelector(page, 'input[name="amount"]', amount, fieldActionTimeoutMs));

  if (!filled) {
    if (await isPresetCheckoutAmountVisible(page, scenario, fieldActionTimeoutMs)) {
      return;
    }

    throw new Error(`Stripe Checkout custom amount field did not become fillable for ${scenario.name}.`);
  }
}

async function waitForPresetCheckoutAmount(
  page: Page,
  scenario: StripeSandboxSmokeScenario,
  fieldActionTimeoutMs: number,
): Promise<boolean> {
  const expectedAmountText = scenario.checkoutSurfaceExpectation?.expectedAmountText;

  if (!expectedAmountText) {
    return false;
  }

  try {
    await page.waitForFunction(
      (amountText) => {
        const bodyText = document.body?.innerText ?? '';

        return bodyText.includes(amountText) && /change amount/i.test(bodyText);
      },
      expectedAmountText,
      { timeout: fieldActionTimeoutMs },
    );

    return true;
  } catch {
    return isPresetCheckoutAmountVisible(page, scenario, fieldActionTimeoutMs);
  }
}

async function isPresetCheckoutAmountVisible(
  page: Page,
  scenario: StripeSandboxSmokeScenario,
  fieldActionTimeoutMs: number,
): Promise<boolean> {
  const expectedAmountText = scenario.checkoutSurfaceExpectation?.expectedAmountText;

  if (!expectedAmountText) {
    return false;
  }

  try {
    const bodyText = await page.locator('body').innerText({ timeout: fieldActionTimeoutMs });

    return isPresetCustomCheckoutAmountText(bodyText, expectedAmountText);
  } catch {
    return false;
  }
}

export function isPresetCustomCheckoutAmountText(bodyText: string, expectedAmountText: string | undefined): boolean {
  return Boolean(expectedAmountText && bodyText.includes(expectedAmountText) && /change amount/i.test(bodyText));
}

function formatCustomCheckoutAmountInput(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2);
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

export function createSmokeStoreCartStorageEntry(scenario?: StripeSandboxSmokeScenario): {
  key: string;
  value: string;
} {
  const values = new Map<string, string>();

  writeStoreCartState(
    {
      getItem: (key) => values.get(key) ?? null,
      removeItem: (key) => {
        values.delete(key);
      },
      setItem: (key, nextValue) => {
        values.set(key, nextValue);
      },
    },
    addStoreCartItem(scenario?.lineItemSnapshot ?? createSmokeStoreCartLineItemSnapshot()),
  );

  const value = values.get(STORE_CART_STORAGE_KEY);

  if (!value) {
    throw new Error('Could not create sandbox smoke StoreCart state.');
  }

  return { key: STORE_CART_STORAGE_KEY, value };
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
  const result = runWrangler(['secret', 'list', '--env', 'uat']);

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
  const result = runWrangler(['d1', 'execute', 'COMMERCE_DB', '--env', 'uat', '--remote', '--command', sql, '--json']);

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

function readOptionalFile(relativePath: string): string | null {
  const absolutePath = path.join(rootDir, ...relativePath.split('/'));

  if (!existsSync(absolutePath)) {
    return null;
  }

  return readFileSync(absolutePath, 'utf8');
}

function sanitizeOrderForReport(order: LocalCheckoutOrderRow) {
  return {
    checkoutSessionId: scrubSensitiveStripeSmokeText(order.checkoutSessionId),
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

function createRunId(): string {
  return createSmokeRunId();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncateForConsole(text: string, maxLength = 1_200): string {
  return truncateSmokeForConsole(text, maxLength);
}

function formatDuration(ms: number): string {
  return formatSmokeDuration(ms);
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
