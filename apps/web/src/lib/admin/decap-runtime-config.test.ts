import { describe, expect, it } from 'vitest';

import {
  parseDecapBackendMode,
  resolveDecapBackendMode,
  resolveDecapLocalRuntimeConfig,
  resolveDecapSiteRootUrl,
  shouldUseLocalDecapBackend,
} from './decap-runtime-config';

describe('parseDecapBackendMode', () => {
  it('does not select a mode from legacy backend settings', () => {
    expect(
      parseDecapBackendMode({
        DECAP_LOCAL_PROXY_PORT: '8082',
        DECAP_REPOSITORY: 'BlackBox-Studio-Athens/blackbox-records',
        DECAPBRIDGE_AUTH_ENDPOINT: '/sites/site-id/pkce',
        DECAPBRIDGE_AUTH_TOKEN_ENDPOINT: '/sites/site-id/token',
      }),
    ).toEqual({ configuredValue: undefined, mode: undefined });
  });

  it.each(['local', 'hosted', 'disabled'] as const)('trims the explicit %s mode', (mode) => {
    expect(
      parseDecapBackendMode({
        DECAP_BACKEND_MODE: `  ${mode}  `,
        DECAP_LOCAL_PROXY_PORT: '8082',
        DECAP_REPOSITORY: 'ignored/repository',
      }),
    ).toEqual({ configuredValue: mode, mode });
  });
});

describe('resolveDecapBackendMode', () => {
  const invalidModeMessage =
    'DECAP_BACKEND_MODE must be local, hosted, or disabled when set. Leave it unset to use the environment default.';

  it('defaults an absent mode to local during Astro development', () => {
    expect(resolveDecapBackendMode({ environment: {}, isDevelopment: true })).toBe('local');
  });

  it('defaults an absent mode to disabled during a production static build', () => {
    expect(resolveDecapBackendMode({ environment: {}, isDevelopment: false })).toBe('disabled');
  });

  it.each([
    ['empty', ''],
    ['whitespace-only', ' \t\r\n '],
  ])('rejects an explicit %s value', (_description, configuredValue) => {
    expect(() =>
      resolveDecapBackendMode({
        environment: { DECAP_BACKEND_MODE: configuredValue },
        isDevelopment: true,
      }),
    ).toThrow(invalidModeMessage);
  });

  it.each(['LOCAL', 'local,hosted', 'staging'])('rejects the unsupported explicit value %s', (configuredValue) => {
    expect(() =>
      resolveDecapBackendMode({
        environment: { DECAP_BACKEND_MODE: configuredValue },
        isDevelopment: false,
      }),
    ).toThrow(invalidModeMessage);
  });

  it.each(['local', 'hosted', 'disabled'] as const)('accepts the explicit %s value', (mode) => {
    expect(
      resolveDecapBackendMode({
        environment: { DECAP_BACKEND_MODE: `  ${mode}  ` },
        isDevelopment: false,
      }),
    ).toBe(mode);
  });
});

describe('resolveDecapLocalRuntimeConfig', () => {
  it('resolves the default local proxy without hosted settings', () => {
    expect(resolveDecapLocalRuntimeConfig({ environment: {}, isDevelopment: true })).toEqual({
      localBackendPort: '8082',
      mode: 'local',
      useLocalBackend: true,
    });
  });

  it('keeps explicit local mode when legacy hosted settings are present', () => {
    expect(
      resolveDecapLocalRuntimeConfig({
        environment: {
          DECAP_BACKEND_MODE: 'local',
          DECAP_LOCAL_PROXY_PORT: '9000',
          DECAP_REPOSITORY: 'legacy/repository',
          DECAP_SITE_URL: 'https://legacy.example.com',
          DECAPBRIDGE_AUTH_ENDPOINT: '/sites/legacy/pkce',
          DECAPBRIDGE_AUTH_TOKEN_ENDPOINT: '/sites/legacy/token',
        },
        isDevelopment: false,
      }),
    ).toEqual({
      localBackendPort: '9000',
      mode: 'local',
      useLocalBackend: true,
    });
  });
});

describe('resolveDecapSiteRootUrl', () => {
  it('uses the Astro site URL in production when provided', () => {
    expect(
      resolveDecapSiteRootUrl({
        baseUrl: '/blackbox-records/',
        configuredSiteUrl: 'https://example.com/blackbox-records',
        useLocalBackend: false,
        localCmsPort: '4322',
        site: 'https://fallback.example.com',
      }),
    ).toBe('https://fallback.example.com/blackbox-records/');
  });

  it('falls back to the configured site URL when no Astro site is available', () => {
    expect(
      resolveDecapSiteRootUrl({
        baseUrl: '/blackbox-records/',
        configuredSiteUrl: 'https://example.com/blackbox-records',
        useLocalBackend: false,
        localCmsPort: '4322',
      }),
    ).toBe('https://example.com/blackbox-records/');
  });

  it('uses the local CMS port in development', () => {
    expect(
      resolveDecapSiteRootUrl({
        baseUrl: '/blackbox-records/',
        useLocalBackend: true,
        localCmsPort: '4322',
      }),
    ).toBe('http://127.0.0.1:4322/blackbox-records/');
  });
});

describe('shouldUseLocalDecapBackend', () => {
  it('uses the local backend in development', () => {
    expect(
      shouldUseLocalDecapBackend({
        authEndpoint: '/sites/site-id/pkce',
        authTokenEndpoint: '/sites/site-id/token',
        isDevelopment: true,
      }),
    ).toBe(true);
  });

  it('uses the local backend when bridge endpoints are still placeholders', () => {
    expect(
      shouldUseLocalDecapBackend({
        authEndpoint: '/sites/__SET_DECAPBRIDGE_SITE_ID__/pkce',
        authTokenEndpoint: '/sites/__SET_DECAPBRIDGE_SITE_ID__/token',
        isDevelopment: false,
      }),
    ).toBe(true);
  });

  it('uses PKCE only when bridge endpoints are configured', () => {
    expect(
      shouldUseLocalDecapBackend({
        authEndpoint: '/sites/site-id/pkce',
        authTokenEndpoint: '/sites/site-id/token',
        isDevelopment: false,
      }),
    ).toBe(false);
  });
});
