import { describe, expect, it } from 'vitest';

import {
  getProductEnvironmentProfile,
  isCatalogMutationEnabledForWorkerRuntimeTarget,
  isCatalogMutationEnabledFromBindings,
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
      emailBrand: {
        homeUrl: 'https://blackbox-studio-athens.github.io/blackbox-records/',
        logoUrl: 'https://blackbox-studio-athens.github.io/blackbox-records/assets/images/brand/logo-horizontal.png',
      },
      emailDeliveryPolicy: 'direct',
      nativeCheckoutEnabledByDefault: true,
      productEnvironment: 'LOCAL',
      stripeMode: 'local',
      workerDeploymentTarget: 'local',
    });
    expect(getProductEnvironmentProfile('UAT')).toMatchObject({
      catalogVerificationPolicy: {
        applyScheduledChanges: false,
      },
      emailBrand: {
        homeUrl: 'https://blackbox-studio-athens.github.io/blackbox-records/',
        logoUrl: 'https://blackbox-studio-athens.github.io/blackbox-records/assets/images/brand/logo-horizontal.png',
      },
      emailDeliveryPolicy: 'uat-sink',
      emailProviderTag: 'uat',
      nativeCheckoutEnabledByDefault: false,
      productEnvironment: 'UAT',
      stripeMode: 'uat',
      requiresDeployedSecretsByDefault: true,
      workerDeploymentTarget: 'uat',
    });
    expect(getProductEnvironmentProfile('PRD')).toMatchObject({
      catalogVerificationPolicy: {
        applyScheduledChanges: false,
      },
      emailBrand: {
        homeUrl: 'https://blackbox-records-web.pages.dev/',
        logoUrl: 'https://blackbox-records-web.pages.dev/assets/images/brand/logo-horizontal.png',
      },
      emailDeliveryPolicy: 'direct',
      nativeCheckoutEnabledByDefault: false,
      productEnvironment: 'PRD',
      stripeMode: 'prd',
      workerDeploymentTarget: 'prd',
    });
  });

  it('validates every mapped profile through the Zod schema', () => {
    for (const profile of Object.values(productEnvironmentProfiles)) {
      expect(productEnvironmentProfileSchema.parse(profile)).toEqual(profile);
    }
  });

  it('maps Worker runtime targets at boundary adapters', () => {
    expect(productEnvironmentFromWorkerRuntimeTarget('local')).toBe('LOCAL');
    expect(productEnvironmentFromWorkerRuntimeTarget('uat')).toBe('UAT');
    expect(productEnvironmentFromWorkerRuntimeTarget('prd')).toBe('PRD');
    expect(productEnvironmentProfileFromWorkerRuntimeTarget('uat')).toBe(productEnvironmentProfiles.UAT);
  });

  it('maps Product Environment CLI targets while accepting legacy platform aliases at edges', () => {
    expect(parseProductEnvironmentCliTarget('local')).toBe('LOCAL');
    expect(parseProductEnvironmentCliTarget('LOCAL')).toBe('LOCAL');
    expect(parseProductEnvironmentCliTarget('uat')).toBe('UAT');
    expect(parseProductEnvironmentCliTarget('prd')).toBe('PRD');
    expect(parseProductEnvironmentCliTarget('sandbox')).toBe('UAT');
    expect(parseProductEnvironmentCliTarget('production')).toBe('PRD');
    expect(workerRuntimeTargetForProductEnvironment('UAT')).toBe('uat');
    expect(formatProductEnvironmentLabel('LOCAL')).toBe('Local');
    expect(formatProductEnvironmentLabel('UAT')).toBe('UAT');
    expect(() => parseProductEnvironmentCliTarget('test')).toThrow();
  });

  it('keeps PRD catalog mutation disabled until the open gate is explicit', () => {
    expect(isCatalogMutationEnabledForWorkerRuntimeTarget('local', undefined)).toBe(true);
    expect(isCatalogMutationEnabledForWorkerRuntimeTarget('uat', undefined)).toBe(true);
    expect(isCatalogMutationEnabledForWorkerRuntimeTarget('prd', undefined)).toBe(false);
    expect(isCatalogMutationEnabledForWorkerRuntimeTarget('prd', 'review')).toBe(false);
    expect(isCatalogMutationEnabledForWorkerRuntimeTarget('prd', 'open')).toBe(true);
    expect(
      isCatalogMutationEnabledFromBindings({
        PRODUCT_ENVIRONMENT: 'PRD',
      }),
    ).toBe(false);
    expect(
      isCatalogMutationEnabledFromBindings({
        PRODUCT_ENVIRONMENT: 'PRD',
        PRD_OPEN_GATE: 'open',
      }),
    ).toBe(true);
  });
});
