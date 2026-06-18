import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export type SmokeScreenshotMode = 'always' | 'never' | 'on-failure';

const smokeSecretNamePatterns: ReadonlyArray<[RegExp, string]> = [
  [/\bSTRIPE_SECRET_KEY\b/g, 'runtime secret name STRIPE_SECRET_KEY'],
  [/\bSTRIPE_WEBHOOK_SECRET\b/g, 'runtime secret name STRIPE_WEBHOOK_SECRET'],
  [/\bSTRIPE_PAYMENT_METHOD_CONFIGURATION_ID\b/g, 'runtime secret name STRIPE_PAYMENT_METHOD_CONFIGURATION_ID'],
  [/\bRESEND_API_KEY\b/g, 'runtime secret name RESEND_API_KEY'],
  [/\bRESEND_NEWSLETTER_TOPIC_ID\b/g, 'runtime config name RESEND_NEWSLETTER_TOPIC_ID'],
  [/\bRESEND_NEWSLETTER_SEGMENT_ID\b/g, 'runtime config name RESEND_NEWSLETTER_SEGMENT_ID'],
  [/\bCLOUDFLARE_API_TOKEN\b/g, 'runtime secret name CLOUDFLARE_API_TOKEN'],
  [/\bCF_ACCESS_JWT_ASSERTION\b/g, 'runtime secret name CF_ACCESS_JWT_ASSERTION'],
  [/\bCF-ACCESS-AUTHENTICATED-USER-EMAIL\b/g, 'operator identity header CF-ACCESS-AUTHENTICATED-USER-EMAIL'],
  [/\bCOMMERCE_DB\b/g, 'D1 binding name COMMERCE_DB'],
];

const smokeSecretValuePatterns: ReadonlyArray<[RegExp, string]> = [
  [/\bsk_(?:test|live)_[A-Za-z0-9_]+\b/g, 'Stripe secret key value'],
  [/\bwhsec_[A-Za-z0-9_]+\b/g, 'Stripe webhook secret value'],
  [/\bre_[A-Za-z0-9_]+\b/g, 'Resend API key value'],
  [/\b(?:cs|seti)_(?:test|live)_[A-Za-z0-9_]*?_secret_[A-Za-z0-9_]+\b/g, 'Stripe client secret value'],
  [/\b(?:cs|seti|pi|pm|price|prod|acct|cus|evt)_(?:test|live)?_?[A-Za-z0-9_]+\b/g, 'Stripe object identifier'],
];

export function createRouteUrl(baseUrl: string, routePath = '/'): string {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl, 'siteUrl');
  const normalizedRoutePath = routePath.startsWith('/') ? routePath.slice(1) : routePath;

  return normalizedRoutePath ? `${normalizedBaseUrl}/${normalizedRoutePath}` : `${normalizedBaseUrl}/`;
}

export function createRunId(now = new Date()): string {
  return now
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14);
}

export function createSmokeEvidencePath(scenarioArtifactDir: string): string {
  return path.join(scenarioArtifactDir, 'evidence.json');
}

export function createSmokeRunArtifactDir(rootDir: string, environment: string, suite: string, runId: string): string {
  return path.join(rootDir, '.codex-artifacts', 'smoke', environment, suite, runId);
}

export function createSmokeScenarioArtifactDir(runArtifactDir: string, scenarioName: string): string {
  return path.join(runArtifactDir, scenarioName);
}

export function createSmokeSummaryPath(runArtifactDir: string): string {
  return path.join(runArtifactDir, 'summary.json');
}

export function formatDuration(ms: number): string {
  return ms >= 1_000 ? `${(ms / 1_000).toFixed(1)}s` : `${ms}ms`;
}

export function normalizeBaseUrl(value: string | undefined, flag: string): string {
  if (!value?.trim()) {
    throw new Error(`${flag} must be a URL.`);
  }

  const url = new URL(value);
  url.pathname = url.pathname.replace(/\/+$/, '');
  url.search = '';
  url.hash = '';

  return url.toString().replace(/\/$/, '');
}

export function parseNamedSmokeScenarioSelection<T extends string>(
  value: string | undefined,
  allScenarioNames: readonly T[],
  label: string,
): T | 'all' {
  if (value === 'all') {
    return value;
  }

  if (value && allScenarioNames.includes(value as T)) {
    return value as T;
  }

  throw new Error(
    `Unknown ${label} scenario: ${value ?? '<missing>'}. Use one of: ${['all', ...allScenarioNames].join(', ')}.`,
  );
}

export function parsePositiveInteger(value: string | undefined, flag: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }

  return parsed;
}

export function parseRequiredValue(name: string, value: string | undefined): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`${name} requires a value.`);
  }

  return normalized;
}

export function parseScreenshotMode(value: string | undefined): SmokeScreenshotMode {
  if (value === 'always' || value === 'never' || value === 'on-failure') {
    return value;
  }

  throw new Error(`--screenshots must be one of: on-failure, always, never.`);
}

export function resolveSmokeScenarioSelection<T extends { name: string }>(
  selection: T['name'] | 'all',
  scenarios: readonly T[],
): T[] {
  return selection === 'all' ? [...scenarios] : scenarios.filter((scenario) => scenario.name === selection);
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

export function scanHighRiskSmokeExposure(text: string): string[] {
  const issues = new Set<string>();

  for (const [pattern, label] of smokeSecretNamePatterns) {
    if (pattern.test(text)) {
      issues.add(label);
    }
  }

  for (const [pattern, label] of smokeSecretValuePatterns) {
    if (pattern.test(text)) {
      issues.add(label);
    }
  }

  return [...issues];
}

export function redactSensitiveSmokeText(text: string): string {
  return text
    .replace(/\bSTRIPE_SECRET_KEY\b\s*[:=]\s*[^\s]+/g, 'STRIPE_SECRET_KEY=[redacted_stripe_secret_key]')
    .replace(/\bSTRIPE_WEBHOOK_SECRET\b\s*[:=]\s*[^\s]+/g, 'STRIPE_WEBHOOK_SECRET=[redacted_stripe_webhook_secret]')
    .replace(
      /\bSTRIPE_PAYMENT_METHOD_CONFIGURATION_ID\b\s*[:=]\s*[^\s]+/g,
      'STRIPE_PAYMENT_METHOD_CONFIGURATION_ID=[redacted]',
    )
    .replace(/\bRESEND_API_KEY\b\s*[:=]\s*[^\s]+/g, 'RESEND_API_KEY=[redacted_resend_api_key]')
    .replace(/\bCLOUDFLARE_API_TOKEN\b\s*[:=]\s*[^\s]+/g, 'CLOUDFLARE_API_TOKEN=[redacted]')
    .replace(/\bCF_ACCESS_JWT_ASSERTION\b\s*[:=]\s*[^\s]+/g, 'CF_ACCESS_JWT_ASSERTION=[redacted]')
    .replace(/\bCOMMERCE_DB\b\s*[:=]\s*[^\s]+/g, 'COMMERCE_DB=[redacted]')
    .replace(/sk_test_[A-Za-z0-9_]+/g, '[redacted_stripe_secret_key]')
    .replace(/sk_live_[A-Za-z0-9_]+/g, '[redacted_stripe_secret_key]')
    .replace(/whsec_[A-Za-z0-9_]+/g, '[redacted_stripe_webhook_secret]')
    .replace(/\bre_[A-Za-z0-9_]+\b/g, '[redacted_resend_api_key]')
    .replace(/(cs_(?:test|live)_[A-Za-z0-9_]*?_secret_)[A-Za-z0-9_]+/g, '$1[redacted]')
    .replace(/(seti_(?:test|live)_[A-Za-z0-9_]*?_secret_)[A-Za-z0-9_]+/g, '$1[redacted]')
    .replace(/\bcs_(?:test|live)_(?![A-Za-z0-9_]*_secret_)[A-Za-z0-9_]+\b/g, '[redacted_checkout_session_id]');
}

export function truncateForConsole(text: string, maxLength = 1_200): string {
  const normalized = text.replace(/\s+/g, ' ').trim();

  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

export function writeJsonFile(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
