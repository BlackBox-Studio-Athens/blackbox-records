import { escapeYamlScalar, indentYamlBlock } from './decap-yaml-builder';
import {
  DecapRuntimeConfigError,
  type DecapBackendMode,
  type DecapHostedRuntimeConfig,
  type DecapLocalRuntimeConfig,
} from './decap-runtime-config';
import { buildAboutFields } from './decap-about-fields';
import { buildArtistCollection } from './decap-artist-collection';
import { buildDistroCollection } from './decap-distro-collection';
import { buildDistroPageFields } from './decap-distro-page-fields';
import { buildHomeFields } from './decap-home-fields';
import { decapGlobalMedia } from './decap-media';
import { buildNewsCollection } from './decap-news-collection';
import { buildNewsletterFields } from './decap-newsletter-fields';
import { buildPageFileCollections } from './decap-page-collections';
import { buildReleaseCollection } from './decap-release-collection';
import { buildSettingsFields } from './decap-settings-fields';
import { buildServicesFields } from './decap-services-fields';
import { buildSiteChromeCollections } from './decap-site-chrome-collections';

type DecapWritableRuntimeConfig = DecapLocalRuntimeConfig | DecapHostedRuntimeConfig;

export type BuildDecapConfigOptions = {
  logoUrl: string;
  runtimeConfig: DecapWritableRuntimeConfig;
  siteRootUrl: string;
};

export const decapModeHeaderName = 'X-BlackBox-Decap-Mode';

const decapConfigContentType = 'text/yaml; charset=utf-8';
const genericDecapConfigErrorMessage =
  'Decap configuration could not be generated. Review DECAP_BACKEND_MODE and required Decap settings, then retry.';

function buildModeMarker(mode: DecapBackendMode): string {
  return `# blackbox-decap-mode: ${mode}`;
}

export function normalizeDecapConfigError(error: unknown): DecapRuntimeConfigError {
  return error instanceof DecapRuntimeConfigError ? error : new DecapRuntimeConfigError(genericDecapConfigErrorMessage);
}

export function createDecapConfigErrorResponse(error: unknown): Response {
  return new Response(`${normalizeDecapConfigError(error).message}\n`, {
    status: 500,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export function createDecapConfigResponse(
  input: { mode: 'disabled' } | { mode: Exclude<DecapBackendMode, 'disabled'>; yaml: string },
): Response {
  const headers = {
    'Cache-Control': 'no-store',
    'Content-Type': decapConfigContentType,
    [decapModeHeaderName]: input.mode,
  };

  if (input.mode === 'disabled') {
    return new Response(`${buildModeMarker(input.mode)}\n# BlackBox CMS unavailable for this build.\n`, {
      headers,
    });
  }

  return new Response(`${buildModeMarker(input.mode)}\n${input.yaml}`, { headers });
}

function buildBackendConfig(runtimeConfig: DecapWritableRuntimeConfig): string {
  switch (runtimeConfig.mode) {
    case 'local':
      return `backend:\n  name: proxy\n  proxy_url: ${escapeYamlScalar(`http://127.0.0.1:${runtimeConfig.localBackendPort}/api/v1`)}\n  branch: ${escapeYamlScalar(runtimeConfig.branch)}`;
    case 'hosted':
      return `backend:\n  name: git-gateway\n  repo: ${escapeYamlScalar(runtimeConfig.repository)}\n  branch: ${escapeYamlScalar(runtimeConfig.branch)}\n  auth_type: pkce\n  base_url: ${escapeYamlScalar(runtimeConfig.baseUrl)}\n  auth_endpoint: ${escapeYamlScalar(runtimeConfig.authEndpoint)}\n  auth_token_endpoint: ${escapeYamlScalar(runtimeConfig.authTokenEndpoint)}\n  gateway_url: ${escapeYamlScalar(runtimeConfig.gatewayUrl)}\n\n  commit_messages:\n    create: "Create {{collection}} \\"{{slug}}\\" via Decap CMS"\n    update: "Update {{collection}} \\"{{slug}}\\" via Decap CMS"\n    delete: "Delete {{collection}} \\"{{slug}}\\" via Decap CMS"\n    uploadMedia: "Upload \\"{{path}}\\" via Decap CMS"\n    deleteMedia: "Delete \\"{{path}}\\" via Decap CMS"\n    openAuthoring: "Open authoring for {{collection}} via Decap CMS"`;
  }
}

export function buildDecapConfig(options: BuildDecapConfigOptions): string {
  const backendConfig = buildBackendConfig(options.runtimeConfig);
  const authConfig =
    options.runtimeConfig.mode === 'hosted'
      ? `\n\nauth:\n  email_claim: email\n  first_name_claim: first_name\n  last_name_claim: last_name\n  avatar_url_claim: avatar_url`
      : '';

  const homeFields = buildHomeFields();
  const aboutFields = buildAboutFields();
  const distroPageFields = buildDistroPageFields();
  const servicesFields = buildServicesFields();
  const settingsFields = buildSettingsFields();
  const newsletterFields = buildNewsletterFields();

  const pageCollections = buildPageFileCollections({
    homeFields,
    aboutFields,
    distroPageFields,
    servicesFields,
    settingsFields,
    newsletterFields,
  });
  const siteChromeCollections = buildSiteChromeCollections();
  const collections = [
    pageCollections.home,
    buildArtistCollection(),
    buildReleaseCollection(),
    buildDistroCollection(),
    buildNewsCollection(),
    pageCollections.about,
    pageCollections.services,
    pageCollections.newsletter,
    pageCollections.distroPage,
    siteChromeCollections.navigation,
    siteChromeCollections.socials,
    pageCollections.settings,
  ];

  return `${backendConfig}\n\npublish_mode: simple\nslug:\n  encoding: ascii\n  clean_accents: true\n  sanitize_replacement: "-"\nmedia_folder: ${escapeYamlScalar(decapGlobalMedia.mediaFolder)}\npublic_folder: ${escapeYamlScalar(decapGlobalMedia.publicFolder)}\n${authConfig}\n\nsite_url: ${escapeYamlScalar(options.siteRootUrl)}\ndisplay_url: ${escapeYamlScalar(options.siteRootUrl)}\nlogo_url: ${escapeYamlScalar(options.logoUrl)}\neditor:\n  preview: true\n\ncollections:\n${indentYamlBlock(collections.join('\n\n'), 2)}\n`;
}
