import type { OpenAPIHono } from '@hono/zod-openapi';
import type { FlagshipBinding } from '@cloudflare/flagship/server';
import { z } from 'zod';

export const productEnvironmentSchema = z.enum(['LOCAL', 'UAT', 'PRD']);
export const workerRuntimeTargetSchema = z.enum(['local', 'sandbox', 'production']);
export const stripeModeSchema = z.enum(['mock', 'test', 'live']);
export const emailDeliveryPolicySchema = z.enum(['direct', 'uat-sink']);

export type ProductEnvironment = z.infer<typeof productEnvironmentSchema>;
export type WorkerRuntimeTarget = z.infer<typeof workerRuntimeTargetSchema>;
export type AppEnvironment = ProductEnvironment;

export const productEnvironmentProfileSchema = z.object({
  catalogVerificationPolicy: z.object({
    applyScheduledChanges: z.boolean(),
  }),
  emailDeliveryPolicy: emailDeliveryPolicySchema,
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
    emailProviderTag: 'local',
    nativeCheckoutEnabledByDefault: true,
    productEnvironment: 'LOCAL',
    stripeMode: 'mock',
    requiresDeployedSecretsByDefault: false,
    workerDeploymentTarget: 'local',
  },
  UAT: {
    catalogVerificationPolicy: {
      applyScheduledChanges: true,
    },
    emailDeliveryPolicy: 'uat-sink',
    emailProviderTag: 'sandbox',
    nativeCheckoutEnabledByDefault: false,
    productEnvironment: 'UAT',
    stripeMode: 'test',
    requiresDeployedSecretsByDefault: true,
    workerDeploymentTarget: 'sandbox',
  },
  PRD: {
    catalogVerificationPolicy: {
      applyScheduledChanges: false,
    },
    emailDeliveryPolicy: 'direct',
    emailProviderTag: 'production',
    nativeCheckoutEnabledByDefault: false,
    productEnvironment: 'PRD',
    stripeMode: 'live',
    requiresDeployedSecretsByDefault: false,
    workerDeploymentTarget: 'production',
  },
});

export function getProductEnvironmentProfile(productEnvironment: ProductEnvironment): ProductEnvironmentProfile {
  return productEnvironmentProfiles[productEnvironment];
}

export function productEnvironmentFromWorkerRuntimeTarget(
  workerRuntimeTarget: WorkerRuntimeTarget,
): ProductEnvironment {
  if (workerRuntimeTarget === 'production') {
    return 'PRD';
  }

  if (workerRuntimeTarget === 'sandbox') {
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

  if (normalized === 'sandbox') {
    return 'UAT';
  }

  if (normalized === 'production') {
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
