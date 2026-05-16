import { buildField, buildFolderCollection, buildSchemaField } from './decap-yaml-builder';

export function buildSiteChromeCollections() {
  return [
    buildFolderCollection({
      name: 'navigation',
      label: 'Navigation',
      folder: 'src/content/navigation',
      create: false,
      delete: false,
      extension: 'json',
      format: 'json',
      identifierField: 'title',
      summary: '{{title}} -> {{url}}',
      fields: [
        buildSchemaField('../../../.astro/collections/navigation.schema.json'),
        buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Visible navigation label.' }),
        buildField({
          label: 'URL',
          name: 'url',
          widget: 'string',
          hint: 'Internal routes should start with /. External links should include https://.',
        }),
        buildField({
          label: 'Order',
          name: 'order',
          widget: 'number',
          hint: 'Lower numbers appear first.',
          extras: ['value_type: int', 'min: 0'],
        }),
        buildField({
          label: 'Show in header',
          name: 'show_in_header',
          widget: 'boolean',
          required: false,
          hint: 'Enable this item in the desktop and mobile header navigation.',
          extras: ['default: true'],
        }),
        buildField({
          label: 'Show in footer',
          name: 'show_in_footer',
          widget: 'boolean',
          required: false,
          hint: 'Enable this item in the footer sitemap.',
          extras: ['default: true'],
        }),
      ],
    }),
    buildFolderCollection({
      name: 'socials',
      label: 'Socials',
      folder: 'src/content/socials',
      create: true,
      delete: true,
      extension: 'json',
      format: 'json',
      identifierField: 'title',
      summary: '{{title}}',
      fields: [
        buildSchemaField('../../../.astro/collections/socials.schema.json'),
        buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Platform or network name.' }),
        buildField({ label: 'URL', name: 'url', widget: 'string', hint: 'Full profile URL including https://.' }),
        buildField({
          label: 'Order',
          name: 'order',
          widget: 'number',
          hint: 'Lower numbers appear first.',
          extras: ['value_type: int', 'min: 0'],
        }),
      ],
    }),
  ];
}
