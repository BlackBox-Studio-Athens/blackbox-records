import { buildField, buildSchemaField } from './decap-yaml-builder';
import { httpsUrlPatternSource, publicImagePathPatternSource } from '../editorial-validation';

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
      hint: 'Four-digit founding year used in footer and metadata. Example: 2026.',
      valueType: 'int',
      min: 1900,
      max: 2100,
    }),
    buildField({
      label: 'URL',
      name: 'url',
      widget: 'string',
      hint: 'Canonical site URL including https://. Example: https://blackbox-studio-athens.github.io/blackbox-records/.',
      pattern: { value: httpsUrlPatternSource, message: 'Use the full canonical HTTPS site URL.' },
    }),
    buildField({
      label: 'Logo path',
      name: 'logo',
      widget: 'string',
      hint: 'Public asset path used in metadata and admin chrome. Example: /assets/images/brand/logo.png.',
      pattern: {
        value: publicImagePathPatternSource,
        message: 'Use an image path below /assets/, for example /assets/images/brand/logo.png.',
      },
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
