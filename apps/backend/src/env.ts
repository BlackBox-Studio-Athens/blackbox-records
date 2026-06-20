import type { OpenAPIHono } from '@hono/zod-openapi';
import type { FlagshipBinding } from '@cloudflare/flagship/server';
import { z } from 'zod';

export const productEnvironmentSchema = z.enum(['local', 'uat', 'prd']);
export const workerRuntimeTargetSchema = z.enum(['local', 'sandbox', 'production']);
export const providerModeSchema = z.enum(['mock', 'test', 'live']);
export const emailRoutingModeSchema = z.enum(['direct', 'uat-sink']);

export type ProductEnvironment = z.infer<typeof productEnvironmentSchema>;
export type WorkerRuntimeTarget = z.infer<typeof workerRuntimeTargetSchema>;
export type AppEnvironment = WorkerRuntimeTarget;
export type ProductEnvironmentLabel = 'Local' | 'UAT' | 'PRD';

export const productEnvironmentProfileSchema = z.object({
  catalogVerification: z.object({
    applyScheduledChanges: z.boolean(),
  }),
  emailProviderEnvironmentTag: workerRuntimeTargetSchema,
  emailRoutingMode: emailRoutingModeSchema,
  label: z.enum(['Local', 'UAT', 'PRD']),
  nativeCheckoutEnabledByDefault: z.boolean(),
  productEnvironment: productEnvironmentSchema,
  providerMode: providerModeSchema,
  requiresDeployedSecretsByDefault: z.boolean(),
  workerRuntimeTarget: workerRuntimeTargetSchema,
});

export type ProductEnvironmentProfile = z.infer<typeof productEnvironmentProfileSchema>;

const productEnvironmentProfileMapSchema = z.record(productEnvironmentSchema, productEnvironmentProfileSchema);

export const productEnvironmentProfiles = productEnvironmentProfileMapSchema.parse({
  local: {
    catalogVerification: {
      applyScheduledChanges: true,
    },
    emailProviderEnvironmentTag: 'local',
    emailRoutingMode: 'direct',
    label: 'Local',
    nativeCheckoutEnabledByDefault: true,
    productEnvironment: 'local',
    providerMode: 'mock',
    requiresDeployedSecretsByDefault: false,
    workerRuntimeTarget: 'local',
  },
  uat: {
    catalogVerification: {
      applyScheduledChanges: true,
    },
    emailProviderEnvironmentTag: 'sandbox',
    emailRoutingMode: 'uat-sink',
    label: 'UAT',
    nativeCheckoutEnabledByDefault: false,
    productEnvironment: 'uat',
    providerMode: 'test',
    requiresDeployedSecretsByDefault: true,
    workerRuntimeTarget: 'sandbox',
  },
  prd: {
    catalogVerification: {
      applyScheduledChanges: false,
    },
    emailProviderEnvironmentTag: 'production',
    emailRoutingMode: 'direct',
    label: 'PRD',
    nativeCheckoutEnabledByDefault: false,
    productEnvironment: 'prd',
    providerMode: 'live',
    requiresDeployedSecretsByDefault: false,
    workerRuntimeTarget: 'production',
  },
});

export function getProductEnvironmentProfile(productEnvironment: ProductEnvironment): ProductEnvironmentProfile {
  return productEnvironmentProfiles[productEnvironment];
}

export function productEnvironmentFromWorkerRuntimeTarget(
  workerRuntimeTarget: WorkerRuntimeTarget,
): ProductEnvironment {
  if (workerRuntimeTarget === 'production') {
    return 'prd';
  }

  if (workerRuntimeTarget === 'sandbox') {
    return 'uat';
  }

  return 'local';
}

export function productEnvironmentProfileFromWorkerRuntimeTarget(
  workerRuntimeTarget: WorkerRuntimeTarget,
): ProductEnvironmentProfile {
  return getProductEnvironmentProfile(productEnvironmentFromWorkerRuntimeTarget(workerRuntimeTarget));
}

export function workerRuntimeTargetForProductEnvironment(productEnvironment: ProductEnvironment): WorkerRuntimeTarget {
  return getProductEnvironmentProfile(productEnvironment).workerRuntimeTarget;
}

export function parseProductEnvironmentCliTarget(value: string | undefined): ProductEnvironment {
  if (value === 'sandbox') {
    return 'uat';
  }

  if (value === 'production') {
    return 'prd';
  }

  return productEnvironmentSchema.parse(value);
}

export type AppBindings = {
  APP_ENV: WorkerRuntimeTarget;
  COMMERCE_DB: D1Database;
  CHECKOUT_RETURN_ORIGINS?: string;
  FLAGS?: FlagshipBinding;
  NATIVE_CHECKOUT_ENABLED?: string;
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
};

export type AppOpenApi = OpenAPIHono<AppEnv>;
