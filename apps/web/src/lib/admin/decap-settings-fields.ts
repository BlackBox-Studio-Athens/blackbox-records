import { buildField, buildSchemaField } from './decap-yaml-builder';

export function buildSettingsFields() {
  return [
    buildSchemaField('../../../.astro/collections/settings.schema.json'),
    buildField({
      label: 'Label name',
      name: 'label_name',
      widget: 'string',
      hint: 'Official public name used in metadata and footer copy.',
    }),
    buildField({
      label: 'Established year',
      name: 'established_year',
      widget: 'number',
      hint: 'Four-digit year used in footer and metadata.',
      extras: ['value_type: int', 'min: 1900'],
    }),
    buildField({
      label: 'URL',
      name: 'url',
      widget: 'string',
      hint: 'Canonical site URL including https://. Example: https://blackbox-studio-athens.github.io/blackbox-records/.',
    }),
    buildField({
      label: 'Logo path',
      name: 'logo',
      widget: 'string',
      hint: 'Public asset path used in metadata and admin chrome. Example: /assets/images/brand/logo.png.',
    }),
    buildField({
      label: 'Location',
      name: 'location',
      widget: 'object',
      hint: 'Location data used in structured metadata.',
      collapsed: true,
      summary: '{{fields.locality}}, {{fields.country}}',
      fields: [
        buildField({ label: 'Locality', name: 'locality', widget: 'string', hint: 'City or locality name.' }),
        buildField({ label: 'Country', name: 'country', widget: 'string', hint: 'Country name.' }),
      ],
    }),
  ];
}
