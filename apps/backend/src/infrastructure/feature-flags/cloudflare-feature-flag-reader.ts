import type { Client as OpenFeatureClient } from '@openfeature/server-sdk';
import type { FlagshipBinding } from '@cloudflare/flagship/server';

import type { FeatureFlagReader } from '../../application/commerce/checkout/spi';
import type { AppBindings, AppEnvironment } from '../../env';

export const NATIVE_CHECKOUT_ENABLED_FLAG = 'native_checkout_enabled';

type BooleanFlagEvaluator = Pick<FlagshipBinding, 'getBooleanValue'> | Pick<OpenFeatureClient, 'getBooleanValue'>;

export class CloudflareFeatureFlagReader implements FeatureFlagReader {
  public constructor(
    private readonly appEnvironment: AppEnvironment,
    private readonly evaluator: BooleanFlagEvaluator | undefined,
    private readonly nativeCheckoutOverride: string | undefined,
  ) {}

  public async isNativeCheckoutEnabled(): Promise<boolean> {
    const defaultValue = isNativeCheckoutEnabledByDefault(this.appEnvironment);
    const override = parseBooleanOverride(this.nativeCheckoutOverride);

    if (override !== null) {
      return override;
    }

    if (!this.evaluator) {
      return defaultValue;
    }

    try {
      return await this.evaluator.getBooleanValue(NATIVE_CHECKOUT_ENABLED_FLAG, defaultValue, {
        appEnvironment: this.appEnvironment,
        capability: 'native_checkout',
        targetingKey: `blackbox-records-${this.appEnvironment}`,
      });
    } catch {
      return defaultValue;
    }
  }
}

export function createFeatureFlagReader(
  bindings: Pick<AppBindings, 'APP_ENV' | 'FLAGS' | 'NATIVE_CHECKOUT_ENABLED'>,
): FeatureFlagReader {
  return new CloudflareFeatureFlagReader(bindings.APP_ENV, bindings.FLAGS, bindings.NATIVE_CHECKOUT_ENABLED);
}

export function isNativeCheckoutEnabledByDefault(appEnvironment: AppEnvironment): boolean {
  return appEnvironment === 'local';
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
