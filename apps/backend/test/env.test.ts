import { describe, expect, it } from 'vitest';

import {
  getProductEnvironmentProfile,
  parseProductEnvironmentCliTarget,
  productEnvironmentFromWorkerRuntimeTarget,
  productEnvironmentProfileFromWorkerRuntimeTarget,
  productEnvironmentProfileSchema,
  productEnvironmentProfiles,
  workerRuntimeTargetForProductEnvironment,
  formatProductEnvironmentLabel,
} from '../src/env';

describe('Product Environment Profile', () => {
  it('maps each Product Environment to one Worker runtime target and policy profile', () => {
    expect(Object.keys(productEnvironmentProfiles)).toEqual(['LOCAL', 'UAT', 'PRD']);

    expect(getProductEnvironmentProfile('LOCAL')).toMatchObject({
      emailDeliveryPolicy: 'direct',
      nativeCheckoutEnabledByDefault: true,
      productEnvironment: 'LOCAL',
      stripeMode: 'mock',
      workerDeploymentTarget: 'local',
    });
    expect(getProductEnvironmentProfile('UAT')).toMatchObject({
      emailDeliveryPolicy: 'uat-sink',
      emailProviderTag: 'sandbox',
      nativeCheckoutEnabledByDefault: false,
      productEnvironment: 'UAT',
      stripeMode: 'test',
      requiresDeployedSecretsByDefault: true,
      workerDeploymentTarget: 'sandbox',
    });
    expect(getProductEnvironmentProfile('PRD')).toMatchObject({
      catalogVerificationPolicy: {
        applyScheduledChanges: false,
      },
      emailDeliveryPolicy: 'direct',
      nativeCheckoutEnabledByDefault: false,
      productEnvironment: 'PRD',
      stripeMode: 'live',
      workerDeploymentTarget: 'production',
    });
  });

  it('validates every mapped profile through the Zod schema', () => {
    for (const profile of Object.values(productEnvironmentProfiles)) {
      expect(productEnvironmentProfileSchema.parse(profile)).toEqual(profile);
    }
  });

  it('maps Worker runtime targets at boundary adapters', () => {
    expect(productEnvironmentFromWorkerRuntimeTarget('local')).toBe('LOCAL');
    expect(productEnvironmentFromWorkerRuntimeTarget('sandbox')).toBe('UAT');
    expect(productEnvironmentFromWorkerRuntimeTarget('production')).toBe('PRD');
    expect(productEnvironmentProfileFromWorkerRuntimeTarget('sandbox')).toBe(productEnvironmentProfiles.UAT);
  });

  it('maps Product Environment CLI targets while accepting legacy platform aliases at edges', () => {
    expect(parseProductEnvironmentCliTarget('local')).toBe('LOCAL');
    expect(parseProductEnvironmentCliTarget('LOCAL')).toBe('LOCAL');
    expect(parseProductEnvironmentCliTarget('uat')).toBe('UAT');
    expect(parseProductEnvironmentCliTarget('prd')).toBe('PRD');
    expect(parseProductEnvironmentCliTarget('sandbox')).toBe('UAT');
    expect(parseProductEnvironmentCliTarget('production')).toBe('PRD');
    expect(workerRuntimeTargetForProductEnvironment('UAT')).toBe('sandbox');
    expect(formatProductEnvironmentLabel('LOCAL')).toBe('Local');
    expect(formatProductEnvironmentLabel('UAT')).toBe('UAT');
    expect(() => parseProductEnvironmentCliTarget('test')).toThrow();
  });
});
