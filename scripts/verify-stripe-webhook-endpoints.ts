import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  STRIPE_CATALOG_WEBHOOK_EVENT_TYPES,
  STRIPE_CHECKOUT_WEBHOOK_EVENT_TYPES,
} from '../apps/backend/src/infrastructure/stripe';

export type StripeWebhookVerifyOptions = {
  environment: 'sandbox';
};

export type StripeWebhookEndpoint = {
  application?: string | null;
  enabled_events?: string[] | null;
  id: string;
  livemode?: boolean | null;
  status?: string | null;
  url?: string | null;
};

export type StripeWebhookEndpointListClient = {
  list(params: { limit: number; startingAfter?: string }): Promise<{
    data: StripeWebhookEndpoint[];
    has_more?: boolean;
  }>;
};

export type PresenceStatus = 'missing' | 'present' | 'unverified';

export type VerificationPresence = {
  detail?: string;
  status: PresenceStatus;
};

export type StripeWebhookEndpointAnalysis = {
  endpoint: StripeWebhookEndpoint | null;
  extraEvents: string[];
  issues: string[];
  matchingEndpointCount: number;
  missingEvents: string[];
  warnings: string[];
};

export type StripeWebhookEndpointVerificationResult = {
  committedCron: VerificationPresence;
  deployedCron: VerificationPresence;
  endpointAnalysis: StripeWebhookEndpointAnalysis;
  environment: 'sandbox';
  issues: string[];
  signingSecretMatchProof: 'not_proven_by_api';
  workerSecret: VerificationPresence;
};

const rootDir = process.cwd();
const backendDir = path.join(rootDir, 'apps', 'backend');
const wranglerConfigPath = path.join(backendDir, 'wrangler.jsonc');

export const SANDBOX_WORKER_URL = 'https://blackbox-records-backend-sandbox.blackboxrecordsathens.workers.dev';
export const SANDBOX_WEBHOOK_URL = `${SANDBOX_WORKER_URL}/api/stripe/webhooks`;
export const SANDBOX_WORKER_NAME = 'blackbox-records-backend-sandbox';
export const EXPECTED_SANDBOX_CRON = '17 */6 * * *';

const requiredCatalogEvents = [...STRIPE_CATALOG_WEBHOOK_EVENT_TYPES];
const requiredCatalogEventSet = new Set<string>(requiredCatalogEvents);
const checkoutEventSet = new Set<string>(STRIPE_CHECKOUT_WEBHOOK_EVENT_TYPES);

export class StripeWebhookEndpointVerificationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'StripeWebhookEndpointVerificationError';
  }
}

export function parseStripeWebhookVerifyArgs(args: string[]): StripeWebhookVerifyOptions {
  let environment: 'sandbox' | null = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log('Usage: pnpm stripe:webhooks:verify --env sandbox');
      process.exit(0);
    }

    if (arg === '--env') {
      const value = args[index + 1];
      index += 1;
      environment = parseEnvironment(value);
      continue;
    }

    if (arg?.startsWith('--env=')) {
      environment = parseEnvironment(arg.slice('--env='.length));
      continue;
    }

    throw new StripeWebhookEndpointVerificationError(`Unknown argument: ${arg}`);
  }

  if (!environment) {
    throw new StripeWebhookEndpointVerificationError('Usage: pnpm stripe:webhooks:verify --env sandbox');
  }

  return { environment };
}

export async function verifyStripeWebhookEndpointConfiguration(input: {
  client: StripeWebhookEndpointListClient;
  committedCron?: VerificationPresence;
  deployedCron?: VerificationPresence;
  workerSecret?: VerificationPresence;
}): Promise<StripeWebhookEndpointVerificationResult> {
  const endpoints = await listAllStripeWebhookEndpoints(input.client);
  const endpointAnalysis = analyzeStripeWebhookEndpoints(endpoints);
  const workerSecret = input.workerSecret ?? readSandboxWorkerSecretPresence();
  const committedCron = input.committedCron ?? readCommittedSandboxCronPresence();
  const deployedCron = input.deployedCron ?? (await readDeployedSandboxCronPresence());
  const issues = [...endpointAnalysis.issues];

  if (workerSecret.status === 'missing') {
    issues.push(
      'Sandbox Worker secret STRIPE_WEBHOOK_SECRET is missing. Set it from apps/backend with: pnpm exec wrangler secret put STRIPE_WEBHOOK_SECRET --env sandbox',
    );
  } else if (workerSecret.status === 'unverified') {
    issues.push(
      `Sandbox Worker secret STRIPE_WEBHOOK_SECRET presence is unverified.${formatOptionalDetail(workerSecret.detail)}`,
    );
  }

  if (committedCron.status !== 'present') {
    issues.push(`Committed sandbox cron ${EXPECTED_SANDBOX_CRON} is ${committedCron.status}.`);
  }

  if (deployedCron.status === 'missing') {
    issues.push(`Deployed sandbox cron ${EXPECTED_SANDBOX_CRON} is missing.`);
  }

  return {
    committedCron,
    deployedCron,
    endpointAnalysis,
    environment: 'sandbox',
    issues,
    signingSecretMatchProof: 'not_proven_by_api',
    workerSecret,
  };
}

export async function listAllStripeWebhookEndpoints(
  client: StripeWebhookEndpointListClient,
): Promise<StripeWebhookEndpoint[]> {
  const endpoints: StripeWebhookEndpoint[] = [];
  let startingAfter: string | undefined;

  for (;;) {
    const page = await client.list({ limit: 100, startingAfter });
    endpoints.push(...page.data);

    if (!page.has_more) {
      return endpoints;
    }

    const lastEndpointId = page.data.at(-1)?.id;

    if (!lastEndpointId) {
      throw new StripeWebhookEndpointVerificationError('Stripe webhook endpoint pagination did not return a cursor.');
    }

    startingAfter = lastEndpointId;
  }
}

export function analyzeStripeWebhookEndpoints(endpoints: StripeWebhookEndpoint[]): StripeWebhookEndpointAnalysis {
  const exactUrlMatches = endpoints.filter((endpoint) => endpoint.url === SANDBOX_WEBHOOK_URL);
  const accountUrlMatches = exactUrlMatches.filter((endpoint) => !normalizeOptionalValue(endpoint.application));
  const enabledAccountUrlMatches = accountUrlMatches.filter((endpoint) => endpoint.status === 'enabled');
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!exactUrlMatches.length) {
    issues.push(`No Stripe account webhook endpoint targets ${SANDBOX_WEBHOOK_URL}.`);
  } else if (!accountUrlMatches.length) {
    issues.push(
      `Matching webhook endpoint(s) for ${SANDBOX_WEBHOOK_URL} are Connect-only or application-owned; create an account endpoint.`,
    );
  }

  if (accountUrlMatches.some((endpoint) => endpoint.status !== 'enabled') && !enabledAccountUrlMatches.length) {
    issues.push(
      `Matching webhook endpoint is disabled: ${accountUrlMatches.map((endpoint) => redactStripeObjectId(endpoint.id)).join(', ')}.`,
    );
  }

  if (enabledAccountUrlMatches.length > 1) {
    issues.push(
      `Multiple enabled account webhook endpoints target ${SANDBOX_WEBHOOK_URL}: ${enabledAccountUrlMatches
        .map((endpoint) => redactStripeObjectId(endpoint.id))
        .join(', ')}.`,
    );
  }

  const endpoint = enabledAccountUrlMatches.length === 1 ? enabledAccountUrlMatches[0] : null;
  const missingEvents = endpoint ? findMissingCatalogEvents(endpoint.enabled_events ?? []) : [];
  const extraEvents = endpoint ? findExtraWebhookEvents(endpoint.enabled_events ?? []) : [];

  if (endpoint) {
    if (endpoint.livemode !== false) {
      issues.push(`Webhook endpoint ${redactStripeObjectId(endpoint.id)} is not in Stripe test mode.`);
    }

    if (normalizeOptionalValue(endpoint.application)) {
      issues.push(
        `Webhook endpoint ${redactStripeObjectId(endpoint.id)} is application-owned instead of account-owned.`,
      );
    }

    if (missingEvents.length) {
      issues.push(
        `Webhook endpoint ${redactStripeObjectId(endpoint.id)} is missing required catalog event(s): ${missingEvents.join(
          ', ',
        )}.`,
      );
    }

    if ((endpoint.enabled_events ?? []).includes('*')) {
      warnings.push(
        "Webhook endpoint subscribes to '*'. Required catalog events are covered, but event volume should be reviewed.",
      );
    } else if (extraEvents.length) {
      const checkoutExtraEvents = extraEvents.filter((eventType) => checkoutEventSet.has(eventType));
      const nonCheckoutExtraEvents = extraEvents.filter((eventType) => !checkoutEventSet.has(eventType));
      warnings.push(
        `Webhook endpoint includes extra enabled event(s): ${extraEvents.join(', ')}. ${
          nonCheckoutExtraEvents.length
            ? 'Review non-checkout extras before accepting readiness.'
            : `Extra checkout event(s) are allowed on the shared route: ${checkoutExtraEvents.join(', ')}.`
        }`,
      );
    }
  }

  return {
    endpoint,
    extraEvents,
    issues,
    matchingEndpointCount: exactUrlMatches.length,
    missingEvents,
    warnings,
  };
}

export function findMissingCatalogEvents(enabledEvents: readonly string[]): string[] {
  if (enabledEvents.includes('*')) {
    return [];
  }

  return requiredCatalogEvents.filter((eventType) => !enabledEvents.includes(eventType));
}

export function findExtraWebhookEvents(enabledEvents: readonly string[]): string[] {
  if (enabledEvents.includes('*')) {
    return ['*'];
  }

  return enabledEvents.filter((eventType) => !requiredCatalogEventSet.has(eventType));
}

export function classifyWorkerSecretPresence(
  secretNames: readonly string[] | null,
  detail?: string,
): VerificationPresence {
  if (!secretNames) {
    return {
      detail,
      status: 'unverified',
    };
  }

  return {
    status: secretNames.includes('STRIPE_WEBHOOK_SECRET') ? 'present' : 'missing',
  };
}

export function parseWranglerSecretNames(jsonText: string): string[] {
  const jsonStartIndex = jsonText.indexOf('[');
  const jsonEndIndex = jsonText.lastIndexOf(']');

  if (jsonStartIndex === -1 || jsonEndIndex < jsonStartIndex) {
    throw new StripeWebhookEndpointVerificationError('Wrangler did not return a JSON secret list.');
  }

  const parsed = JSON.parse(jsonText.slice(jsonStartIndex, jsonEndIndex + 1)) as Array<{ name?: unknown }>;

  return parsed.flatMap((secret) => (typeof secret.name === 'string' ? [secret.name] : []));
}

export function readSandboxWorkerSecretPresence(): VerificationPresence {
  const command = createPnpmCommand(['exec', 'wrangler', 'secret', 'list', '--env', 'sandbox', '--format', 'json']);
  const result = spawnSync(command.command, command.args, {
    cwd: backendDir,
    encoding: 'utf8',
    shell: false,
  });

  if (result.error || result.status !== 0) {
    return {
      detail: redactSensitiveValues(result.stderr || result.stdout || String(result.error)),
      status: 'unverified',
    };
  }

  try {
    return classifyWorkerSecretPresence(parseWranglerSecretNames(result.stdout));
  } catch (error) {
    return {
      detail: redactSensitiveValues(error instanceof Error ? error.message : String(error)),
      status: 'unverified',
    };
  }
}

export function readCommittedSandboxCronPresence(configPath = wranglerConfigPath): VerificationPresence {
  try {
    const configText = readFileSync(configPath, 'utf8');
    const hasExpectedCron = new RegExp(`"crons"\\s*:\\s*\\[\\s*"${escapeRegExp(EXPECTED_SANDBOX_CRON)}"\\s*\\]`).test(
      configText,
    );

    return {
      status: hasExpectedCron ? 'present' : 'missing',
    };
  } catch (error) {
    return {
      detail: error instanceof Error ? error.message : String(error),
      status: 'unverified',
    };
  }
}

export async function readDeployedSandboxCronPresence(
  env: NodeJS.ProcessEnv = process.env,
): Promise<VerificationPresence> {
  const accountId = normalizeOptionalValue(env.CLOUDFLARE_ACCOUNT_ID);
  const apiToken = normalizeOptionalValue(env.CLOUDFLARE_API_TOKEN);

  if (!accountId || !apiToken) {
    return {
      detail: 'Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to verify deployed cron triggers.',
      status: 'unverified',
    };
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
      accountId,
    )}/workers/scripts/${encodeURIComponent(SANDBOX_WORKER_NAME)}/schedules`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    },
  );
  const responseText = await response.text();

  if (!response.ok) {
    return {
      detail: `Cloudflare schedules API failed (${response.status}): ${redactSensitiveValues(responseText)}`,
      status: 'unverified',
    };
  }

  const payload = JSON.parse(responseText) as {
    result?: {
      schedules?: Array<{ cron?: unknown }>;
    };
    success?: boolean;
  };
  const crons = payload.result?.schedules?.flatMap((schedule) =>
    typeof schedule.cron === 'string' ? [schedule.cron] : [],
  );

  if (!payload.success || !crons) {
    return {
      detail: 'Cloudflare schedules API did not return a successful schedule list.',
      status: 'unverified',
    };
  }

  return {
    status: crons.includes(EXPECTED_SANDBOX_CRON) ? 'present' : 'missing',
  };
}

export function formatStripeWebhookEndpointVerificationReport(result: StripeWebhookEndpointVerificationResult): string {
  const endpoint = result.endpointAnalysis.endpoint;
  const lines = [
    `Stripe sandbox webhook endpoint verification ${result.issues.length ? 'failed' : 'OK'}.`,
    `Environment: ${result.environment}`,
    `Endpoint URL: ${SANDBOX_WEBHOOK_URL}`,
    `Endpoint: ${
      endpoint
        ? `${redactStripeObjectId(endpoint.id)} (status=${endpoint.status ?? 'unknown'}, livemode=${formatNullableBoolean(
            endpoint.livemode ?? null,
          )}, scope=${normalizeOptionalValue(endpoint.application) ? 'application' : 'account'})`
        : 'not verified'
    }`,
    `Required catalog events: ${result.endpointAnalysis.missingEvents.length ? 'missing' : 'covered'}`,
    `Matching endpoint count: ${result.endpointAnalysis.matchingEndpointCount}`,
    `Worker STRIPE_WEBHOOK_SECRET presence: ${formatPresence(result.workerSecret)}`,
    'Signing-secret match proof: not_proven_by_api',
    `Committed sandbox cron ${EXPECTED_SANDBOX_CRON}: ${formatPresence(result.committedCron)}`,
    `Deployed sandbox cron ${EXPECTED_SANDBOX_CRON}: ${formatPresence(result.deployedCron)}`,
  ];

  if (result.endpointAnalysis.extraEvents.length) {
    lines.push(`Extra enabled events: ${result.endpointAnalysis.extraEvents.join(', ')}`);
  }

  lines.push(
    '',
    'Secret match note:',
    '- Stripe list/retrieve APIs do not return an existing endpoint signing secret. Prove a match by immediately writing a newly revealed/rotated endpoint secret to the sandbox Worker, or by recording redacted persistent delivery evidence.',
  );

  if (result.endpointAnalysis.warnings.length || result.deployedCron.status === 'unverified') {
    lines.push('', 'Warnings:');
    lines.push(...result.endpointAnalysis.warnings.map((warning) => `- ${warning}`));

    if (result.deployedCron.status === 'unverified') {
      lines.push(`- Deployed cron presence is unverified.${formatOptionalDetail(result.deployedCron.detail)}`);
    }
  }

  if (result.issues.length) {
    lines.push('', 'Issues:');
    lines.push(...result.issues.map((issue) => `- ${issue}`));
  }

  return redactSensitiveValues(lines.join('\n'));
}

export function createStripeWebhookEndpointRestClient(secretKey: string): StripeWebhookEndpointListClient {
  const normalizedSecretKey = normalizeOptionalValue(secretKey);

  if (!normalizedSecretKey) {
    throw new StripeWebhookEndpointVerificationError('STRIPE_SECRET_KEY is required.');
  }

  return {
    async list(params) {
      const searchParams = new URLSearchParams({
        limit: String(params.limit),
      });

      if (params.startingAfter) {
        searchParams.set('starting_after', params.startingAfter);
      }

      return requestStripeApi(normalizedSecretKey, `/v1/webhook_endpoints?${searchParams.toString()}`);
    },
  };
}

export function redactStripeObjectId(value: string): string {
  const trimmed = value.trim();

  if (!trimmed.includes('_')) {
    return '[redacted]';
  }

  const prefix = trimmed.slice(0, trimmed.indexOf('_') + 1);
  const suffix = trimmed.slice(-4);

  return `${prefix}...${suffix}`;
}

export function redactSensitiveValues(value: string): string {
  return value
    .replace(/sk_(test|live)_[A-Za-z0-9_]+/g, 'sk_$1_[redacted]')
    .replace(/whsec_[A-Za-z0-9_]+/g, '[redacted_stripe_webhook_secret]')
    .replace(/\b(?:we|price|prod)_[A-Za-z0-9_]+\b/g, (match) => redactStripeObjectId(match));
}

async function requestStripeApi<T>(secretKey: string, requestPath: string): Promise<T> {
  const response = await fetch(`https://api.stripe.com${requestPath}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });
  const responseText = await response.text();

  if (!response.ok) {
    throw new StripeWebhookEndpointVerificationError(
      `Stripe API request failed (${response.status}): ${redactSensitiveValues(responseText)}`,
    );
  }

  return JSON.parse(responseText) as T;
}

function createPnpmCommand(args: string[]): { args: string[]; command: string } {
  return process.platform === 'win32'
    ? { args: ['/d', '/s', '/c', 'pnpm', ...args], command: 'cmd.exe' }
    : { args, command: 'pnpm' };
}

function parseEnvironment(value: string | undefined): 'sandbox' {
  if (value === 'sandbox') {
    return value;
  }

  throw new StripeWebhookEndpointVerificationError(
    'Stripe webhook endpoint verification is currently supported only with --env sandbox.',
  );
}

function formatPresence(presence: VerificationPresence): string {
  return `${presence.status}${formatOptionalDetail(presence.detail)}`;
}

function formatOptionalDetail(detail: string | undefined): string {
  return detail ? ` (${redactSensitiveValues(detail)})` : '';
}

function formatNullableBoolean(value: boolean | null): string {
  return value === null ? 'unknown' : String(value);
}

function normalizeOptionalValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
  parseStripeWebhookVerifyArgs(process.argv.slice(2));
  const client = createStripeWebhookEndpointRestClient(process.env.STRIPE_SECRET_KEY ?? '');
  const result = await verifyStripeWebhookEndpointConfiguration({ client });
  const report = formatStripeWebhookEndpointVerificationReport(result);

  if (result.issues.length) {
    console.error(report);
    process.exit(1);
  }

  console.log(report);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(redactSensitiveValues(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  });
}
