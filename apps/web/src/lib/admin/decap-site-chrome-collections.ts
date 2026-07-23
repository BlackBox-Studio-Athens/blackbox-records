import { buildField, buildFolderCollection, buildSchemaField } from './decap-yaml-builder';
import { decapCollectionDescriptions } from './decap-editorial-copy';
import { httpsUrlPatternSource, internalSitePathPatternSource } from '../editorial-validation';

export function buildSiteChromeCollections() {
  return {
    navigation: buildFolderCollection({
      name: 'navigation',
      label: 'Advanced — Navigation',
      description: decapCollectionDescriptions.navigation,
      folder: 'apps/web/src/content/navigation',
      create: false,
      delete: false,
      extension: 'json',
      format: 'json',
      identifierField: 'title',
      summary: '{{order}} — {{title}} → {{url}}',
      sortableFields: ['order', 'title', 'commit_date'],
      fields: [
        buildSchemaField('../../../.astro/collections/navigation.schema.json'),
        buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Visible navigation label.' }),
        buildField({
          label: 'URL',
          name: 'url',
          widget: 'string',
          hint: 'Site-wide internal destination. Example: /artists/. Confirm the route before publishing.',
          pattern: { value: internalSitePathPatternSource, message: 'Use a safe internal path beginning with /.' },
        }),
        buildField({
          label: 'Order',
          name: 'order',
          widget: 'number',
          hint: 'Lower numbers appear first.',
          valueType: 'int',
          min: 0,
        }),
        buildField({
          label: 'Show in header',
          name: 'show_in_header',
          widget: 'boolean',
          required: true,
          hint: 'Enable this item in the desktop and mobile header navigation.',
          defaultValue: true,
        }),
        buildField({
          label: 'Show in footer',
          name: 'show_in_footer',
          widget: 'boolean',
          required: true,
          hint: 'Enable this item in the footer sitemap.',
          defaultValue: true,
        }),
      ],
    }),
    socials: buildFolderCollection({
      name: 'socials',
      label: 'Advanced — Social Links',
      description: decapCollectionDescriptions.socials,
      labelSingular: 'Social link',
      sortableFields: ['order', 'title', 'commit_date'],
      folder: 'apps/web/src/content/socials',
      create: true,
      delete: true,
      extension: 'json',
      format: 'json',
      identifierField: 'title',
      slug: '{{slug}}',
      summary: '{{title}}',
      fields: [
        buildSchemaField('../../../.astro/collections/socials.schema.json'),
        buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Platform or network name.' }),
        buildField({
          label: 'URL',
          name: 'url',
          widget: 'string',
          hint: 'Full HTTPS profile URL. Use # only for an intentionally hidden placeholder entry.',
          pattern: {
            value: `^(?:#|${httpsUrlPatternSource.slice(1, -1)})$`,
            message: 'Use a full HTTPS profile URL or # to hide the link.',
          },
        }),
        buildField({
          label: 'Order',
          name: 'order',
          widget: 'number',
          hint: 'Lower numbers appear first.',
          valueType: 'int',
          min: 0,
        }),
      ],
    }),
  };
}
