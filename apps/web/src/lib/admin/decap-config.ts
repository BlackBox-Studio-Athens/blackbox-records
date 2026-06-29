import { escapeYamlScalar, indentYamlBlock, type DecapSelectOption } from './decap-yaml-builder';
import { buildAboutFields } from './decap-about-fields';
import { buildArtistCollection } from './decap-artist-collection';
import { buildDistroCollection } from './decap-distro-collection';
import { buildDistroPageFields } from './decap-distro-page-fields';
import { buildHomeFields } from './decap-home-fields';
import { buildNewsCollection } from './decap-news-collection';
import { buildNewsletterFields } from './decap-newsletter-fields';
import { buildPageFileCollections } from './decap-page-collections';
import { buildReleaseCollection } from './decap-release-collection';
import { buildSettingsFields } from './decap-settings-fields';
import { buildServicesFields } from './decap-services-fields';
import { buildSiteChromeCollections } from './decap-site-chrome-collections';

export type DecapArtistOption = DecapSelectOption;

export type BuildDecapConfigOptions = {
  artistOptions: DecapArtistOption[];
  authEndpoint: string;
  authTokenEndpoint: string;
  baseUrl: string;
  branch: string;
  gatewayUrl: string;
  useLocalBackend: boolean;
  localBackendPort: string;
  logoUrl: string;
  repository: string;
  siteRootUrl: string;
};

export function buildDecapConfig(options: BuildDecapConfigOptions): string {
  const backendConfig = options.useLocalBackend
    ? `backend:\n  name: proxy\n  proxy_url: ${escapeYamlScalar(`http://127.0.0.1:${options.localBackendPort}/api/v1`)}\n  branch: ${escapeYamlScalar(options.branch)}`
    : `backend:\n  name: git-gateway\n  repo: ${escapeYamlScalar(options.repository)}\n  branch: ${escapeYamlScalar(options.branch)}\n  auth_type: pkce\n  base_url: ${escapeYamlScalar(options.baseUrl)}\n  auth_endpoint: ${escapeYamlScalar(options.authEndpoint)}\n  auth_token_endpoint: ${escapeYamlScalar(options.authTokenEndpoint)}\n  gateway_url: ${escapeYamlScalar(options.gatewayUrl)}\n\n  commit_messages:\n    create: "Create {{collection}} \\"{{slug}}\\" via Decap CMS"\n    update: "Update {{collection}} \\"{{slug}}\\" via Decap CMS"\n    delete: "Delete {{collection}} \\"{{slug}}\\" via Decap CMS"\n    uploadMedia: "Upload \\"{{path}}\\" via Decap CMS"\n    deleteMedia: "Delete \\"{{path}}\\" via Decap CMS"\n    openAuthoring: "Open authoring for {{collection}} via Decap CMS"`;

  const authConfig = options.useLocalBackend
    ? ''
    : `\n\nauth:\n  email_claim: email\n  first_name_claim: first_name\n  last_name_claim: last_name\n  avatar_url_claim: avatar_url`;

  const homeFields = buildHomeFields();
  const aboutFields = buildAboutFields();
  const distroPageFields = buildDistroPageFields();
  const servicesFields = buildServicesFields();
  const settingsFields = buildSettingsFields();
  const newsletterFields = buildNewsletterFields();

  const collections = [
    ...buildPageFileCollections({
      homeFields,
      aboutFields,
      distroPageFields,
      servicesFields,
      settingsFields,
      newsletterFields,
    }),
    ...buildSiteChromeCollections(),
    buildArtistCollection(),
    buildReleaseCollection(options.artistOptions),
    buildDistroCollection(),
    buildNewsCollection(),
  ];

  return `${backendConfig}\n\npublish_mode: simple\nmedia_folder: apps/web/src/content/uploads\n${authConfig}\n\nsite_url: ${escapeYamlScalar(options.siteRootUrl)}\ndisplay_url: ${escapeYamlScalar(options.siteRootUrl)}\nlogo_url: ${escapeYamlScalar(options.logoUrl)}\neditor:\n  preview: true\n\ncollections:\n${indentYamlBlock(collections.join('\n\n'), 2)}\n`;
}
