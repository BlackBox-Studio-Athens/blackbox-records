import { buildField, buildSchemaField } from './decap-yaml-builder';
import { emailAddressPatternSource } from '../editorial-validation';

export function buildNewsletterFields() {
  return [
    buildSchemaField('../../../.astro/collections/newsletter.schema.json'),
    buildField({
      label: 'Section label',
      name: 'section_label',
      widget: 'string',
      hint: 'Visible eyebrow above the newsletter signup title. Example: "Newsletter".',
    }),
    buildField({
      label: 'Title',
      name: 'title',
      widget: 'string',
      hint: 'Visible heading for the shared signup block. Keep the current invitation tone.',
    }),
    buildField({
      label: 'Description',
      name: 'description',
      widget: 'text',
      hint: 'Visible signup promise shown above the email field. Describe what subscribers receive.',
    }),
    buildField({
      label: 'Email placeholder',
      name: 'placeholder',
      widget: 'string',
      hint: 'Email-shaped example shown inside the field. Example: your@email.com.',
      pattern: { value: emailAddressPatternSource, message: 'Use an email-shaped placeholder such as your@email.com.' },
    }),
    buildField({
      label: 'Button label',
      name: 'button_label',
      widget: 'string',
      hint: 'Visible submit button text. Keep it short and action-oriented.',
    }),
    buildField({
      label: 'Note',
      name: 'note',
      widget: 'text',
      hint: 'Visible reassurance below the form, such as unsubscribe or spam expectations.',
    }),
  ];
}
