import {
  buildField,
  buildFolderCollection,
  escapeYamlScalar,
  indentYamlBlock,
  type DecapSelectOption,
} from './decap-yaml-builder';
import { buildAboutFields } from './decap-about-fields';
import { buildArtistCollection } from './decap-artist-collection';
import { buildDistroCollection } from './decap-distro-collection';
import { buildHomeFields } from './decap-home-fields';
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
  const servicesFields = buildServicesFields();
  const settingsFields = buildSettingsFields();

  const collections = [
    ...buildPageFileCollections({ homeFields, aboutFields, servicesFields, settingsFields }),
    ...buildSiteChromeCollections(),
    buildArtistCollection(),
    buildReleaseCollection(options.artistOptions),
    buildDistroCollection(),
    buildFolderCollection({
      name: 'news',
      label: 'News',
      folder: 'src/content/news',
      create: true,
      delete: true,
      extension: 'md',
      format: 'frontmatter',
      identifierField: 'title',
      mediaFolder: '.',
      publicFolder: './',
      summary: '{{title}} - {{date}}',
      fields: [
        buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Article title.' }),
        buildField({
          label: 'Date',
          name: 'date',
          widget: 'datetime',
          hint: 'Publish date for the card and article header. Example: 2026-05-12.',
          extras: ['date_format: YYYY-MM-DD', 'time_format: false'],
        }),
        buildField({ label: 'Summary', name: 'summary', widget: 'text', hint: 'Short teaser used in listing cards.' }),
        buildField({
          label: 'Image',
          name: 'image',
          widget: 'image',
          hint: 'Lead image for the news card and article header.',
        }),
        buildField({
          label: 'Image alt',
          name: 'image_alt',
          widget: 'string',
          required: false,
          hint: 'Describe the news image for screen readers.',
        }),
        buildField({
          label: 'Section label',
          name: 'section_label',
          widget: 'string',
          required: false,
          hint: 'Optional small label shown above the article title.',
        }),
        buildField({ label: 'Body', name: 'body', widget: 'markdown', hint: 'Main article body in Markdown.' }),
      ],
    }),
  ];

  return `${backendConfig}\n\npublish_mode: simple\nmedia_folder: src/content/uploads\n${authConfig}\n\nsite_url: ${escapeYamlScalar(options.siteRootUrl)}\ndisplay_url: ${escapeYamlScalar(options.siteRootUrl)}\nlogo_url: ${escapeYamlScalar(options.logoUrl)}\neditor:\n  preview: true\n\ncollections:\n${indentYamlBlock(collections.join('\n\n'), 2)}\n`;
}
