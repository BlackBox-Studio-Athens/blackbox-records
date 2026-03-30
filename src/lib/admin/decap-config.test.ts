import { describe, expect, it } from 'vitest';

import { buildDecapConfig, resolveDecapSiteRootUrl, shouldUseLocalDecapBackend } from './decap-config';

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

describe('buildDecapConfig', () => {
  it('builds a proxy backend config in development', () => {
    const yaml = buildDecapConfig({
      artistOptions: [{ label: 'Mass Culture', value: 'mass-culture' }],
      authEndpoint: '/unused',
      authTokenEndpoint: '/unused-token',
      baseUrl: 'https://auth.decapbridge.com',
      branch: 'main',
      gatewayUrl: 'https://gateway.decapbridge.com',
      useLocalBackend: true,
      localBackendPort: '8082',
      logoUrl: 'https://example.com/logo.png',
      repository: 'BlackBox-Studio-Athens/blackbox-records',
      siteRootUrl: 'http://127.0.0.1:4322/blackbox-records/',
    });

    expect(yaml).toContain('name: proxy');
    expect(yaml).toContain('http://127.0.0.1:8082/api/v1');
    expect(yaml).toContain('media_folder: src/content/uploads');
    expect(yaml).toContain('folder: "src/content/releases"');
    expect(yaml).toContain('value: "mass-culture"');
    expect(yaml).toContain('summary: "{{fields.tagline}}"');
    expect(yaml).toContain('hint: "Short line over the hero still. Example: \\"Heavy music on record.\\""');
    expect(yaml).toContain('hint: "Pick the matching artist entry so Astro references stay valid."');
    expect(yaml).toContain('summary: "{{fields.title}}"');
  });

  it('builds a DecapBridge PKCE config in production', () => {
    const yaml = buildDecapConfig({
      artistOptions: [{ label: 'Mass Culture', value: 'mass-culture' }],
      authEndpoint: '/sites/site-id/pkce',
      authTokenEndpoint: '/sites/site-id/token',
      baseUrl: 'https://auth.decapbridge.com',
      branch: 'main',
      gatewayUrl: 'https://gateway.decapbridge.com',
      useLocalBackend: false,
      localBackendPort: '8082',
      logoUrl: 'https://example.com/logo.png',
      repository: 'BlackBox-Studio-Athens/blackbox-records',
      siteRootUrl: 'https://blackbox-studio-athens.github.io/blackbox-records/',
    });

    expect(yaml).toContain('name: git-gateway');
    expect(yaml).toContain('auth_type: pkce');
    expect(yaml).toContain('media_folder: src/content/uploads');
    expect(yaml).toContain('auth_endpoint: "/sites/site-id/pkce"');
    expect(yaml).toContain('auth_token_endpoint: "/sites/site-id/token"');
    expect(yaml).not.toContain('auth_type: classic');
    expect(yaml).not.toContain('\nclassic:');
  });

  it('collapses long singleton groups and emits useful summaries', () => {
    const yaml = buildDecapConfig({
      artistOptions: [{ label: 'Mass Culture', value: 'mass-culture' }],
      authEndpoint: '/unused',
      authTokenEndpoint: '/unused-token',
      baseUrl: 'https://auth.decapbridge.com',
      branch: 'main',
      gatewayUrl: 'https://gateway.decapbridge.com',
      useLocalBackend: true,
      localBackendPort: '8082',
      logoUrl: 'https://example.com/logo.png',
      repository: 'BlackBox-Studio-Athens/blackbox-records',
      siteRootUrl: 'http://127.0.0.1:4322/blackbox-records/',
    });

    expect(yaml).toContain('label: "Hero"\n            name: "hero"\n            widget: object\n            hint: "Controls the opening still, tagline, and scroll cue."\n            collapsed: true\n            summary: "{{fields.tagline}}"');
    expect(yaml).toContain('label: "Contact"\n            name: "contact"\n            widget: object\n            hint: "Closing contact panel for the About page."\n            collapsed: true\n            summary: "{{fields.title}}"');
    expect(yaml).toContain('label: "Inquiry"\n            name: "inquiry"\n            widget: object\n            hint: "Copy and email settings for the unified inquiry form."\n            collapsed: true\n            summary: "{{fields.title}}"');
    expect(yaml).toContain('summary: "{{fields.locality}}, {{fields.country}}"');
  });
});
