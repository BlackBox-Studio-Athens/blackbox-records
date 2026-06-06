import { describe, expect, it } from 'vitest';

import { buildDecapConfig } from './decap-config';

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
    expect(yaml).toContain('file: "src/content/newsletter/site.json"');
    expect(yaml).toContain('default: "../../../.astro/collections/newsletter.schema.json"');
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

  it('emits block lists for page sections that editors can remove', () => {
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

    expect(yaml).toContain(
      'label: "Sections"\n            name: "sections"\n            widget: list\n            hint: "Add, remove, or reorder whole homepage sections."\n            collapsed: true\n            typeKey: "type"\n            types:',
    );
    expect(yaml).toContain('label: "News"');
    expect(yaml).toContain('label: "Quote"');
    expect(yaml).toContain('label: "Services list"');
    expect(yaml).toContain('summary: "{{fields.locality}}, {{fields.country}}"');
  });
});
