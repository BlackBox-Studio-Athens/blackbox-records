import type { Client as OpenFeatureClient } from '@openfeature/server-sdk';
import type { FlagshipBinding } from '@cloudflare/flagship/server';

import type { FeatureFlagReader } from '../spi';
import {
  isCheckoutLaunchApprovedFromBindings,
  productEnvironmentProfileFromBindings,
  type AppBindings,
  type ProductEnvironmentProfile,
} from '../../../../platform/env';
import type { AppLogger } from '../../../../platform/observability';

export const NATIVE_CHECKOUT_ENABLED_FLAG = 'native_checkout_enabled';

type BooleanFlagEvaluator =
  | (Pick<FlagshipBinding, 'getBooleanValue'> & Partial<Pick<FlagshipBinding, 'getBooleanDetails'>>)
  | (Pick<OpenFeatureClient, 'getBooleanValue'> & Partial<Pick<OpenFeatureClient, 'getBooleanDetails'>>);

export class CloudflareFeatureFlagReader implements FeatureFlagReader {
  public constructor(
    private readonly productEnvironmentProfile: ProductEnvironmentProfile,
    private readonly evaluator: BooleanFlagEvaluator | undefined,
    private readonly nativeCheckoutOverride: string | undefined,
    private readonly logger?: Pick<AppLogger, 'warn'>,
    private readonly nativeCheckoutAllowed = true,
  ) {}

  public async isNativeCheckoutEnabled(options?: { throwOnError?: boolean }): Promise<boolean> {
    if (!this.nativeCheckoutAllowed) {
      return false;
    }

    const defaultValue = isNativeCheckoutEnabledByDefault(this.productEnvironmentProfile);
    const override = parseBooleanOverride(this.nativeCheckoutOverride);

    if (override !== null) {
      return override;
    }

    if (!this.evaluator) {
      return defaultValue;
    }

    try {
      const context = {
        capability: 'native_checkout',
        productEnvironment: this.productEnvironmentProfile.productEnvironment,
        targetingKey: `blackbox-records-${this.productEnvironmentProfile.productEnvironment}`,
        workerDeploymentTarget: this.productEnvironmentProfile.workerDeploymentTarget,
      };
      if (options?.throwOnError) {
        if (!this.evaluator.getBooleanDetails) throw new Error('Checkout flag details are unavailable.');
        const details = await this.evaluator.getBooleanDetails(NATIVE_CHECKOUT_ENABLED_FLAG, defaultValue, context);
        if (details.errorCode || details.reason === 'ERROR') throw new Error('Checkout flag evaluation failed.');
        return details.value;
      }
      return await this.evaluator.getBooleanValue(NATIVE_CHECKOUT_ENABLED_FLAG, defaultValue, context);
    } catch {
      this.logger?.warn({
        capability: 'native_checkout',
        event: 'feature_gate_evaluation_failed',
        outcome: options?.throwOnError ? 'failed' : 'defaulted',
        safeReason: 'provider_error',
      });

      if (options?.throwOnError) throw new Error('Checkout flag evaluation is unavailable.');
      return defaultValue;
    }
  }
}

export function createFeatureFlagReader(
  bindings: Pick<AppBindings, 'PRODUCT_ENVIRONMENT' | 'FLAGS' | 'NATIVE_CHECKOUT_ENABLED' | 'PRD_LAUNCH_APPROVED'>,
  logger?: Pick<AppLogger, 'warn'>,
): FeatureFlagReader {
  return new CloudflareFeatureFlagReader(
    productEnvironmentProfileFromBindings(bindings),
    bindings.FLAGS,
    bindings.NATIVE_CHECKOUT_ENABLED,
    logger,
    isCheckoutLaunchApprovedFromBindings(bindings),
  );
}

export function isNativeCheckoutEnabledByDefault(productEnvironmentProfile: ProductEnvironmentProfile): boolean {
  return productEnvironmentProfile.nativeCheckoutEnabledByDefault;
}

export function parseBooleanOverride(value: string | undefined): boolean | null {
  const normalized = value?.trim().toLowerCase();

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return null;
}
