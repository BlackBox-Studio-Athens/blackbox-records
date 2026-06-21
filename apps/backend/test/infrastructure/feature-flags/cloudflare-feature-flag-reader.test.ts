import { describe, expect, it, vi } from 'vitest';

import {
  CloudflareFeatureFlagReader,
  isNativeCheckoutEnabledByDefault,
  NATIVE_CHECKOUT_ENABLED_FLAG,
  parseBooleanOverride,
} from '../../../src/infrastructure/feature-flags';
import { productEnvironmentProfiles } from '../../../src/env';

describe('CloudflareFeatureFlagReader', () => {
  it('defaults local checkout to enabled when no provider binding is configured', async () => {
    await expect(
      new CloudflareFeatureFlagReader(productEnvironmentProfiles.LOCAL, undefined, undefined).isNativeCheckoutEnabled(),
    ).resolves.toBe(true);
    expect(isNativeCheckoutEnabledByDefault(productEnvironmentProfiles.LOCAL)).toBe(true);
  });

  it('defaults sandbox and production checkout to disabled when no provider binding is configured', async () => {
    await expect(
      new CloudflareFeatureFlagReader(productEnvironmentProfiles.UAT, undefined, undefined).isNativeCheckoutEnabled(),
    ).resolves.toBe(false);
    await expect(
      new CloudflareFeatureFlagReader(productEnvironmentProfiles.PRD, undefined, undefined).isNativeCheckoutEnabled(),
    ).resolves.toBe(false);
  });

  it('uses an explicit runtime override before provider evaluation', async () => {
    const evaluator = {
      getBooleanValue: vi.fn(async () => false),
    };

    await expect(
      new CloudflareFeatureFlagReader(productEnvironmentProfiles.UAT, evaluator, 'true').isNativeCheckoutEnabled(),
    ).resolves.toBe(true);

    expect(evaluator.getBooleanValue).not.toHaveBeenCalled();
    expect(parseBooleanOverride(' TRUE ')).toBe(true);
    expect(parseBooleanOverride('false')).toBe(false);
    expect(parseBooleanOverride('')).toBeNull();
  });

  it('uses the provider value when the Flagship binding can evaluate the native checkout flag', async () => {
    const evaluator = {
      getBooleanValue: vi.fn(async () => true),
    };

    await expect(
      new CloudflareFeatureFlagReader(productEnvironmentProfiles.UAT, evaluator, undefined).isNativeCheckoutEnabled(),
    ).resolves.toBe(true);

    expect(evaluator.getBooleanValue).toHaveBeenCalledExactlyOnceWith(NATIVE_CHECKOUT_ENABLED_FLAG, false, {
      capability: 'native_checkout',
      productEnvironment: 'UAT',
      targetingKey: 'blackbox-records-UAT',
      workerDeploymentTarget: 'sandbox',
    });
  });

  it('falls back to the environment default when provider evaluation fails', async () => {
    const evaluator = {
      getBooleanValue: vi.fn(async () => {
        throw new Error('Flagship unavailable');
      }),
    };

    await expect(
      new CloudflareFeatureFlagReader(productEnvironmentProfiles.PRD, evaluator, undefined).isNativeCheckoutEnabled(),
    ).resolves.toBe(false);
  });
});
