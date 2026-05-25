import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export type RuntimeConfigEnvironment = 'production' | 'sandbox';
export type RuntimeConfigStatus = 'missing' | 'not_applicable' | 'present' | 'unverified';

export type RuntimeConfigCategory = {
  detail?: string;
  name:
    | 'CHECKOUT_RETURN_ORIGINS'
    | 'COMMERCE_DB'
    | 'FLAGS'
    | 'PRODUCTION_CATALOG_CRON'
    | 'STRIPE_PAYMENT_METHOD_CONFIGURATION_ID'
    | 'STRIPE_SECRET_KEY'
    | 'STRIPE_WEBHOOK_SECRET';
  status: RuntimeConfigStatus;
};

export type RuntimeConfigVerificationResult = {
  categories: RuntimeConfigCategory[];
  environment: RuntimeConfigEnvironment;
  issues: string[];
};

const rootDir = process.cwd();
const backendDir = path.join(rootDir, 'apps', 'backend');
const wranglerConfigPath = path.join(backendDir, 'wrangler.jsonc');

export function parseRuntimeConfigVerifyArgs(args: string[]): { environment: RuntimeConfigEnvironment } {
  let environment: RuntimeConfigEnvironment | null = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log('Usage: pnpm runtime:config:verify --env sandbox|production');
      process.exit(0);
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
    throw new Error('Runtime config verification requires --env sandbox or --env production.');
  }

  return { environment };
}

export function verifyRuntimeConfig(input: {
  environment: RuntimeConfigEnvironment;
  env?: NodeJS.ProcessEnv;
  secretNames: readonly string[] | null;
  wranglerConfigText: string;
}): RuntimeConfigVerificationResult {
  const env = input.env ?? process.env;
  const environmentBlock = extractWranglerEnvironmentBlock(input.wranglerConfigText, input.environment);
  const categories: RuntimeConfigCategory[] = [
    classifyProcessEnvPresence('STRIPE_PAYMENT_METHOD_CONFIGURATION_ID', env.STRIPE_PAYMENT_METHOD_CONFIGURATION_ID),
    classifySecretPresence('STRIPE_SECRET_KEY', input.secretNames),
    classifySecretPresence('STRIPE_WEBHOOK_SECRET', input.secretNames),
    classifyWranglerTextPresence('CHECKOUT_RETURN_ORIGINS', environmentBlock),
    classifyWranglerTextPresence('COMMERCE_DB', environmentBlock, /"binding"\s*:\s*"COMMERCE_DB"/),
    classifyFlagsPresence(environmentBlock),
    classifyProductionCronPresence(input.environment, environmentBlock),
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
  };
}

export function formatRuntimeConfigVerificationReport(result: RuntimeConfigVerificationResult): string {
  const lines = [
    `Runtime config verification ${result.issues.length ? 'failed' : 'OK'}.`,
    `Environment: ${result.environment}`,
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

function classifyProcessEnvPresence(
  name: RuntimeConfigCategory['name'],
  value: string | undefined,
): RuntimeConfigCategory {
  return {
    name,
    status: value?.trim() ? 'present' : 'missing',
  };
}

function classifySecretPresence(
  name: Extract<RuntimeConfigCategory['name'], 'STRIPE_SECRET_KEY' | 'STRIPE_WEBHOOK_SECRET'>,
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

function classifyProductionCronPresence(
  environment: RuntimeConfigEnvironment,
  environmentBlock: string,
): RuntimeConfigCategory {
  if (environment !== 'production') {
    return {
      detail: 'Only production cron backstop is classified here.',
      name: 'PRODUCTION_CATALOG_CRON',
      status: 'not_applicable',
    };
  }

  const hasCron = /"crons"\s*:/.test(environmentBlock);

  return {
    detail: hasCron ? undefined : 'Production promotion does not currently rely on a cron backstop.',
    name: 'PRODUCTION_CATALOG_CRON',
    status: hasCron ? 'present' : 'not_applicable',
  };
}

function readWorkerSecretNames(environment: RuntimeConfigEnvironment): string[] | null {
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

function extractWranglerEnvironmentBlock(configText: string, environment: RuntimeConfigEnvironment): string {
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
  if (value === 'sandbox' || value === 'production') {
    return value;
  }

  throw new Error('Runtime config verification requires --env sandbox or production.');
}

function redactSensitiveValues(value: string): string {
  return value
    .replace(/sk_(test|live)_[A-Za-z0-9_]+/g, 'sk_$1_[redacted]')
    .replace(/whsec_[A-Za-z0-9_]+/g, '[redacted_stripe_webhook_secret]')
    .replace(/pmc_[A-Za-z0-9_]+/g, 'pmc_[redacted]');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main(): Promise<void> {
  const options = parseRuntimeConfigVerifyArgs(process.argv.slice(2));
  const result = verifyRuntimeConfig({
    environment: options.environment,
    secretNames: readWorkerSecretNames(options.environment),
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
