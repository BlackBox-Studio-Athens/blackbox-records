import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import {
  buildSveltiaConfig,
  createSveltiaConfigErrorResponse,
  createSveltiaConfigResponse,
  sveltiaModeHeaderName,
} from './sveltia-config';
import { SveltiaRuntimeConfigError, type SveltiaRuntimeConfig } from './sveltia-runtime-config';

const logoUrl = 'https://example.com/logo.png';
const localSiteRootUrl = 'http://127.0.0.1:4322/blackbox-records/';
const hostedSiteRootUrl = 'https://blackbox-studio-athens.github.io/blackbox-records/';
const localRuntimeConfig: SveltiaRuntimeConfig = { mode: 'local' };
const hostedRuntimeConfig: SveltiaRuntimeConfig = { mode: 'hosted', baseUrl: 'https://blackbox-cms-auth.workers.dev' };

function buildConfig(
  runtimeConfig: SveltiaRuntimeConfig = localRuntimeConfig,
  siteRootUrl = runtimeConfig.mode === 'local' ? localSiteRootUrl : hostedSiteRootUrl,
): string {
  return buildSveltiaConfig({ logoUrl, runtimeConfig, siteRootUrl });
}

function readCollections(yaml: string): string {
  return yaml.slice(yaml.indexOf('collections:\n'));
}

type ParsedSveltiaCollection = {
  delete: boolean;
  description: string;
  files?: Array<{
    fields?: Array<{ name: string }>;
    file?: string;
    media_folder?: string;
    name?: string;
    public_folder?: string;
  }>;
  label: string;
  media_folder?: string;
  name: string;
  public_folder?: string;
};

type ParsedSveltiaConfig = {
  auth?: Record<string, string>;
  backend: Record<string, unknown>;
  collections: ParsedSveltiaCollection[];
  display_url: string;
  editor: { preview: boolean };
  logo: { show_in_header: boolean; src: string };
  media_folder: string;
  public_folder: string;
  publish_mode: string;
  site_url: string;
  slug: { clean_accents: boolean; encoding: string; sanitize_replacement: string };
};

describe('buildSveltiaConfig', () => {
  it.each([localRuntimeConfig, hostedRuntimeConfig])(
    'uses GitHub main with native media and compatible output in $mode mode',
    (runtimeConfig) => {
      const { collections, ...config } = parse(buildConfig(runtimeConfig));
      expect(config.backend).toEqual({
        name: 'github',
        repo: 'BlackBox-Studio-Athens/blackbox-records',
        branch: 'main',
        ...(runtimeConfig.mode === 'hosted' ? { base_url: runtimeConfig.baseUrl } : {}),
      });
      expect(config.publish_mode).toBe('simple');
      expect(config.output).toEqual({ omit_empty_optional_fields: true });
      expect(config.media_libraries.default.config.slugify_filename).toBe(true);
      expect(config.site_url).toBe(runtimeConfig.mode === 'local' ? localSiteRootUrl : hostedSiteRootUrl);
      expect(config.display_url).toBe(config.site_url);
      expect(config.logo.src).toBe(logoUrl);
      expect(config.auth).toBeUndefined();
      expect(collections).toHaveLength(8);
      expect(buildConfig(runtimeConfig)).not.toMatch(
        /allow_multiple:|options_length:|git-gateway|proxy_url:|DecapBridge|DECAP_/,
      );
    },
  );

  it.each([
    [localSiteRootUrl, '/blackbox-records/assets'],
    [hostedSiteRootUrl, '/blackbox-records/assets'],
    ['https://blackbox-records-web.pages.dev/', '/assets'],
  ])('uses shared public assets under the site base %s', (siteRootUrl, publicFolder) => {
    const config = parse(buildConfig(hostedRuntimeConfig, siteRootUrl));
    expect(config.media_folder).toBe('/apps/web/public/assets');
    expect(config.public_folder).toBe(publicFolder);
  });

  it('aligns every image-owning collection with its collection-owned media root', () => {
    const config = parse(buildConfig()) as ParsedSveltiaConfig;
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
        ['site-pages', 'artists', 'releases', 'distro', 'news'].map((collectionName) => [
          collectionName,
          mediaSettings(collectionName),
        ]),
      ),
    ).toEqual({
      'site-pages': { media_folder: '.', public_folder: './' },
      artists: { media_folder: '.', public_folder: './' },
      distro: { media_folder: '.', public_folder: './' },
      news: { media_folder: '.', public_folder: './' },
      releases: { media_folder: '.', public_folder: './' },
    });
    expect(buildConfig()).not.toContain('apps/web/src/content/uploads');
  });

  it('keeps collection YAML identical across writable backend modes', () => {
    expect(readCollections(buildConfig())).toBe(readCollections(buildConfig(hostedRuntimeConfig)));
  });

  it('pins the complete parsed collection contract while targeted tests explain each field rule', () => {
    const config = parse(buildConfig()) as ParsedSveltiaConfig;
    expect(config.collections).toHaveLength(8);
  });

  it('orders routine and advanced collections with editor-facing labels, descriptions, and direct-publish copy', () => {
    const config = parse(buildConfig()) as ParsedSveltiaConfig;

    expect(config.collections.map(({ name }) => name)).toEqual([
      'distro',
      'releases',
      'artists',
      'news',
      'site-pages',
      'navigation',
      'socials',
      'settings',
    ]);
    expect(config.collections.map(({ label }) => label)).toEqual([
      'Store Items — Distro & Merch',
      'Releases',
      'Artists',
      'News',
      'Site Pages',
      'Advanced — Navigation',
      'Advanced — Social Links',
      'Advanced — Site Settings',
    ]);
    expect(config.collections.map(({ description }) => description)).toEqual([
      'Editorial Store Item titles, images, grouping, format, order, and public copy. To stop selling, use protected stock or commerce-operator controls; do not delete the content entry. Price, stock, checkout availability, orders, and fulfillment are managed outside the CMS. Hosted publishing commits directly to main and starts site automation. Local saves change only the working tree; review, commit, and push with Git.',
      'Editorial release pages and artwork. Release identities also support public routes and Store Item projection, so structural removal requires maintainer review. Price, stock, and checkout are managed outside the CMS. Hosted publishing commits directly to main and starts site automation. Local saves change only the working tree; review, commit, and push with Git.',
      'Artist roster cards and detail pages. Artist identities also support public routes and Release references, so structural removal requires maintainer review. Hosted publishing commits directly to main and starts site automation. Local saves change only the working tree; review, commit, and push with Git.',
      'News listing cards and article pages. News entries may be deleted after confirming the public article should be removed. Hosted publishing commits directly to main and starts site automation. Local saves change only the working tree; review, commit, and push with Git.',
      'Public page copy and images. Edit content inside the named page sections, then review before publishing. Hosted publishing commits directly to main and starts site automation. Local saves change only the working tree; review, commit, and push with Git.',
      'Advanced: site-wide navigation labels, destinations, visibility, and order. Hosted publishing commits directly to main and starts site automation. Local saves change only the working tree; review, commit, and push with Git.',
      'Advanced: site-wide social identity links and order. Hosted publishing commits directly to main and starts site automation. Local saves change only the working tree; review, commit, and push with Git.',
      'Advanced: site-wide label identity, contact details, and metadata. Hosted publishing commits directly to main and starts site automation. Local saves change only the working tree; review, commit, and push with Git.',
    ]);
    expect(Object.fromEntries(config.collections.map(({ delete: canDelete, name }) => [name, canDelete]))).toEqual({
      artists: false,
      distro: false,
      navigation: false,
      news: true,
      releases: false,
      'site-pages': false,
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
    expect(yaml).toContain('hint: "Short line over the hero still."');
    expect(yaml).toContain(
      'hint: "Search the current Artists collection. The saved value is the Artist slug used by Astro references."',
    );
    expect(yaml).toContain('summary: "{{fields.title}}"');
  });

  it('emits named object fields for the fixed Home, About, and Services layouts', () => {
    type ConfigField = {
      fields?: ConfigField[];
      name: string;
    };
    const config = parse(buildConfig()) as {
      collections: Array<{ files?: Array<{ fields: ConfigField[]; name: string }>; name: string }>;
    };

    const sitePages = config.collections.find(({ name }) => name === 'site-pages');
    const fieldsByEntry = new Map(sitePages?.files?.map(({ name, fields }) => [name, fields]));
    expect(fieldsByEntry.get('home-site')?.map(({ name }) => name)).toEqual(['$schema', 'hero', 'news', 'artists']);
    expect(fieldsByEntry.get('about-site')?.map(({ name }) => name)).toEqual([
      '$schema',
      'hero',
      'lead',
      'story',
      'quote',
      'contact',
      'stats',
    ]);
    expect(fieldsByEntry.get('services-site')?.map(({ name }) => name)).toEqual([
      '$schema',
      'hero',
      'services',
      'process',
      'inquiry',
    ]);
  });

  it('exposes distro page copy and distro item fields without commerce authority', () => {
    const yaml = buildConfig();

    expect(yaml).toContain('name: "distro-page-site"');
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

describe('createSveltiaConfigResponse', () => {
  it.each(['local', 'hosted'] as const)('adds stable %s mode markers without changing YAML', async (mode) => {
    const yaml = buildConfig(mode === 'local' ? localRuntimeConfig : hostedRuntimeConfig);
    const response = createSveltiaConfigResponse({ mode, yaml });

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-type')).toBe('text/yaml; charset=utf-8');
    expect(response.headers.get(sveltiaModeHeaderName)).toBe(mode);
    expect(await response.text()).toBe(`# blackbox-sveltia-mode: ${mode}\n${yaml}`);
  });

  it('returns an explicit comment-only disabled response with no writable backend data', async () => {
    const response = createSveltiaConfigResponse({ mode: 'disabled' });
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-type')).toBe('text/yaml; charset=utf-8');
    expect(response.headers.get(sveltiaModeHeaderName)).toBe('disabled');
    expect(body).toBe('# blackbox-sveltia-mode: disabled\n# BlackBox CMS unavailable for this build.\n');
    expect(body).not.toMatch(/backend:|repo:|proxy_url:|auth_endpoint:|auth_token_endpoint:|127\.0\.0\.1|localhost/);
  });
});

describe('createSveltiaConfigErrorResponse', () => {
  it('returns setting-safe resolver guidance without configuration values', async () => {
    const response = createSveltiaConfigErrorResponse(
      new SveltiaRuntimeConfigError(
        'Hosted Sveltia configuration is missing required setting(s): SVELTIA_AUTH_BASE_URL. Set each named setting before building with SVELTIA_BACKEND_MODE=hosted.',
      ),
    );

    expect(response.status).toBe(500);
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await response.text()).toBe(
      'Hosted Sveltia configuration is missing required setting(s): SVELTIA_AUTH_BASE_URL. Set each named setting before building with SVELTIA_BACKEND_MODE=hosted.\n',
    );
  });

  it('replaces unexpected error details with generic remediation', async () => {
    const response = createSveltiaConfigErrorResponse(new Error('secret-value and full environment dump'));
    const body = await response.text();

    expect(body).toBe(
      'Sveltia configuration could not be generated. Review SVELTIA_BACKEND_MODE and required Sveltia settings, then retry.\n',
    );
    expect(body).not.toContain('secret-value');
    expect(body).not.toContain('environment dump');
  });
});
