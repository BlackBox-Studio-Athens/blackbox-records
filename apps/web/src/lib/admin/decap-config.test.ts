import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import {
  buildDecapConfig,
  createDecapConfigErrorResponse,
  createDecapConfigResponse,
  decapModeHeaderName,
} from './decap-config';
import {
  DecapRuntimeConfigError,
  type DecapHostedRuntimeConfig,
  type DecapLocalRuntimeConfig,
} from './decap-runtime-config';

const artistOptions = [{ label: 'Mass Culture', value: 'mass-culture' }];
const logoUrl = 'https://example.com/logo.png';
const localSiteRootUrl = 'http://127.0.0.1:4322/blackbox-records/';
const hostedSiteRootUrl = 'https://blackbox-studio-athens.github.io/blackbox-records/';
const localRuntimeConfig: DecapLocalRuntimeConfig = {
  branch: 'main',
  localBackendPort: '8082',
  mode: 'local',
  useLocalBackend: true,
};
const hostedRuntimeConfig: DecapHostedRuntimeConfig = {
  authEndpoint: '/sites/site-id/pkce',
  authTokenEndpoint: '/sites/site-id/token',
  baseUrl: 'https://auth.decapbridge.com',
  branch: 'main',
  gatewayUrl: 'https://gateway.decapbridge.com',
  mode: 'hosted',
  repository: 'BlackBox-Studio-Athens/blackbox-records',
  siteUrl: hostedSiteRootUrl,
  useLocalBackend: false,
};

function buildConfig(
  runtimeConfig: DecapLocalRuntimeConfig | DecapHostedRuntimeConfig = localRuntimeConfig,
  siteRootUrl = runtimeConfig.mode === 'local' ? localSiteRootUrl : hostedSiteRootUrl,
): string {
  return buildDecapConfig({ artistOptions, logoUrl, runtimeConfig, siteRootUrl });
}

function readConfigPreamble(yaml: string): string {
  return yaml.slice(0, yaml.indexOf('\ncollections:'));
}

function readCollections(yaml: string): string {
  return yaml.slice(yaml.indexOf('collections:\n'));
}

describe('buildDecapConfig', () => {
  it('builds the exact local proxy YAML preamble', () => {
    expect(readConfigPreamble(buildConfig())).toBe(`backend:
  name: proxy
  proxy_url: "http://127.0.0.1:8082/api/v1"
  branch: "main"

publish_mode: simple
media_folder: apps/web/src/content/uploads


site_url: "http://127.0.0.1:4322/blackbox-records/"
display_url: "http://127.0.0.1:4322/blackbox-records/"
logo_url: "https://example.com/logo.png"
editor:
  preview: true
`);
  });

  it('builds the exact hosted DecapBridge PKCE YAML preamble', () => {
    expect(readConfigPreamble(buildConfig(hostedRuntimeConfig))).toBe(`backend:
  name: git-gateway
  repo: "BlackBox-Studio-Athens/blackbox-records"
  branch: "main"
  auth_type: pkce
  base_url: "https://auth.decapbridge.com"
  auth_endpoint: "/sites/site-id/pkce"
  auth_token_endpoint: "/sites/site-id/token"
  gateway_url: "https://gateway.decapbridge.com"

  commit_messages:
    create: "Create {{collection}} \\"{{slug}}\\" via Decap CMS"
    update: "Update {{collection}} \\"{{slug}}\\" via Decap CMS"
    delete: "Delete {{collection}} \\"{{slug}}\\" via Decap CMS"
    uploadMedia: "Upload \\"{{path}}\\" via Decap CMS"
    deleteMedia: "Delete \\"{{path}}\\" via Decap CMS"
    openAuthoring: "Open authoring for {{collection}} via Decap CMS"

publish_mode: simple
media_folder: apps/web/src/content/uploads


auth:
  email_claim: email
  first_name_claim: first_name
  last_name_claim: last_name
  avatar_url_claim: avatar_url

site_url: "https://blackbox-studio-athens.github.io/blackbox-records/"
display_url: "https://blackbox-studio-athens.github.io/blackbox-records/"
logo_url: "https://example.com/logo.png"
editor:
  preview: true
`);
  });

  it('keeps collection YAML identical across writable backend modes', () => {
    expect(readCollections(buildConfig())).toBe(readCollections(buildConfig(hostedRuntimeConfig)));
  });

  it('orders routine and advanced collections with editor-facing labels, descriptions, and direct-publish copy', () => {
    const config = parse(buildConfig()) as {
      collections: Array<{ description?: string; label: string; name: string }>;
    };

    expect(config.collections.map(({ name }) => name)).toEqual([
      'home',
      'artists',
      'releases',
      'distro',
      'news',
      'about',
      'services',
      'newsletter',
      'distro-page',
      'navigation',
      'socials',
      'settings',
    ]);
    expect(config.collections.map(({ label }) => label)).toEqual([
      'Home',
      'Artists',
      'Releases',
      'Store Items — Distro & Merch',
      'News',
      'About',
      'Services',
      'Newsletter',
      'Store — Distro Page Copy',
      'Advanced — Navigation',
      'Advanced — Social Links',
      'Advanced — Site Settings',
    ]);

    for (const collection of config.collections) {
      expect(collection.description).toContain('main');
    }
    expect(config.collections.find(({ name }) => name === 'navigation')?.description).toContain('site-wide navigation');
    expect(config.collections.find(({ name }) => name === 'socials')?.description).toContain(
      'site-wide social identity',
    );
    expect(config.collections.find(({ name }) => name === 'settings')?.description).toContain(
      'site-wide label identity',
    );
  });

  it('keeps existing collection paths, fields, and editor hints', () => {
    const yaml = buildConfig();

    expect(yaml).toContain('folder: "apps/web/src/content/releases"');
    expect(yaml).toContain('value: "mass-culture"');
    expect(yaml).toContain('summary: "{{fields.tagline}}"');
    expect(yaml).toContain('file: "apps/web/src/content/newsletter/site.json"');
    expect(yaml).toContain('file: "apps/web/src/content/distro-page/site.json"');
    expect(yaml).not.toMatch(/file: "src\/content\/|folder: "src\/content\/|media_folder: src\/content\//);
    expect(yaml).toContain('default: "../../../.astro/collections/newsletter.schema.json"');
    expect(yaml).toContain('default: "../../../.astro/collections/distroPage.schema.json"');
    expect(yaml).toContain('hint: "Short line over the hero still. Example: \\"Heavy music on record.\\""');
    expect(yaml).toContain('hint: "Pick the matching artist entry so Astro references stay valid."');
    expect(yaml).toContain('summary: "{{fields.title}}"');
  });

  it('emits block lists for page sections that editors can remove', () => {
    const yaml = buildConfig();

    expect(yaml).toContain(
      'label: "Sections"\n            name: "sections"\n            widget: list\n            hint: "Add, remove, or reorder whole homepage sections."\n            collapsed: true\n            typeKey: "type"\n            types:',
    );
    expect(yaml).toContain('label: "News"');
    expect(yaml).toContain('label: "Quote"');
    expect(yaml).toContain('label: "Services list"');
    expect(yaml).toContain('summary: "{{fields.locality}}, {{fields.country}}"');
  });

  it('exposes distro page copy and distro item fields without commerce authority', () => {
    const yaml = buildConfig();

    expect(yaml).toContain('label: "Store — Distro Page Copy"');
    expect(yaml).toContain('name: "group_intros"');
    expect(yaml).toContain('label: "Vinyl 12-inch"');
    expect(yaml).toContain('label: "Vinyl 10-inch"');
    expect(yaml).toContain('folder: "apps/web/src/content/distro"');
    expect(yaml).toContain('name: "artist_or_label"');
    expect(yaml).toContain('name: "summary"');
    expect(yaml).toContain('name: "format"');
    expect(yaml).not.toContain('name: "price"');
    expect(yaml).not.toContain('name: "stripe_price_id"');
  });
});

describe('createDecapConfigResponse', () => {
  it.each(['local', 'hosted'] as const)('adds stable %s mode markers without changing YAML', async (mode) => {
    const yaml = buildConfig(mode === 'local' ? localRuntimeConfig : hostedRuntimeConfig);
    const response = createDecapConfigResponse({ mode, yaml });

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-type')).toBe('text/yaml; charset=utf-8');
    expect(response.headers.get(decapModeHeaderName)).toBe(mode);
    expect(await response.text()).toBe(`# blackbox-decap-mode: ${mode}\n${yaml}`);
  });

  it('returns an explicit comment-only disabled response with no writable backend data', async () => {
    const response = createDecapConfigResponse({ mode: 'disabled' });
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-type')).toBe('text/yaml; charset=utf-8');
    expect(response.headers.get(decapModeHeaderName)).toBe('disabled');
    expect(body).toBe('# blackbox-decap-mode: disabled\n# BlackBox CMS unavailable for this build.\n');
    expect(body).not.toMatch(/backend:|repo:|proxy_url:|auth_endpoint:|auth_token_endpoint:|127\.0\.0\.1|localhost/);
  });
});

describe('createDecapConfigErrorResponse', () => {
  it('returns setting-safe resolver guidance without configuration values', async () => {
    const response = createDecapConfigErrorResponse(
      new DecapRuntimeConfigError(
        'Hosted Decap configuration is missing required setting(s): DECAP_REPOSITORY. Set each named setting before building with DECAP_BACKEND_MODE=hosted.',
      ),
    );

    expect(response.status).toBe(500);
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await response.text()).toBe(
      'Hosted Decap configuration is missing required setting(s): DECAP_REPOSITORY. Set each named setting before building with DECAP_BACKEND_MODE=hosted.\n',
    );
  });

  it('replaces unexpected error details with generic remediation', async () => {
    const response = createDecapConfigErrorResponse(new Error('secret-value and full environment dump'));
    const body = await response.text();

    expect(body).toBe(
      'Decap configuration could not be generated. Review DECAP_BACKEND_MODE and required Decap settings, then retry.\n',
    );
    expect(body).not.toContain('secret-value');
    expect(body).not.toContain('environment dump');
  });
});
