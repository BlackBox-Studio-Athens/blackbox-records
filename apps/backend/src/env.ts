import type { OpenAPIHono } from '@hono/zod-openapi';
import type { FlagshipBinding } from '@cloudflare/flagship/server';
import type { RequestIdVariables } from 'hono/request-id';
import { z } from 'zod';

export const productEnvironmentSchema = z.enum(['LOCAL', 'UAT', 'PRD']);
export const workerRuntimeTargetSchema = z.enum(['local', 'uat', 'prd']);
export const stripeModeSchema = workerRuntimeTargetSchema;
export const emailDeliveryPolicySchema = z.enum(['direct', 'uat-sink']);
const absoluteHttpsUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => new URL(value).protocol === 'https:', {
    message: 'Use an absolute HTTPS URL.',
  });

export type ProductEnvironment = z.infer<typeof productEnvironmentSchema>;
export type WorkerRuntimeTarget = z.infer<typeof workerRuntimeTargetSchema>;
export type AppEnvironment = ProductEnvironment;

export const productEnvironmentProfileSchema = z.object({
  catalogVerificationPolicy: z.object({
    applyScheduledChanges: z.boolean(),
  }),
  emailDeliveryPolicy: emailDeliveryPolicySchema,
  emailBrand: z.object({
    homeUrl: absoluteHttpsUrlSchema,
    logoUrl: absoluteHttpsUrlSchema,
  }),
  emailProviderTag: workerRuntimeTargetSchema,
  nativeCheckoutEnabledByDefault: z.boolean(),
  productEnvironment: productEnvironmentSchema,
  stripeMode: stripeModeSchema,
  requiresDeployedSecretsByDefault: z.boolean(),
  workerDeploymentTarget: workerRuntimeTargetSchema,
});

export type ProductEnvironmentProfile = z.infer<typeof productEnvironmentProfileSchema>;

const productEnvironmentProfileMapSchema = z.record(productEnvironmentSchema, productEnvironmentProfileSchema);

export const productEnvironmentProfiles = productEnvironmentProfileMapSchema.parse({
  LOCAL: {
    catalogVerificationPolicy: {
      applyScheduledChanges: true,
    },
    emailDeliveryPolicy: 'direct',
    emailBrand: {
      homeUrl: 'https://blackbox-studio-athens.github.io/blackbox-records/',
      logoUrl: 'https://blackbox-studio-athens.github.io/blackbox-records/assets/images/brand/logo-horizontal.png',
    },
    emailProviderTag: 'local',
    nativeCheckoutEnabledByDefault: true,
    productEnvironment: 'LOCAL',
    stripeMode: 'local',
    requiresDeployedSecretsByDefault: false,
    workerDeploymentTarget: 'local',
  },
  UAT: {
    catalogVerificationPolicy: {
      applyScheduledChanges: false,
    },
    emailDeliveryPolicy: 'uat-sink',
    emailBrand: {
      homeUrl: 'https://blackbox-studio-athens.github.io/blackbox-records/',
      logoUrl: 'https://blackbox-studio-athens.github.io/blackbox-records/assets/images/brand/logo-horizontal.png',
    },
    emailProviderTag: 'uat',
    nativeCheckoutEnabledByDefault: false,
    productEnvironment: 'UAT',
    stripeMode: 'uat',
    requiresDeployedSecretsByDefault: true,
    workerDeploymentTarget: 'uat',
  },
  PRD: {
    catalogVerificationPolicy: {
      applyScheduledChanges: false,
    },
    emailDeliveryPolicy: 'direct',
    emailBrand: {
      homeUrl: 'https://blackbox-records-web.pages.dev/',
      logoUrl: 'https://blackbox-records-web.pages.dev/assets/images/brand/logo-horizontal.png',
    },
    emailProviderTag: 'prd',
    nativeCheckoutEnabledByDefault: false,
    productEnvironment: 'PRD',
    stripeMode: 'prd',
    requiresDeployedSecretsByDefault: false,
    workerDeploymentTarget: 'prd',
  },
});

export function getProductEnvironmentProfile(productEnvironment: ProductEnvironment): ProductEnvironmentProfile {
  return productEnvironmentProfiles[productEnvironment];
}

export function productEnvironmentFromWorkerRuntimeTarget(
  workerRuntimeTarget: WorkerRuntimeTarget,
): ProductEnvironment {
  if (workerRuntimeTarget === 'prd') {
    return 'PRD';
  }

  if (workerRuntimeTarget === 'uat') {
    return 'UAT';
  }

  return 'LOCAL';
}

export function productEnvironmentProfileFromWorkerRuntimeTarget(
  workerRuntimeTarget: WorkerRuntimeTarget,
): ProductEnvironmentProfile {
  return getProductEnvironmentProfile(productEnvironmentFromWorkerRuntimeTarget(workerRuntimeTarget));
}

export function workerRuntimeTargetForProductEnvironment(productEnvironment: ProductEnvironment): WorkerRuntimeTarget {
  return getProductEnvironmentProfile(productEnvironment).workerDeploymentTarget;
}

export function parseProductEnvironmentCliTarget(value: string | undefined): ProductEnvironment {
  const normalized = value?.trim().toLowerCase();

  if (normalized === 'uat' || normalized === 'sandbox') {
    return 'UAT';
  }

  if (normalized === 'prd' || normalized === 'production') {
    return 'PRD';
  }

  return productEnvironmentSchema.parse(normalized?.toUpperCase());
}

export function formatProductEnvironmentLabel(productEnvironment: ProductEnvironment): string {
  return productEnvironment === 'LOCAL' ? 'Local' : productEnvironment;
}

export function productEnvironmentProfileFromBindings(
  bindings: Pick<AppBindings, 'PRODUCT_ENVIRONMENT'>,
): ProductEnvironmentProfile {
  return getProductEnvironmentProfile(productEnvironmentSchema.parse(bindings.PRODUCT_ENVIRONMENT));
}

export type AppBindings = {
  PRODUCT_ENVIRONMENT: ProductEnvironment;
  COMMERCE_DB: D1Database;
  CHECKOUT_RETURN_ORIGINS?: string;
  FLAGS?: FlagshipBinding;
  NATIVE_CHECKOUT_ENABLED?: string;
  EMAIL_BRAND_HOME_URL?: string;
  EMAIL_BRAND_LOGO_URL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  RESEND_NEWSLETTER_SEGMENT_ID?: string;
  RESEND_NEWSLETTER_TOPIC_ID?: string;
  RESEND_OPS_TO_EMAIL?: string;
  RESEND_REPLY_TO_EMAIL?: string;
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL?: string;
  STRIPE_API_BASE_URL?: string;
  STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET?: string;
};

export type AppEnv = {
  Bindings: AppBindings;
  Variables: RequestIdVariables;
};

export type AppOpenApi = OpenAPIHono<AppEnv>;
