import type { Client as OpenFeatureClient } from '@openfeature/server-sdk';
import type { FlagshipBinding } from '@cloudflare/flagship/server';

import type { FeatureFlagReader } from '../../application/commerce/checkout/spi';
import { productEnvironmentProfileFromBindings, type AppBindings, type ProductEnvironmentProfile } from '../../env';

export const NATIVE_CHECKOUT_ENABLED_FLAG = 'native_checkout_enabled';

type BooleanFlagEvaluator = Pick<FlagshipBinding, 'getBooleanValue'> | Pick<OpenFeatureClient, 'getBooleanValue'>;

export class CloudflareFeatureFlagReader implements FeatureFlagReader {
  public constructor(
    private readonly productEnvironmentProfile: ProductEnvironmentProfile,
    private readonly evaluator: BooleanFlagEvaluator | undefined,
    private readonly nativeCheckoutOverride: string | undefined,
  ) {}

  public async isNativeCheckoutEnabled(): Promise<boolean> {
    const defaultValue = isNativeCheckoutEnabledByDefault(this.productEnvironmentProfile);
    const override = parseBooleanOverride(this.nativeCheckoutOverride);

    if (override !== null) {
      return override;
    }

    if (!this.evaluator) {
      return defaultValue;
    }

    try {
      return await this.evaluator.getBooleanValue(NATIVE_CHECKOUT_ENABLED_FLAG, defaultValue, {
        capability: 'native_checkout',
        productEnvironment: this.productEnvironmentProfile.productEnvironment,
        targetingKey: `blackbox-records-${this.productEnvironmentProfile.productEnvironment}`,
        workerDeploymentTarget: this.productEnvironmentProfile.workerDeploymentTarget,
      });
    } catch {
      return defaultValue;
    }
  }
}

export function createFeatureFlagReader(
  bindings: Pick<AppBindings, 'PRODUCT_ENVIRONMENT' | 'FLAGS' | 'NATIVE_CHECKOUT_ENABLED'>,
): FeatureFlagReader {
  return new CloudflareFeatureFlagReader(
    productEnvironmentProfileFromBindings(bindings),
    bindings.FLAGS,
    bindings.NATIVE_CHECKOUT_ENABLED,
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
