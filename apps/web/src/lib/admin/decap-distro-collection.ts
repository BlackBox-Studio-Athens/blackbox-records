import { buildField, buildFolderCollection, buildSchemaField } from './decap-yaml-builder';
import { decapCollectionDescriptions } from './decap-editorial-copy';

export function buildDistroCollection() {
  return buildFolderCollection({
    name: 'distro',
    label: 'Store Items — Distro & Merch',
    description: decapCollectionDescriptions.distro,
    folder: 'apps/web/src/content/distro',
    create: true,
    delete: true,
    extension: 'json',
    format: 'json',
    identifierField: 'title',
    mediaFolder: '.',
    publicFolder: './',
    summary: '{{title}} - {{group}}',
    fields: [
      buildSchemaField('../../../.astro/collections/distro.schema.json'),
      buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Item name shown in distro cards.' }),
      buildField({
        label: 'Group',
        name: 'group',
        widget: 'select',
        hint: 'Choose the shelf this item appears under.',
        options: [
          { label: 'Vinyl 12-inch', value: 'Vinyl 12-inch' },
          { label: 'Vinyl 10-inch', value: 'Vinyl 10-inch' },
          { label: 'Vinyl 7-inch', value: 'Vinyl 7-inch' },
          { label: 'CDs', value: 'CDs' },
          { label: 'Clothes', value: 'Clothes' },
          { label: 'Tapes', value: 'Tapes' },
          { label: 'Other', value: 'Other' },
        ],
      }),
      buildField({
        label: 'Artist or label',
        name: 'artist_or_label',
        widget: 'string',
        hint: 'Supporting line shown below the item title.',
      }),
      buildField({
        label: 'Image',
        name: 'image',
        widget: 'image',
        hint: 'Product image used in distro cards. Choose a clean, readable crop.',
      }),
      buildField({
        label: 'Image alt',
        name: 'image_alt',
        widget: 'string',
        hint: 'Describe the product image for screen readers.',
      }),
      buildField({
        label: 'Summary',
        name: 'summary',
        widget: 'text',
        hint: 'Short curator-style note for the distro item.',
      }),
      buildField({
        label: 'Eyebrow',
        name: 'eyebrow',
        widget: 'string',
        required: false,
        hint: 'Optional small label above the summary.',
      }),
      buildField({
        label: 'Format',
        name: 'format',
        widget: 'string',
        required: false,
        hint: 'Optional short format note, such as "LP" or "Black tee".',
      }),
      buildField({
        label: 'Release date',
        name: 'release_date',
        widget: 'datetime',
        required: false,
        hint: 'Optional known release date used for public display metadata. Leave empty when unknown; do not infer from description text.',
        extras: ['date_format: YYYY-MM-DD', 'time_format: false'],
      }),
      buildField({
        label: 'Order',
        name: 'order',
        widget: 'number',
        hint: 'Lower numbers appear first within the group.',
        extras: ['value_type: int', 'min: 0'],
      }),
    ],
  });
}
