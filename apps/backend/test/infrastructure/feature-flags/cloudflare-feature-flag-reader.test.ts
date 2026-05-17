import { describe, expect, it, vi } from 'vitest';

import {
  CloudflareFeatureFlagReader,
  isNativeCheckoutEnabledByDefault,
  NATIVE_CHECKOUT_ENABLED_FLAG,
  parseBooleanOverride,
} from '../../../src/infrastructure/feature-flags';

describe('CloudflareFeatureFlagReader', () => {
  it('defaults local checkout to enabled when no provider binding is configured', async () => {
    await expect(
      new CloudflareFeatureFlagReader('local', undefined, undefined).isNativeCheckoutEnabled(),
    ).resolves.toBe(true);
    expect(isNativeCheckoutEnabledByDefault('local')).toBe(true);
  });

  it('defaults sandbox and production checkout to disabled when no provider binding is configured', async () => {
    await expect(
      new CloudflareFeatureFlagReader('sandbox', undefined, undefined).isNativeCheckoutEnabled(),
    ).resolves.toBe(false);
    await expect(
      new CloudflareFeatureFlagReader('production', undefined, undefined).isNativeCheckoutEnabled(),
    ).resolves.toBe(false);
  });

  it('uses an explicit runtime override before provider evaluation', async () => {
    const evaluator = {
      getBooleanValue: vi.fn(async () => false),
    };

    await expect(new CloudflareFeatureFlagReader('sandbox', evaluator, 'true').isNativeCheckoutEnabled()).resolves.toBe(
      true,
    );

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
      new CloudflareFeatureFlagReader('sandbox', evaluator, undefined).isNativeCheckoutEnabled(),
    ).resolves.toBe(true);

    expect(evaluator.getBooleanValue).toHaveBeenCalledExactlyOnceWith(NATIVE_CHECKOUT_ENABLED_FLAG, false, {
      appEnvironment: 'sandbox',
      capability: 'native_checkout',
      targetingKey: 'blackbox-records-sandbox',
    });
  });

  it('falls back to the environment default when provider evaluation fails', async () => {
    const evaluator = {
      getBooleanValue: vi.fn(async () => {
        throw new Error('Flagship unavailable');
      }),
    };

    await expect(
      new CloudflareFeatureFlagReader('production', evaluator, undefined).isNativeCheckoutEnabled(),
    ).resolves.toBe(false);
  });
});
