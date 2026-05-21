import process from 'node:process';
import { pathToFileURL } from 'node:url';

export type StripeDisplayPreference = {
  overridable?: boolean | null;
  preference?: string | null;
  value?: string | null;
};

export type StripePaymentMethodSettings = {
  available?: boolean | null;
  display_preference?: StripeDisplayPreference | null;
};

export type StripePaymentMethodConfiguration = {
  active?: boolean | null;
  id: string;
  is_default?: boolean | null;
  livemode?: boolean | null;
  name?: string | null;
  object?: string | null;
  [key: string]: unknown;
};

export type StripePaymentMethodConfigurationClient = {
  create(params: StripePaymentMethodConfigurationMutationParams): Promise<StripePaymentMethodConfiguration>;
  list(): Promise<StripePaymentMethodConfiguration[]>;
  retrieve(id: string): Promise<StripePaymentMethodConfiguration>;
  update(id: string, params: StripePaymentMethodConfigurationMutationParams): Promise<StripePaymentMethodConfiguration>;
};

export type StripePaymentMethodConfigurationMutationParams = Record<string, string>;

export type StripePaymentMethodPolicy = 'allowed' | 'banned' | 'other';

export type StripePaymentMethodAssessment = {
  available: boolean | null;
  displayPreference: {
    preference: string | null;
    value: string | null;
  };
  effectivelyOn: boolean;
  key: string;
  policy: StripePaymentMethodPolicy;
};

export type StripePaymentMethodConfigurationVerificationResult = {
  assessments: StripePaymentMethodAssessment[];
  configuration: StripePaymentMethodConfiguration | null;
  dryRun: boolean;
  gaps: string[];
  issues: string[];
  mutation: 'create' | 'none' | 'update';
};

export type VerifyStripePaymentMethodConfigurationInput = {
  apply: boolean;
  client: StripePaymentMethodConfigurationClient;
  configurationId: string | null;
  configurationName?: string;
};

const defaultConfigurationName = 'BlackBox merch checkout';
const allowedMethodKeys = ['card', 'apple_pay', 'google_pay', 'link'] as const;
const allowedMethodKeySet = new Set<string>(allowedMethodKeys);
const reservedConfigurationKeys = new Set([
  'active',
  'application',
  'created',
  'id',
  'is_default',
  'livemode',
  'name',
  'object',
  'parent',
  'updated',
]);
const explicitlyBannedMethodKeys = new Set([
  'affirm',
  'afterpay_clearpay',
  'alma',
  'apple_pay_later',
  'billie',
  'klarna',
  'paypal',
  'zip',
]);
const bannedMethodKeyPatterns = [
  /(^|_)bank($|_)/,
  /(^|_)debit($|_)/,
  /(^|_)mandate($|_)/,
  /^acss_/,
  /^au_becs_/,
  /^bacs_/,
  /^becs_/,
  /^fpx$/,
  /^sepa_/,
  /^sofort$/,
  /^us_bank_account$/,
  /^customer_balance$/,
];

export class StripePaymentMethodConfigurationVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StripePaymentMethodConfigurationVerificationError';
  }
}

export async function verifyStripePaymentMethodConfiguration(
  input: VerifyStripePaymentMethodConfigurationInput,
): Promise<StripePaymentMethodConfigurationVerificationResult> {
  const configurationName = input.configurationName ?? defaultConfigurationName;
  const configurationId = normalizeOptionalValue(input.configurationId);
  let mutation: StripePaymentMethodConfigurationVerificationResult['mutation'] = 'none';

  if (configurationId) {
    const existingConfiguration = await input.client.retrieve(configurationId);

    if (!input.apply) {
      return analyzeConfiguration(existingConfiguration, { dryRun: true, mutation });
    }

    mutation = 'update';
    const updatedConfiguration = await input.client.update(
      existingConfiguration.id,
      buildMutationParams(existingConfiguration, configurationName),
    );

    return analyzeConfiguration(updatedConfiguration, { dryRun: false, mutation });
  }

  const matchingConfiguration = (await input.client.list()).find(
    (configuration) => configuration.name === configurationName,
  );

  if (matchingConfiguration && !input.apply) {
    const result = analyzeConfiguration(matchingConfiguration, { dryRun: true, mutation });
    result.gaps.push(
      `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID is not set; CI and Worker runtime should use ${redactStripeObjectId(
        matchingConfiguration.id,
      )}.`,
    );

    return result;
  }

  if (matchingConfiguration && input.apply) {
    mutation = 'update';
    const updatedConfiguration = await input.client.update(
      matchingConfiguration.id,
      buildMutationParams(matchingConfiguration, configurationName),
    );

    return analyzeConfiguration(updatedConfiguration, { dryRun: false, mutation });
  }

  if (!input.apply) {
    return {
      assessments: [],
      configuration: null,
      dryRun: true,
      gaps: [
        `No Payment Method Configuration named "${configurationName}" was found.`,
        'Run with --apply to create it, or set STRIPE_PAYMENT_METHOD_CONFIGURATION_ID to verify an existing configuration.',
      ],
      issues: [],
      mutation,
    };
  }

  mutation = 'create';
  const createdConfiguration = await input.client.create(buildMutationParams(null, configurationName));

  return analyzeConfiguration(createdConfiguration, { dryRun: false, mutation });
}

export function analyzeConfiguration(
  configuration: StripePaymentMethodConfiguration,
  options: Pick<StripePaymentMethodConfigurationVerificationResult, 'dryRun' | 'mutation'>,
): StripePaymentMethodConfigurationVerificationResult {
  const assessments = getPaymentMethodAssessments(configuration);
  const issues = assessments
    .filter((assessment) => assessment.policy !== 'allowed' && assessment.effectivelyOn)
    .map((assessment) =>
      assessment.policy === 'banned'
        ? `Banned payment method ${assessment.key} is effectively on.`
        : `Unapproved payment method ${assessment.key} is effectively on.`,
    );
  const gaps = readConfigurationGaps(assessments);

  return {
    assessments,
    configuration,
    dryRun: options.dryRun,
    gaps,
    issues,
    mutation: options.mutation,
  };
}

export function formatStripePaymentMethodConfigurationReport(
  result: StripePaymentMethodConfigurationVerificationResult,
): string {
  const status = result.issues.length ? 'failed' : 'OK';
  const configurationLabel = result.configuration
    ? `${redactStripeObjectId(result.configuration.id)} (${result.configuration.name ?? 'unnamed'})`
    : 'not found';
  const lines = [
    `Stripe Payment Method Configuration verification ${status}.`,
    `Mode: ${result.dryRun ? 'dry-run' : 'apply'}`,
    `Mutation: ${result.mutation}`,
    `Configuration: ${configurationLabel}`,
  ];

  if (result.assessments.length) {
    lines.push('', 'Returned payment methods:');
    lines.push(
      ...result.assessments.map(
        (assessment) =>
          `- ${assessment.key}: ${assessment.policy}, available=${formatNullableBoolean(
            assessment.available,
          )}, preference=${assessment.displayPreference.preference ?? 'unknown'}, value=${
            assessment.displayPreference.value ?? 'unknown'
          }`,
      ),
    );
  }

  if (result.gaps.length) {
    lines.push('', 'Gaps:');
    lines.push(...result.gaps.map((gap) => `- ${gap}`));
  }

  if (result.issues.length) {
    lines.push('', 'Issues:');
    lines.push(...result.issues.map((issue) => `- ${issue}`));
  }

  return lines.join('\n');
}

export function buildMutationParams(
  configuration: StripePaymentMethodConfiguration | null,
  configurationName = defaultConfigurationName,
): StripePaymentMethodConfigurationMutationParams {
  const params: StripePaymentMethodConfigurationMutationParams = {
    name: configurationName,
  };
  const methodKeys = new Set<string>([
    ...allowedMethodKeys,
    ...explicitlyBannedMethodKeys,
    ...(configuration ? getPaymentMethodKeys(configuration).filter(isBannedPaymentMethodKey) : []),
  ]);

  for (const key of methodKeys) {
    params[`${key}[display_preference][preference]`] = allowedMethodKeySet.has(key) ? 'on' : 'off';
  }

  return params;
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

export function createStripePaymentMethodConfigurationRestClient(
  secretKey: string,
): StripePaymentMethodConfigurationClient {
  const normalizedSecretKey = normalizeOptionalValue(secretKey);

  if (!normalizedSecretKey) {
    throw new StripePaymentMethodConfigurationVerificationError('STRIPE_SECRET_KEY is required.');
  }

  return {
    async create(params) {
      return requestStripeApi(normalizedSecretKey, 'POST', '/v1/payment_method_configurations', params);
    },
    async list() {
      const response = await requestStripeApi<{ data?: StripePaymentMethodConfiguration[] }>(
        normalizedSecretKey,
        'GET',
        '/v1/payment_method_configurations?limit=100',
      );

      return response.data ?? [];
    },
    async retrieve(id) {
      return requestStripeApi(
        normalizedSecretKey,
        'GET',
        `/v1/payment_method_configurations/${encodeURIComponent(id)}`,
      );
    },
    async update(id, params) {
      return requestStripeApi(
        normalizedSecretKey,
        'POST',
        `/v1/payment_method_configurations/${encodeURIComponent(id)}`,
        params,
      );
    },
  };
}

function getPaymentMethodAssessments(configuration: StripePaymentMethodConfiguration): StripePaymentMethodAssessment[] {
  return getPaymentMethodKeys(configuration)
    .map((key) => {
      const settings = configuration[key] as StripePaymentMethodSettings;
      const displayPreference = settings.display_preference ?? {};
      const value = normalizeOptionalValue(displayPreference.value);
      const preference = normalizeOptionalValue(displayPreference.preference);

      return {
        available: typeof settings.available === 'boolean' ? settings.available : null,
        displayPreference: {
          preference,
          value,
        },
        effectivelyOn: settings.available === true || value === 'on' || preference === 'on',
        key,
        policy: classifyPaymentMethodKey(key),
      };
    })
    .sort((left, right) => left.key.localeCompare(right.key));
}

function getPaymentMethodKeys(configuration: StripePaymentMethodConfiguration): string[] {
  return Object.entries(configuration)
    .filter(([key, value]) => !reservedConfigurationKeys.has(key) && isPaymentMethodSettings(value))
    .map(([key]) => key);
}

function isPaymentMethodSettings(value: unknown): value is StripePaymentMethodSettings {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'available' in value || 'display_preference' in value;
}

function classifyPaymentMethodKey(key: string): StripePaymentMethodPolicy {
  if (allowedMethodKeySet.has(key)) {
    return 'allowed';
  }

  if (isBannedPaymentMethodKey(key)) {
    return 'banned';
  }

  return 'other';
}

function isBannedPaymentMethodKey(key: string): boolean {
  return explicitlyBannedMethodKeys.has(key) || bannedMethodKeyPatterns.some((pattern) => pattern.test(key));
}

function readConfigurationGaps(assessments: StripePaymentMethodAssessment[]): string[] {
  const gaps: string[] = [];
  const assessmentByKey = new Map(assessments.map((assessment) => [assessment.key, assessment]));

  for (const key of allowedMethodKeys) {
    const assessment = assessmentByKey.get(key);

    if (!assessment) {
      gaps.push(`Allowed payment method ${key} was not returned by Stripe.`);
      continue;
    }

    if (!assessment.effectivelyOn) {
      gaps.push(`Allowed payment method ${key} is not effectively on.`);
    }
  }

  return gaps;
}

async function requestStripeApi<T = StripePaymentMethodConfiguration>(
  secretKey: string,
  method: 'GET' | 'POST',
  path: string,
  params?: StripePaymentMethodConfigurationMutationParams,
): Promise<T> {
  const response = await fetch(`https://api.stripe.com${path}`, {
    body: params ? new URLSearchParams(params) : undefined,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(params ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    method,
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new StripePaymentMethodConfigurationVerificationError(
      `Stripe API request failed (${response.status}): ${redactSensitiveValues(responseText)}`,
    );
  }

  return JSON.parse(responseText) as T;
}

function formatNullableBoolean(value: boolean | null): string {
  return value === null ? 'unknown' : String(value);
}

function normalizeOptionalValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function redactSensitiveValues(value: string): string {
  return value
    .replace(/sk_(test|live)_[A-Za-z0-9_]+/g, 'sk_$1_[redacted]')
    .replace(/pmc_[A-Za-z0-9_]+/g, (match) => redactStripeObjectId(match));
}

function parseApplyFlag(argv: string[]): boolean {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Usage: pnpm stripe:payment-methods:verify [--apply]');
    process.exit(0);
  }

  return argv.includes('--apply');
}

async function main() {
  const apply = parseApplyFlag(process.argv.slice(2));
  const client = createStripePaymentMethodConfigurationRestClient(process.env.STRIPE_SECRET_KEY ?? '');
  const result = await verifyStripePaymentMethodConfiguration({
    apply,
    client,
    configurationId: process.env.STRIPE_PAYMENT_METHOD_CONFIGURATION_ID ?? null,
  });
  const report = formatStripePaymentMethodConfigurationReport(result);

  if (result.issues.length) {
    console.error(report);
    process.exit(1);
  }

  console.log(report);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
