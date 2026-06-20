import { describe, expect, it } from 'vitest';

import {
  getProductEnvironmentProfile,
  parseProductEnvironmentCliTarget,
  productEnvironmentFromWorkerRuntimeTarget,
  productEnvironmentProfileFromWorkerRuntimeTarget,
  productEnvironmentProfileSchema,
  productEnvironmentProfiles,
  workerRuntimeTargetForProductEnvironment,
} from '../src/env';

describe('Product Environment Profile', () => {
  it('maps each Product Environment to one Worker runtime target and policy profile', () => {
    expect(Object.keys(productEnvironmentProfiles)).toEqual(['local', 'uat', 'prd']);

    expect(getProductEnvironmentProfile('local')).toMatchObject({
      emailRoutingMode: 'direct',
      label: 'Local',
      nativeCheckoutEnabledByDefault: true,
      productEnvironment: 'local',
      providerMode: 'mock',
      workerRuntimeTarget: 'local',
    });
    expect(getProductEnvironmentProfile('uat')).toMatchObject({
      emailProviderEnvironmentTag: 'sandbox',
      emailRoutingMode: 'uat-sink',
      label: 'UAT',
      nativeCheckoutEnabledByDefault: false,
      productEnvironment: 'uat',
      providerMode: 'test',
      requiresDeployedSecretsByDefault: true,
      workerRuntimeTarget: 'sandbox',
    });
    expect(getProductEnvironmentProfile('prd')).toMatchObject({
      catalogVerification: {
        applyScheduledChanges: false,
      },
      emailRoutingMode: 'direct',
      label: 'PRD',
      nativeCheckoutEnabledByDefault: false,
      productEnvironment: 'prd',
      providerMode: 'live',
      workerRuntimeTarget: 'production',
    });
  });

  it('validates every mapped profile through the Zod schema', () => {
    for (const profile of Object.values(productEnvironmentProfiles)) {
      expect(productEnvironmentProfileSchema.parse(profile)).toEqual(profile);
    }
  });

  it('maps Worker runtime targets at boundary adapters', () => {
    expect(productEnvironmentFromWorkerRuntimeTarget('local')).toBe('local');
    expect(productEnvironmentFromWorkerRuntimeTarget('sandbox')).toBe('uat');
    expect(productEnvironmentFromWorkerRuntimeTarget('production')).toBe('prd');
    expect(productEnvironmentProfileFromWorkerRuntimeTarget('sandbox')).toBe(productEnvironmentProfiles.uat);
  });

  it('maps Product Environment CLI targets while accepting legacy platform aliases at edges', () => {
    expect(parseProductEnvironmentCliTarget('local')).toBe('local');
    expect(parseProductEnvironmentCliTarget('uat')).toBe('uat');
    expect(parseProductEnvironmentCliTarget('prd')).toBe('prd');
    expect(parseProductEnvironmentCliTarget('sandbox')).toBe('uat');
    expect(parseProductEnvironmentCliTarget('production')).toBe('prd');
    expect(workerRuntimeTargetForProductEnvironment('uat')).toBe('sandbox');
  });
});
