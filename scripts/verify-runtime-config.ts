import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  formatProductEnvironmentLabel,
  getProductEnvironmentProfile,
  parseProductEnvironmentCliTarget,
  type ProductEnvironment,
  type ProductEnvironmentProfile,
  type WorkerRuntimeTarget,
} from '../apps/backend/src/env';
import { UAT_RESEND_RECEIVING_SINK_EMAIL } from '../apps/backend/src/application/email/config';

export type RuntimeConfigEnvironment = ProductEnvironment;
export type RuntimeConfigStatus = 'missing' | 'not_applicable' | 'present' | 'unverified';

export type RuntimeConfigCategory = {
  detail?: string;
  name:
    | 'CHECKOUT_RETURN_ORIGINS'
    | 'COMMERCE_DB'
    | 'FLAGS'
    | 'EMAIL_BRAND_HOME_URL'
    | 'EMAIL_BRAND_LOGO_URL'
    | 'PRD_OPEN_GATE'
    | 'PRD_CATALOG_CRON'
    | 'PRODUCT_ENVIRONMENT_MAPPING'
    | 'RESEND_API_KEY'
    | 'RESEND_FROM_EMAIL'
    | 'RESEND_NEWSLETTER_SEGMENT_ID'
    | 'RESEND_NEWSLETTER_TOPIC_ID'
    | 'RESEND_OPS_TO_EMAIL'
    | 'RESEND_REPLY_TO_EMAIL'
    | 'RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL'
    | 'STRIPE_PAYMENT_METHOD_CONFIGURATION_ID'
    | 'STRIPE_SECRET_KEY'
    | 'STRIPE_WEBHOOK_SECRET'
    | 'WORKER_ORIGIN_SCOPE';
  status: RuntimeConfigStatus;
};

export type RuntimeConfigVerificationResult = {
  categories: RuntimeConfigCategory[];
  environment: RuntimeConfigEnvironment;
  issues: string[];
  productEnvironment: ProductEnvironment;
  requireLiveSecrets: boolean;
  workerDeploymentTarget: WorkerRuntimeTarget;
};

const rootDir = process.cwd();
const backendDir = path.join(rootDir, 'apps', 'backend');
const wranglerConfigPath = path.join(backendDir, 'wrangler.jsonc');

export function parseRuntimeConfigVerifyArgs(args: string[]): {
  environment: RuntimeConfigEnvironment;
  productEnvironment: ProductEnvironment;
  requireLiveSecrets: boolean;
} {
  let environment: RuntimeConfigEnvironment | null = null;
  let requireLiveSecrets = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: pnpm runtime:config:verify --env local|uat|prd [--require-live-secrets] (legacy platform aliases accepted: sandbox, production)',
      );
      process.exit(0);
    }

    if (arg === '--require-live-secrets') {
      requireLiveSecrets = true;
      continue;
    }

    if (arg === '--env') {
      environment = parseEnvironment(args[index + 1]);
      index += 1;
      continue;
    }

    if (arg?.startsWith('--env=')) {
      environment = parseEnvironment(arg.slice('--env='.length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!environment) {
    throw new Error(
      'Runtime config verification requires --env local, uat, or prd. Legacy platform aliases accepted: sandbox, production.',
    );
  }

  return {
    environment,
    productEnvironment: environment,
    requireLiveSecrets,
  };
}

export function verifyRuntimeConfig(input: {
  environment: RuntimeConfigEnvironment;
  requireLiveSecrets?: boolean;
  secretNames: readonly string[] | null;
  wranglerConfigText: string;
}): RuntimeConfigVerificationResult {
  const productEnvironmentProfile = getProductEnvironmentProfile(input.environment);
  const environmentBlock = extractWranglerEnvironmentBlock(
    input.wranglerConfigText,
    productEnvironmentProfile.workerDeploymentTarget,
  );
  const requireDeployedSecrets =
    productEnvironmentProfile.requiresDeployedSecretsByDefault || input.requireLiveSecrets === true;
  const categories: RuntimeConfigCategory[] = [
    classifyProductEnvironmentMapping(productEnvironmentProfile),
    ...(!requireDeployedSecrets
      ? []
      : [
          classifyWorkerConfigPresence('STRIPE_PAYMENT_METHOD_CONFIGURATION_ID', environmentBlock, input.secretNames),
          classifySecretPresence('STRIPE_SECRET_KEY', input.secretNames),
          classifySecretPresence('STRIPE_WEBHOOK_SECRET', input.secretNames),
        ]),
    classifyWranglerTextPresence('CHECKOUT_RETURN_ORIGINS', environmentBlock),
    classifyWorkerOriginScope(productEnvironmentProfile, environmentBlock),
    classifyWranglerTextPresence('COMMERCE_DB', environmentBlock, /"binding"\s*:\s*"COMMERCE_DB"/),
    ...classifyResendRuntimeConfig(productEnvironmentProfile, environmentBlock, input.secretNames),
    classifyFlagsPresence(environmentBlock),
    classifyPrdOpenGate(productEnvironmentProfile),
    classifyPrdCatalogCronPresence(productEnvironmentProfile, environmentBlock),
  ];
  const issues = categories.flatMap((category) =>
    category.status === 'missing' || category.status === 'unverified'
      ? [`${category.name} is ${category.status}${category.detail ? ` (${category.detail})` : ''}.`]
      : [],
  );

  return {
    categories,
    environment: input.environment,
    issues,
    productEnvironment: input.environment,
    requireLiveSecrets: requireDeployedSecrets,
    workerDeploymentTarget: productEnvironmentProfile.workerDeploymentTarget,
  };
}

export function formatRuntimeConfigVerificationReport(result: RuntimeConfigVerificationResult): string {
  const lines = [
    `Runtime config verification ${result.issues.length ? 'failed' : 'OK'}.`,
    `Product Environment: ${result.productEnvironment}`,
    `Product Environment label: ${formatProductEnvironmentLabel(result.productEnvironment)}`,
    `Worker deployment target: ${result.workerDeploymentTarget}`,
    `Live secret requirement: ${result.requireLiveSecrets ? 'required' : 'not required for disabled readiness'}`,
    '',
    'Categories:',
    ...result.categories.map(
      (category) => `- ${category.name}: ${category.status}${category.detail ? ` (${category.detail})` : ''}`,
    ),
  ];

  if (result.issues.length) {
    lines.push('', 'Issues:', ...result.issues.map((issue) => `- ${issue}`));
  }

  return redactSensitiveValues(lines.join('\n'));
}

export function parseWranglerSecretNames(jsonText: string): string[] {
  const jsonStartIndex = jsonText.indexOf('[');
  const jsonEndIndex = jsonText.lastIndexOf(']');

  if (jsonStartIndex === -1 || jsonEndIndex < jsonStartIndex) {
    throw new Error('Wrangler did not return a JSON secret list.');
  }

  const parsed = JSON.parse(jsonText.slice(jsonStartIndex, jsonEndIndex + 1)) as Array<{ name?: unknown }>;

  return parsed.flatMap((secret) => (typeof secret.name === 'string' ? [secret.name] : []));
}

function classifyWorkerConfigPresence(
  name: RuntimeConfigCategory['name'],
  environmentBlock: string,
  secretNames: readonly string[] | null,
): RuntimeConfigCategory {
  if (classifyWranglerTextPresence(name, environmentBlock).status === 'present') {
    return {
      name,
      status: 'present',
    };
  }

  if (secretNames?.includes(name)) {
    return {
      name,
      status: 'present',
    };
  }

  if (secretNames === null) {
    return {
      detail: 'Wrangler secret list could not be read.',
      name,
      status: 'unverified',
    };
  }

  return {
    name,
    status: 'missing',
  };
}

function classifySecretPresence(
  name: Extract<RuntimeConfigCategory['name'], 'RESEND_API_KEY' | 'STRIPE_SECRET_KEY' | 'STRIPE_WEBHOOK_SECRET'>,
  secretNames: readonly string[] | null,
): RuntimeConfigCategory {
  if (!secretNames) {
    return {
      detail: 'Wrangler secret list could not be read.',
      name,
      status: 'unverified',
    };
  }

  return {
    name,
    status: secretNames.includes(name) ? 'present' : 'missing',
  };
}

function classifyResendRuntimeConfig(
  productEnvironmentProfile: ProductEnvironmentProfile,
  environmentBlock: string,
  secretNames: readonly string[] | null,
): RuntimeConfigCategory[] {
  return [
    classifyWorkerConfigPresence('RESEND_API_KEY', environmentBlock, secretNames),
    classifyExactWorkerConfigPresence(
      'EMAIL_BRAND_HOME_URL',
      environmentBlock,
      productEnvironmentProfile.emailBrand.homeUrl,
      'Email brand home URL must match the Product Environment public site URL.',
    ),
    classifyExactWorkerConfigPresence(
      'EMAIL_BRAND_LOGO_URL',
      environmentBlock,
      productEnvironmentProfile.emailBrand.logoUrl,
      'Email brand logo URL must match the Product Environment public logo asset URL.',
    ),
    classifyExactWorkerConfigPresence(
      'RESEND_FROM_EMAIL',
      environmentBlock,
      'orders@blackboxrecordsathens.com',
      'Resend sender must stay on the verified orders@blackboxrecordsathens.com address.',
    ),
    classifyExactWorkerConfigPresence(
      'RESEND_REPLY_TO_EMAIL',
      environmentBlock,
      'support@blackboxrecordsathens.com',
      'Resend reply-to must route through support@blackboxrecordsathens.com.',
    ),
    classifyExactWorkerConfigPresence(
      'RESEND_OPS_TO_EMAIL',
      environmentBlock,
      'blackboxrecordsathens@gmail.com',
      'Ops notifications must route to the Gmail operations inbox.',
    ),
    classifyWorkerConfigPresence('RESEND_NEWSLETTER_TOPIC_ID', environmentBlock, secretNames),
    classifyResendNewsletterSegmentPresence(environmentBlock),
    classifyResendUatRecipientOverride(productEnvironmentProfile, environmentBlock),
  ];
}

function classifyExactWorkerConfigPresence(
  name: RuntimeConfigCategory['name'],
  environmentBlock: string,
  expectedValue: string,
  detail: string,
): RuntimeConfigCategory {
  const match = new RegExp(`"${escapeRegExp(name)}"\\s*:\\s*"(?<value>[^"]*)"`).exec(environmentBlock);

  return {
    detail: match?.groups?.value === expectedValue ? undefined : detail,
    name,
    status: match?.groups?.value === expectedValue ? 'present' : 'missing',
  };
}

function classifyResendNewsletterSegmentPresence(environmentBlock: string): RuntimeConfigCategory {
  const hasSegment =
    classifyWranglerTextPresence('RESEND_NEWSLETTER_SEGMENT_ID', environmentBlock).status === 'present';

  return {
    detail: hasSegment
      ? 'Optional newsletter Segment config is present.'
      : 'Newsletter Segment assignment is optional and deferred.',
    name: 'RESEND_NEWSLETTER_SEGMENT_ID',
    status: hasSegment ? 'present' : 'not_applicable',
  };
}

function classifyResendUatRecipientOverride(
  productEnvironmentProfile: ProductEnvironmentProfile,
  environmentBlock: string,
): RuntimeConfigCategory {
  const match = /"RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL"\s*:\s*"(?<email>[^"]*)"/.exec(environmentBlock);

  if (productEnvironmentProfile.emailDeliveryPolicy === 'uat-sink') {
    const isSink = match?.groups?.email === UAT_RESEND_RECEIVING_SINK_EMAIL;

    return {
      detail: isSink
        ? 'UAT email and Contact writes route to the sink recipient.'
        : 'UAT must route email and Contact writes to the sink recipient.',
      name: 'RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL',
      status: isSink ? 'present' : 'missing',
    };
  }

  if (productEnvironmentProfile.productEnvironment === 'PRD' && match) {
    return {
      detail: 'PRD must not honor the UAT sink recipient override.',
      name: 'RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL',
      status: 'missing',
    };
  }

  return {
    detail: 'UAT sink recipient applies only to the uat Worker runtime target.',
    name: 'RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL',
    status: 'not_applicable',
  };
}

function classifyProductEnvironmentMapping(
  productEnvironmentProfile: ProductEnvironmentProfile,
): RuntimeConfigCategory {
  return {
    detail: `${productEnvironmentProfile.productEnvironment} maps to Worker deployment target ${productEnvironmentProfile.workerDeploymentTarget}.`,
    name: 'PRODUCT_ENVIRONMENT_MAPPING',
    status: 'present',
  };
}

function classifyWorkerOriginScope(
  productEnvironmentProfile: ProductEnvironmentProfile,
  environmentBlock: string,
): RuntimeConfigCategory {
  const origins = getCheckoutReturnOrigins(environmentBlock);
  const hasLocal = origins.some(
    (origin) => origin.startsWith('http://127.0.0.1') || origin.startsWith('http://localhost'),
  );
  const hasUat = origins.includes('https://blackbox-studio-athens.github.io/blackbox-records');
  const hasPrd = origins.includes('https://blackbox-records-web.pages.dev');
  const hasPreview = origins.some(
    (origin) =>
      origin.includes('.blackbox-records-web.pages.dev') && origin !== 'https://blackbox-records-web.pages.dev',
  );

  if (productEnvironmentProfile.productEnvironment === 'LOCAL') {
    return {
      detail: hasLocal && !hasUat && !hasPrd && !hasPreview ? undefined : 'Local mock origins must stay local-only.',
      name: 'WORKER_ORIGIN_SCOPE',
      status: hasLocal && !hasUat && !hasPrd && !hasPreview ? 'present' : 'missing',
    };
  }

  if (productEnvironmentProfile.productEnvironment === 'UAT') {
    return {
      detail:
        hasUat && hasLocal && !hasPrd && !hasPreview
          ? 'UAT Worker allows GitHub Pages plus local uat-connected diagnostics.'
          : 'UAT Worker must allow GitHub Pages and local uat-connected diagnostics, but not PRD or preview origins.',
      name: 'WORKER_ORIGIN_SCOPE',
      status: hasUat && hasLocal && !hasPrd && !hasPreview ? 'present' : 'missing',
    };
  }

  return {
    detail:
      hasPrd && !hasUat && !hasLocal && !hasPreview
        ? 'PRD Worker allows only Cloudflare Pages PRD until an approved custom domain is added.'
        : 'PRD Worker must not allow Local, UAT, or preview origins.',
    name: 'WORKER_ORIGIN_SCOPE',
    status: hasPrd && !hasUat && !hasLocal && !hasPreview ? 'present' : 'missing',
  };
}

function classifyPrdOpenGate(productEnvironmentProfile: ProductEnvironmentProfile): RuntimeConfigCategory {
  if (productEnvironmentProfile.productEnvironment !== 'PRD') {
    return {
      detail: 'PRD-open gate applies only to the PRD product environment.',
      name: 'PRD_OPEN_GATE',
      status: 'not_applicable',
    };
  }

  return {
    detail: 'PRD checkout and live provider mutation stay disabled until PRD_OPEN_GATE is configured outside the repo.',
    name: 'PRD_OPEN_GATE',
    status: 'not_applicable',
  };
}

function classifyWranglerTextPresence(
  name: RuntimeConfigCategory['name'],
  environmentBlock: string,
  pattern = new RegExp(`"${escapeRegExp(name)}"\\s*:`),
): RuntimeConfigCategory {
  return {
    name,
    status: pattern.test(environmentBlock) ? 'present' : 'missing',
  };
}

function classifyFlagsPresence(environmentBlock: string): RuntimeConfigCategory {
  const hasFlagsBinding = /"binding"\s*:\s*"FLAGS"/.test(environmentBlock) || /"FLAGS"\s*:/.test(environmentBlock);

  return {
    detail: hasFlagsBinding ? undefined : 'Flagship binding is not committed until the provider app is approved.',
    name: 'FLAGS',
    status: hasFlagsBinding ? 'present' : 'not_applicable',
  };
}

function classifyPrdCatalogCronPresence(
  productEnvironmentProfile: ProductEnvironmentProfile,
  environmentBlock: string,
): RuntimeConfigCategory {
  if (productEnvironmentProfile.productEnvironment !== 'PRD') {
    return {
      detail: 'Only PRD cron backstop is classified here.',
      name: 'PRD_CATALOG_CRON',
      status: 'not_applicable',
    };
  }

  const hasCron = /"crons"\s*:/.test(environmentBlock);

  return {
    detail: hasCron ? undefined : 'PRD promotion does not currently rely on a cron backstop.',
    name: 'PRD_CATALOG_CRON',
    status: hasCron ? 'present' : 'not_applicable',
  };
}

function readWorkerSecretNames(environment: WorkerRuntimeTarget): string[] | null {
  if (environment === 'local') {
    return null;
  }

  const command = createPnpmCommand(['exec', 'wrangler', 'secret', 'list', '--env', environment, '--format', 'json']);
  const result = spawnSync(command.command, command.args, {
    cwd: backendDir,
    encoding: 'utf8',
    shell: false,
  });

  if (result.error || result.status !== 0) {
    return null;
  }

  return parseWranglerSecretNames(result.stdout);
}

function extractWranglerEnvironmentBlock(configText: string, environment: WorkerRuntimeTarget): string {
  if (environment === 'local') {
    const envMarker = '"env"';
    const envIndex = configText.indexOf(envMarker);
    return envIndex === -1 ? configText : configText.slice(0, envIndex);
  }

  const marker = `"${environment}"`;
  const markerIndex = configText.indexOf(marker);

  if (markerIndex === -1) {
    return '';
  }

  const blockStart = configText.indexOf('{', markerIndex);

  if (blockStart === -1) {
    return '';
  }

  let depth = 0;

  for (let index = blockStart; index < configText.length; index += 1) {
    const char = configText[index];

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
    }

    if (depth === 0) {
      return configText.slice(blockStart, index + 1);
    }
  }

  return '';
}

function createPnpmCommand(args: string[]): { args: string[]; command: string } {
  return process.platform === 'win32'
    ? { args: ['/d', '/s', '/c', 'pnpm', ...args], command: 'cmd.exe' }
    : { args, command: 'pnpm' };
}

function parseEnvironment(value: string | undefined): RuntimeConfigEnvironment {
  try {
    return parseProductEnvironmentCliTarget(value);
  } catch {
    throw new Error(
      'Runtime config verification requires --env local, uat, or prd. Legacy platform aliases accepted: sandbox, production.',
    );
  }
}

function getCheckoutReturnOrigins(environmentBlock: string): string[] {
  const match = /"CHECKOUT_RETURN_ORIGINS"\s*:\s*"(?<origins>[^"]*)"/.exec(environmentBlock);
  return (
    match?.groups?.origins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []
  );
}

function redactSensitiveValues(value: string): string {
  return value
    .replace(/re_[A-Za-z0-9_]+/g, 're_[redacted]')
    .replace(/sk_(test|live)_[A-Za-z0-9_]+/g, 'sk_$1_[redacted]')
    .replace(/whsec_[A-Za-z0-9_]+/g, '[redacted_stripe_webhook_secret]')
    .replace(/pmc_[A-Za-z0-9_]+/g, 'pmc_[redacted]');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main(): Promise<void> {
  const options = parseRuntimeConfigVerifyArgs(process.argv.slice(2));
  const workerDeploymentTarget = getProductEnvironmentProfile(options.environment).workerDeploymentTarget;
  const result = verifyRuntimeConfig({
    environment: options.environment,
    requireLiveSecrets: options.requireLiveSecrets,
    secretNames: readWorkerSecretNames(workerDeploymentTarget),
    wranglerConfigText: readFileSync(wranglerConfigPath, 'utf8'),
  });
  const report = formatRuntimeConfigVerificationReport(result);

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
