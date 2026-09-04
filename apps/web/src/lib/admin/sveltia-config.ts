import { escapeYamlScalar, indentYamlBlock } from './decap-yaml-builder';
import {
  SveltiaRuntimeConfigError,
  type SveltiaBackendMode,
  type SveltiaRuntimeConfig,
} from './sveltia-runtime-config';
import { buildAboutFields } from './decap-about-fields';
import { buildArtistCollection } from './decap-artist-collection';
import { buildDistroCollection } from './decap-distro-collection';
import { buildDistroPageFields } from './decap-distro-page-fields';
import { buildHomeFields } from './decap-home-fields';
import { cmsGlobalMedia } from './sveltia-media';
import { buildNewsCollection } from './decap-news-collection';
import { buildNewsletterFields } from './decap-newsletter-fields';
import { buildPageFileCollections } from './decap-page-collections';
import { buildReleaseCollection } from './decap-release-collection';
import { buildSettingsFields } from './decap-settings-fields';
import { buildServicesFields } from './decap-services-fields';
import { buildSiteChromeCollections } from './decap-site-chrome-collections';

type BuildSveltiaConfigOptions = {
  logoUrl: string;
  runtimeConfig: SveltiaRuntimeConfig;
  siteRootUrl: string;
};

const configContentType = 'text/yaml; charset=utf-8';
const genericConfigErrorMessage =
  'Sveltia configuration could not be generated. Review SVELTIA_BACKEND_MODE and required Sveltia settings, then retry.';

function buildModeMarker(mode: SveltiaBackendMode): string {
  return `# blackbox-sveltia-mode: ${mode}`;
}

export function normalizeSveltiaConfigError(error: unknown): SveltiaRuntimeConfigError {
  return error instanceof SveltiaRuntimeConfigError ? error : new SveltiaRuntimeConfigError(genericConfigErrorMessage);
}

export function createSveltiaConfigErrorResponse(error: unknown): Response {
  return new Response(`${normalizeSveltiaConfigError(error).message}\n`, {
    status: 500,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export function createSveltiaConfigResponse(
  input: { mode: 'disabled' } | { mode: Exclude<SveltiaBackendMode, 'disabled'>; yaml: string },
): Response {
  const headers = {
    'Cache-Control': 'no-store',
    'Content-Type': configContentType,
  };

  if (input.mode === 'disabled') {
    return new Response(`${buildModeMarker(input.mode)}\n# BlackBox CMS unavailable for this build.\n`, {
      headers,
    });
  }

  return new Response(`${buildModeMarker(input.mode)}\n${input.yaml}`, { headers });
}

export function buildSveltiaConfig(options: BuildSveltiaConfigOptions): string {
  if (options.runtimeConfig.mode === 'disabled')
    throw new SveltiaRuntimeConfigError('Disabled CMS has no writable configuration.');
  const backendConfig = `backend:\n  name: github\n  repo: "BlackBox-Studio-Athens/blackbox-records"\n  branch: main${options.runtimeConfig.mode === 'hosted' ? `\n  base_url: ${escapeYamlScalar(options.runtimeConfig.baseUrl)}` : ''}`;

  const pageCollections = buildPageFileCollections({
    homeFields: buildHomeFields(),
    aboutFields: buildAboutFields(),
    distroPageFields: buildDistroPageFields(),
    servicesFields: buildServicesFields(),
    settingsFields: buildSettingsFields(),
    newsletterFields: buildNewsletterFields(),
  });
  const siteChromeCollections = buildSiteChromeCollections();
  const collections = [
    buildDistroCollection(),
    buildReleaseCollection(),
    buildArtistCollection(),
    buildNewsCollection(),
    pageCollections.sitePages,
    siteChromeCollections.navigation,
    siteChromeCollections.socials,
    pageCollections.settings,
  ];

  return `${backendConfig}\n\npublish_mode: simple\napp_title: BlackBox CMS\noutput:\n  omit_empty_optional_fields: true\nslug:\n  encoding: ascii\n  clean_accents: true\n  sanitize_replacement: "-"\nmedia_folder: ${escapeYamlScalar(cmsGlobalMedia.mediaFolder)}\npublic_folder: ${escapeYamlScalar(new URL('assets', options.siteRootUrl).pathname)}\nmedia_libraries:\n  default:\n    config:\n      slugify_filename: true\n\nsite_url: ${escapeYamlScalar(options.siteRootUrl)}\ndisplay_url: ${escapeYamlScalar(options.siteRootUrl)}\nlogo:\n  src: ${escapeYamlScalar(options.logoUrl)}\n  show_in_header: true\neditor:\n  preview: true\n\ncollections:\n${indentYamlBlock(collections.join('\n\n'), 2)}\n`;
}
