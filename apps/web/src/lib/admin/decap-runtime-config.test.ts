import { describe, expect, it } from 'vitest';

import {
  parseDecapBackendMode,
  resolveDecapBackendMode,
  resolveDecapHostedRuntimeConfig,
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
  const invalidLocalProxyPortMessage =
    'DECAP_LOCAL_PROXY_PORT must be a base-10 TCP port from 1 through 65535 when set. Leave it unset to use 8082.';

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

  it.each([
    ['lower boundary', '  1  ', '1'],
    ['upper boundary', '65535', '65535'],
  ])('accepts and trims the %s', (_description, configuredValue, expectedPort) => {
    expect(
      resolveDecapLocalRuntimeConfig({
        environment: {
          DECAP_BACKEND_MODE: 'local',
          DECAP_LOCAL_PROXY_PORT: configuredValue,
        },
        isDevelopment: false,
      }),
    ).toMatchObject({ localBackendPort: expectedPort });
  });

  it.each([
    ['empty', ''],
    ['whitespace-only', ' \t\r\n '],
    ['zero', '0'],
    ['negative', '-1'],
    ['signed', '+1'],
    ['fraction', '1.5'],
    ['exponent notation', '1e3'],
    ['hex notation', '0x50'],
    ['trailing text', '8082abc'],
    ['NaN', 'NaN'],
    ['above the upper boundary', '65536'],
  ])('rejects an explicit %s port without echoing it', (_description, configuredValue) => {
    expect(() =>
      resolveDecapLocalRuntimeConfig({
        environment: {
          DECAP_BACKEND_MODE: 'local',
          DECAP_LOCAL_PROXY_PORT: configuredValue,
        },
        isDevelopment: false,
      }),
    ).toThrow(new RegExp(`^${invalidLocalProxyPortMessage}$`));
  });

  it.each(['hosted', 'disabled'] as const)('does not validate the local proxy port in %s mode', (mode) => {
    expect(
      resolveDecapLocalRuntimeConfig({
        environment: {
          DECAP_BACKEND_MODE: mode,
          DECAP_LOCAL_PROXY_PORT: 'not-a-port',
        },
        isDevelopment: false,
      }),
    ).toBeUndefined();
  });
});

describe('resolveDecapHostedRuntimeConfig', () => {
  const placeholderMarker = '__SET_DECAPBRIDGE_SITE_ID__';
  const hostedEnvironment = {
    DECAP_BACKEND_MODE: 'hosted',
    DECAP_REPOSITORY: 'BlackBox-Studio-Athens/blackbox-records',
    DECAP_SITE_URL: 'https://blackbox-studio-athens.github.io/blackbox-records/',
    DECAPBRIDGE_AUTH_ENDPOINT: '/sites/blackbox-records/pkce',
    DECAPBRIDGE_AUTH_TOKEN_ENDPOINT: '/sites/blackbox-records/token',
  };
  const requiredSettingNames = [
    'DECAP_REPOSITORY',
    'DECAP_SITE_URL',
    'DECAPBRIDGE_AUTH_ENDPOINT',
    'DECAPBRIDGE_AUTH_TOKEN_ENDPOINT',
  ] as const;
  const missingSettingMessage = (settingNames: readonly string[]) =>
    `Hosted Decap configuration is missing required setting(s): ${settingNames.join(', ')}. Set each named setting before building with DECAP_BACKEND_MODE=hosted.`;
  const placeholderSettingMessage = (settingNames: readonly string[]) =>
    `Hosted Decap configuration contains placeholder value(s) for setting(s): ${settingNames.join(', ')}. Replace each named setting with its deployment value before building with DECAP_BACKEND_MODE=hosted.`;
  const loopbackSettingMessage = (settingNames: readonly string[]) =>
    `Hosted Decap configuration uses loopback host(s) for setting(s): ${settingNames.join(', ')}. Replace each named setting with a hosted deployment URL before building with DECAP_BACKEND_MODE=hosted.`;
  const hostedUrlSettingNames = [
    'DECAP_SITE_URL',
    'DECAPBRIDGE_AUTH_ENDPOINT',
    'DECAPBRIDGE_AUTH_TOKEN_ENDPOINT',
  ] as const;
  const loopbackUrls = [
    ['localhost', 'https://localhost/admin'],
    ['case-insensitive localhost with a trailing dot, port, and path', 'https://LOCALHOST.:8443/sites/site-id/pkce'],
    ['localhost subdomain', 'https://cms.localhost/sites/site-id/token'],
    ['IPv4 loopback', 'https://127.0.0.1:8443/admin'],
    ['IPv4 loopback range', 'https://127.255.255.254/sites/site-id/pkce'],
    ['normalized short IPv4 loopback', 'https://127.1/sites/site-id/token'],
    ['bracketed IPv6 loopback', 'https://[::1]:8443/admin'],
    ['expanded IPv6 loopback', 'https://[0:0:0:0:0:0:0:1]/sites/site-id/pkce'],
  ] as const;
  const placeholderValues: Record<(typeof requiredSettingNames)[number], string> = {
    DECAP_REPOSITORY: `owner/${placeholderMarker}`,
    DECAP_SITE_URL: `https://${placeholderMarker}.invalid/`,
    DECAPBRIDGE_AUTH_ENDPOINT: `/sites/${placeholderMarker}/pkce`,
    DECAPBRIDGE_AUTH_TOKEN_ENDPOINT: `/sites/${placeholderMarker}/token`,
  };

  it.each(requiredSettingNames)('rejects missing %s', (settingName) => {
    const environment: Record<string, string | undefined> = { ...hostedEnvironment };
    delete environment[settingName];

    expect(() => resolveDecapHostedRuntimeConfig({ environment, isDevelopment: false })).toThrow(
      missingSettingMessage([settingName]),
    );
  });

  it.each(requiredSettingNames)('treats whitespace-only %s as missing', (settingName) => {
    expect(() =>
      resolveDecapHostedRuntimeConfig({
        environment: { ...hostedEnvironment, [settingName]: ' \t\r\n ' },
        isDevelopment: false,
      }),
    ).toThrow(missingSettingMessage([settingName]));
  });

  it('reports every missing hosted setting without values', () => {
    expect(() =>
      resolveDecapHostedRuntimeConfig({
        environment: {
          ...hostedEnvironment,
          DECAP_REPOSITORY: undefined,
          DECAPBRIDGE_AUTH_TOKEN_ENDPOINT: undefined,
        },
        isDevelopment: false,
      }),
    ).toThrow(missingSettingMessage(['DECAP_REPOSITORY', 'DECAPBRIDGE_AUTH_TOKEN_ENDPOINT']));
  });

  it.each(requiredSettingNames)('rejects the known placeholder marker in %s after trimming', (settingName) => {
    expect(() =>
      resolveDecapHostedRuntimeConfig({
        environment: { ...hostedEnvironment, [settingName]: `  ${placeholderValues[settingName]}  ` },
        isDevelopment: false,
      }),
    ).toThrow(placeholderSettingMessage([settingName]));
  });

  it('reports every hosted placeholder setting without values', () => {
    expect(() =>
      resolveDecapHostedRuntimeConfig({
        environment: {
          ...hostedEnvironment,
          DECAP_REPOSITORY: placeholderValues.DECAP_REPOSITORY,
          DECAPBRIDGE_AUTH_TOKEN_ENDPOINT: placeholderValues.DECAPBRIDGE_AUTH_TOKEN_ENDPOINT,
        },
        isDevelopment: false,
      }),
    ).toThrow(placeholderSettingMessage(['DECAP_REPOSITORY', 'DECAPBRIDGE_AUTH_TOKEN_ENDPOINT']));
  });

  it.each(
    hostedUrlSettingNames.flatMap((settingName) =>
      loopbackUrls.map(([description, value]) => [settingName, description, value] as const),
    ),
  )('rejects %s when it uses %s', (settingName, _description, value) => {
    expect(() =>
      resolveDecapHostedRuntimeConfig({
        environment: { ...hostedEnvironment, [settingName]: value },
        isDevelopment: false,
      }),
    ).toThrow(loopbackSettingMessage([settingName]));
  });

  it('reports every hosted loopback setting without values', () => {
    expect(() =>
      resolveDecapHostedRuntimeConfig({
        environment: {
          ...hostedEnvironment,
          DECAP_SITE_URL: 'https://localhost/admin',
          DECAPBRIDGE_AUTH_ENDPOINT: 'https://127.0.0.1/sites/site-id/pkce',
          DECAPBRIDGE_AUTH_TOKEN_ENDPOINT: 'https://[::1]/sites/site-id/token',
        },
        isDevelopment: false,
      }),
    ).toThrow(
      loopbackSettingMessage(['DECAP_SITE_URL', 'DECAPBRIDGE_AUTH_ENDPOINT', 'DECAPBRIDGE_AUTH_TOKEN_ENDPOINT']),
    );
  });

  it.each([
    ['localhost lookalike', 'https://localhost.example.com/admin'],
    ['localhost text prefix', 'https://notlocalhost/admin'],
    ['IPv4-looking domain', 'https://127.example.com/admin'],
    ['non-loopback IPv4', 'https://128.0.0.1/admin'],
    ['non-loopback IPv6', 'https://[::2]/admin'],
    ['loopback text in a path', 'https://example.com/localhost/127.0.0.1'],
  ])('accepts a hosted %s', (_description, siteUrl) => {
    expect(
      resolveDecapHostedRuntimeConfig({
        environment: { ...hostedEnvironment, DECAP_SITE_URL: siteUrl },
        isDevelopment: false,
      }),
    ).toBeDefined();
  });

  it.each([
    ['invalid URL syntax', 'not a URL'],
    ['hostless URL', 'mailto:localhost@example.com'],
  ])('defers %s validation', (_description, siteUrl) => {
    expect(
      resolveDecapHostedRuntimeConfig({
        environment: { ...hostedEnvironment, DECAP_SITE_URL: siteUrl },
        isDevelopment: false,
      }),
    ).toBeDefined();
  });

  it('accepts hostless relative auth and token endpoints', () => {
    expect(
      resolveDecapHostedRuntimeConfig({
        environment: {
          ...hostedEnvironment,
          DECAPBRIDGE_AUTH_ENDPOINT: '/localhost/127.0.0.1/pkce',
          DECAPBRIDGE_AUTH_TOKEN_ENDPOINT: '/localhost/127.0.0.1/token',
        },
        isDevelopment: false,
      }),
    ).toBeDefined();
  });

  it.each(requiredSettingNames)('accepts a case-different near-placeholder in %s', (settingName) => {
    expect(
      resolveDecapHostedRuntimeConfig({
        environment: {
          ...hostedEnvironment,
          [settingName]: placeholderValues[settingName].replace(placeholderMarker, placeholderMarker.toLowerCase()),
        },
        isDevelopment: false,
      }),
    ).toBeDefined();
  });

  it('returns a trimmed hosted runtime config when every setting is present', () => {
    expect(
      resolveDecapHostedRuntimeConfig({
        environment: Object.fromEntries(
          Object.entries(hostedEnvironment).map(([settingName, value]) => [settingName, `  ${value}  `]),
        ),
        isDevelopment: false,
      }),
    ).toEqual({
      authEndpoint: '/sites/blackbox-records/pkce',
      authTokenEndpoint: '/sites/blackbox-records/token',
      mode: 'hosted',
      repository: 'BlackBox-Studio-Athens/blackbox-records',
      siteUrl: 'https://blackbox-studio-athens.github.io/blackbox-records/',
      useLocalBackend: false,
    });
  });

  it.each(['local', 'disabled'] as const)('does not validate hosted placeholders in %s mode', (mode) => {
    expect(
      resolveDecapHostedRuntimeConfig({
        environment: { DECAP_BACKEND_MODE: mode, ...placeholderValues },
        isDevelopment: false,
      }),
    ).toBeUndefined();
  });

  it.each(['local', 'disabled'] as const)('does not validate hosted loopback URLs in %s mode', (mode) => {
    expect(
      resolveDecapHostedRuntimeConfig({
        environment: {
          DECAP_BACKEND_MODE: mode,
          DECAP_REPOSITORY: 'owner/repository',
          DECAP_SITE_URL: 'https://localhost/admin',
          DECAPBRIDGE_AUTH_ENDPOINT: 'https://127.0.0.1/sites/site-id/pkce',
          DECAPBRIDGE_AUTH_TOKEN_ENDPOINT: 'https://[::1]/sites/site-id/token',
        },
        isDevelopment: false,
      }),
    ).toBeUndefined();
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
