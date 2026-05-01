import type { Client as OpenFeatureClient } from '@openfeature/server-sdk';
import type { FlagshipBinding } from '@cloudflare/flagship/server';

import type { FeatureFlagReader } from '../../application/commerce/checkout';
import type { AppBindings, AppEnvironment } from '../../env';

export const NATIVE_CHECKOUT_ENABLED_FLAG = 'native_checkout_enabled';

type BooleanFlagEvaluator = Pick<FlagshipBinding, 'getBooleanValue'> | Pick<OpenFeatureClient, 'getBooleanValue'>;

export class CloudflareFeatureFlagReader implements FeatureFlagReader {
  public constructor(
    private readonly appEnvironment: AppEnvironment,
    private readonly evaluator: BooleanFlagEvaluator | undefined,
  ) {}

  public async isNativeCheckoutEnabled(): Promise<boolean> {
    const defaultValue = isNativeCheckoutEnabledByDefault(this.appEnvironment);

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

export function createFeatureFlagReader(bindings: Pick<AppBindings, 'APP_ENV' | 'FLAGS'>): FeatureFlagReader {
  return new CloudflareFeatureFlagReader(bindings.APP_ENV, bindings.FLAGS);
}

export function isNativeCheckoutEnabledByDefault(appEnvironment: AppEnvironment): boolean {
  return appEnvironment === 'local';
}
