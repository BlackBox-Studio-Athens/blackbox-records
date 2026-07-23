import { createHash } from 'node:crypto';

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
  return buildDecapConfig({ logoUrl, runtimeConfig, siteRootUrl });
}

function readConfigPreamble(yaml: string): string {
  return yaml.slice(0, yaml.indexOf('\ncollections:'));
}

function readCollections(yaml: string): string {
  return yaml.slice(yaml.indexOf('collections:\n'));
}

type ParsedDecapCollection = {
  delete: boolean;
  description: string;
  files?: Array<{ media_folder?: string; public_folder?: string }>;
  label: string;
  media_folder?: string;
  name: string;
  public_folder?: string;
};

type ParsedDecapConfig = {
  auth?: Record<string, string>;
  backend: Record<string, unknown>;
  collections: ParsedDecapCollection[];
  display_url: string;
  editor: { preview: boolean };
  logo_url: string;
  media_folder: string;
  public_folder: string;
  publish_mode: string;
  site_url: string;
  slug: { clean_accents: boolean; encoding: string; sanitize_replacement: string };
};

describe('buildDecapConfig', () => {
  it('builds the exact local proxy YAML preamble', () => {
    expect(readConfigPreamble(buildConfig())).toBe(`backend:
  name: proxy
  proxy_url: "http://127.0.0.1:8082/api/v1"
  branch: "main"

publish_mode: simple
slug:
  encoding: ascii
  clean_accents: true
  sanitize_replacement: "-"
media_folder: "apps/web/src/content/home"
public_folder: "./"


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
slug:
  encoding: ascii
  clean_accents: true
  sanitize_replacement: "-"
media_folder: "apps/web/src/content/home"
public_folder: "./"


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

  it('parses the complete local proxy structure with no hosted authentication surface', () => {
    const { collections, ...config } = parse(buildConfig()) as ParsedDecapConfig;

    expect(config).toEqual({
      backend: {
        branch: 'main',
        name: 'proxy',
        proxy_url: 'http://127.0.0.1:8082/api/v1',
      },
      display_url: localSiteRootUrl,
      editor: { preview: true },
      logo_url: logoUrl,
      media_folder: 'apps/web/src/content/home',
      public_folder: './',
      publish_mode: 'simple',
      site_url: localSiteRootUrl,
      slug: { clean_accents: true, encoding: 'ascii', sanitize_replacement: '-' },
    });
    expect(collections).toHaveLength(12);
  });

  it('parses the complete hosted PKCE structure with main/simple direct publication', () => {
    const { collections, ...config } = parse(buildConfig(hostedRuntimeConfig)) as ParsedDecapConfig;

    expect(config).toEqual({
      auth: {
        avatar_url_claim: 'avatar_url',
        email_claim: 'email',
        first_name_claim: 'first_name',
        last_name_claim: 'last_name',
      },
      backend: {
        auth_endpoint: '/sites/site-id/pkce',
        auth_token_endpoint: '/sites/site-id/token',
        auth_type: 'pkce',
        base_url: 'https://auth.decapbridge.com',
        branch: 'main',
        commit_messages: {
          create: 'Create {{collection}} "{{slug}}" via Decap CMS',
          delete: 'Delete {{collection}} "{{slug}}" via Decap CMS',
          deleteMedia: 'Delete "{{path}}" via Decap CMS',
          openAuthoring: 'Open authoring for {{collection}} via Decap CMS',
          update: 'Update {{collection}} "{{slug}}" via Decap CMS',
          uploadMedia: 'Upload "{{path}}" via Decap CMS',
        },
        gateway_url: 'https://gateway.decapbridge.com',
        name: 'git-gateway',
        repo: 'BlackBox-Studio-Athens/blackbox-records',
      },
      display_url: hostedSiteRootUrl,
      editor: { preview: true },
      logo_url: logoUrl,
      media_folder: 'apps/web/src/content/home',
      public_folder: './',
      publish_mode: 'simple',
      site_url: hostedSiteRootUrl,
      slug: { clean_accents: true, encoding: 'ascii', sanitize_replacement: '-' },
    });
    expect(collections).toHaveLength(12);
  });

  it('aligns every image-owning collection with its allowlisted local media root', () => {
    const config = parse(buildConfig()) as ParsedDecapConfig;
    const collectionsByName = new Map(config.collections.map((collection) => [collection.name, collection]));
    const mediaSettings = (collectionName: string) => {
      const collection = collectionsByName.get(collectionName);
      const owner = collection?.files?.[0] ?? collection;

      return {
        media_folder: owner?.media_folder,
        public_folder: owner?.public_folder,
      };
    };

    expect(
      Object.fromEntries(
        ['home', 'about', 'services', 'artists', 'releases', 'distro', 'news'].map((collectionName) => [
          collectionName,
          mediaSettings(collectionName),
        ]),
      ),
    ).toEqual({
      about: { media_folder: '.', public_folder: './' },
      artists: { media_folder: '.', public_folder: './' },
      distro: { media_folder: '.', public_folder: './' },
      home: { media_folder: '.', public_folder: './' },
      news: { media_folder: '.', public_folder: './' },
      releases: { media_folder: '.', public_folder: './' },
      services: { media_folder: '.', public_folder: './' },
    });
    expect(buildConfig()).not.toContain('apps/web/src/content/uploads');
  });

  it('keeps collection YAML identical across writable backend modes', () => {
    expect(readCollections(buildConfig())).toBe(readCollections(buildConfig(hostedRuntimeConfig)));
  });

  it('pins the complete parsed collection contract while targeted tests explain each field rule', () => {
    const config = parse(buildConfig()) as ParsedDecapConfig;
    const contractHash = createHash('sha256').update(JSON.stringify(config.collections)).digest('hex');

    expect(contractHash).toBe('43c9521f70e1905f5a5ffd18a39fea7607f9abcc32e46955554d3bfb3d3be26b');
  });

  it('orders routine and advanced collections with editor-facing labels, descriptions, and direct-publish copy', () => {
    const config = parse(buildConfig()) as ParsedDecapConfig;

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
    expect(config.collections.map(({ description }) => description)).toEqual([
      'Homepage hero, News, and Artists content. Publishing commits immediately to main and starts the normal site deployment.',
      'Artist roster cards and detail pages. Artist identities also support public routes and Release references, so structural removal requires maintainer review. Publishing commits immediately to main and starts the normal site deployment.',
      'Editorial release pages and artwork. Release identities also support public routes and Store Item projection, so structural removal requires maintainer review. Price, stock, and checkout are managed outside Decap. Publishing commits immediately to main and starts the normal site deployment.',
      'Editorial Store Item titles, images, grouping, format, order, and public copy. To stop selling, use protected stock or commerce-operator controls; do not delete the content entry. Price, stock, checkout availability, orders, and fulfillment are managed outside Decap. Publishing commits immediately to main and starts the normal site deployment.',
      'News listing cards and article pages. News entries may be deleted after confirming the public article should be removed. Publishing commits immediately to main and starts the normal site deployment.',
      'Public About page copy, images, links, contacts, and stats. Publishing commits immediately to main and starts the normal site deployment.',
      'Public Services page copy, images, service items, process steps, and contact details. Publishing commits immediately to main and starts the normal site deployment.',
      'Visible newsletter signup heading, description, field prompt, button label, and note. Publishing commits immediately to main and starts the normal site deployment.',
      'Public Store/Distro heading, introduction, and group-specific shelf copy. Publishing commits immediately to main and starts the normal site deployment.',
      'Advanced: site-wide navigation labels, destinations, visibility, and order. Publishing commits immediately to main and starts the normal site deployment.',
      'Advanced: site-wide social identity links and order. Publishing commits immediately to main and starts the normal site deployment.',
      'Advanced: site-wide label identity, contact details, and metadata. Publishing commits immediately to main and starts the normal site deployment.',
    ]);
    expect(Object.fromEntries(config.collections.map(({ delete: canDelete, name }) => [name, canDelete]))).toEqual({
      about: false,
      artists: false,
      distro: false,
      'distro-page': false,
      home: false,
      navigation: false,
      news: true,
      newsletter: false,
      releases: false,
      services: false,
      settings: false,
      socials: true,
    });
  });

  it('keeps existing collection paths, fields, and editor hints', () => {
    const yaml = buildConfig();
    const config = parse(yaml) as {
      collections: Array<{
        fields?: Array<{
          collection?: string;
          display_fields?: string[];
          name: string;
          options_length?: number;
          search_fields?: string[];
          value_field?: string;
          widget: string;
        }>;
        name: string;
      }>;
      slug: { clean_accents: boolean; encoding: string; sanitize_replacement: string };
    };
    const releaseArtist = config.collections
      .find(({ name }) => name === 'releases')
      ?.fields?.find(({ name }) => name === 'artist');

    expect(yaml).toContain('folder: "apps/web/src/content/releases"');
    expect(config.slug).toEqual({ clean_accents: true, encoding: 'ascii', sanitize_replacement: '-' });
    expect(releaseArtist).toMatchObject({
      collection: 'artists',
      display_fields: ['title', 'slug'],
      options_length: 50,
      search_fields: ['title', 'slug'],
      value_field: 'slug',
      widget: 'relation',
    });
    expect(yaml).toContain('summary: "{{fields.tagline}}"');
    expect(yaml).toContain('file: "apps/web/src/content/newsletter/site.json"');
    expect(yaml).toContain('file: "apps/web/src/content/distro-page/site.json"');
    expect(yaml).not.toMatch(/file: "src\/content\/|folder: "src\/content\/|media_folder: src\/content\//);
    expect(yaml).toContain('default: "../../../.astro/collections/newsletter.schema.json"');
    expect(yaml).toContain('default: "../../../.astro/collections/distroPage.schema.json"');
    expect(yaml).toContain('hint: "Short line over the hero still. Example: \\"Heavy music on record.\\""');
    expect(yaml).toContain(
      'hint: "Search the current Artists collection. The saved value is the Artist slug used by Astro references."',
    );
    expect(yaml).toContain('summary: "{{fields.title}}"');
  });

  it('emits locked block lists for the fixed Home, About, and Services layouts', () => {
    type ConfigField = {
      allow_add?: boolean;
      allow_remove?: boolean;
      allow_reorder?: boolean;
      fields?: ConfigField[];
      name: string;
      types?: Array<{ fields: ConfigField[]; name: string }>;
    };
    const config = parse(buildConfig()) as {
      collections: Array<{ files?: Array<{ fields: ConfigField[] }>; name: string }>;
    };

    for (const collectionName of ['home', 'about', 'services']) {
      const collection = config.collections.find(({ name }) => name === collectionName);
      const sections = collection?.files?.[0]?.fields.find(({ name }) => name === 'sections');
      expect(sections).toMatchObject({
        allow_add: false,
        allow_remove: false,
        allow_reorder: false,
      });
    }

    const home = config.collections.find(({ name }) => name === 'home');
    const homeSections = home?.files?.[0]?.fields.find(({ name }) => name === 'sections');
    expect(homeSections?.types?.map(({ name }) => name)).toEqual(['news', 'artists']);
    expect(homeSections?.types?.flatMap(({ fields }) => fields.map(({ name }) => name))).not.toContain('section_label');
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
