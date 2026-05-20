import { buildField, buildSchemaField } from './decap-yaml-builder';

export function buildNewsletterFields() {
  return [
    buildSchemaField('../../../.astro/collections/newsletter.schema.json'),
    buildField({
      label: 'Section label',
      name: 'section_label',
      widget: 'string',
      hint: 'Small label shown above the newsletter title.',
    }),
    buildField({
      label: 'Title',
      name: 'title',
      widget: 'string',
      hint: 'Main heading for the shared newsletter signup block.',
    }),
    buildField({
      label: 'Description',
      name: 'description',
      widget: 'text',
      hint: 'Short paragraph shown above the email field.',
    }),
    buildField({
      label: 'Email placeholder',
      name: 'placeholder',
      widget: 'string',
      hint: 'Placeholder text inside the email field.',
    }),
    buildField({
      label: 'Button label',
      name: 'button_label',
      widget: 'string',
      hint: 'Submit button text.',
    }),
    buildField({
      label: 'Note',
      name: 'note',
      widget: 'text',
      hint: 'Small note shown below the form.',
    }),
  ];
}
