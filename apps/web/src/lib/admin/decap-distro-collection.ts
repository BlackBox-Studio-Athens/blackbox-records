import { buildField, buildFolderCollection, buildSchemaField } from './decap-yaml-builder';
import { decapCollectionDescriptions } from './decap-editorial-copy';
import { decapCollectionMedia } from './decap-media';
import { DISTRO_GROUP_VALUES } from '../distro-data';

export function buildDistroCollection() {
  return buildFolderCollection({
    name: 'distro',
    label: 'Store Items — Distro & Merch',
    description: decapCollectionDescriptions.distro,
    labelSingular: 'Store Item',
    previewPath: 'store/{{slug}}/',
    sortableFields: ['title', 'group', 'order', 'commit_date'],
    viewGroups: [{ label: 'Group', field: 'group' }],
    folder: 'apps/web/src/content/distro',
    create: true,
    delete: false,
    extension: 'json',
    format: 'json',
    identifierField: 'title',
    slug: '{{slug}}',
    mediaFolder: decapCollectionMedia.distro.mediaFolder,
    publicFolder: decapCollectionMedia.distro.publicFolder,
    summary: '{{title}} — {{group}} — order {{order}}',
    fields: [
      buildSchemaField('../../../.astro/collections/distro.schema.json'),
      buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Item name shown in distro cards.' }),
      buildField({
        label: 'Group',
        name: 'group',
        widget: 'select',
        hint: 'Choose the shelf this item appears under.',
        options: DISTRO_GROUP_VALUES.map((group) => ({ label: group, value: group })),
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
        hint: 'Product artwork or front-view image used in Store cards and detail pages. Keep the item readable at small sizes.',
      }),
      buildField({
        label: 'Image alt',
        name: 'image_alt',
        widget: 'string',
        required: true,
        hint: 'Required. Describe the visible item, format, and artwork or front view without repeating only the title.',
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
        valueType: 'int',
        min: 0,
      }),
    ],
  });
}
