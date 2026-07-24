import { buildField, buildSchemaField } from './decap-yaml-builder';
import { internalSitePathPatternSource } from '../editorial-validation';

export function buildHomeFields() {
  return [
    buildSchemaField('../../../.astro/collections/home.schema.json'),
    buildField({
      label: 'Hero',
      name: 'hero',
      widget: 'object',
      hint: 'Controls the opening still, tagline, and scroll cue.',
      collapsed: true,
      summary: '{{fields.tagline}}',
      fields: [
        buildField({ label: 'Tagline', name: 'tagline', widget: 'string', hint: 'Short line over the hero still.' }),
        buildField({
          label: 'Hero image',
          name: 'image',
          widget: 'image',
          chooseUrl: false,
          allowMultiple: false,
          hint: 'Full-bleed opening image. Keep the subject centered with breathing room for narrow mobile crops.',
        }),
        buildField({
          label: 'Hero image alt',
          name: 'image_alt',
          widget: 'string',
          required: true,
          hint: 'Required. Describe the visible scene and action for people who cannot see the image.',
        }),
        buildField({
          label: 'Scroll indicator text',
          name: 'scroll_indicator_text',
          widget: 'string',
          hint: 'Very short cue near the bottom of the hero. Example: "Scroll".',
        }),
      ],
    }),
    buildField({
      label: 'News',
      name: 'news',
      widget: 'object',
      hint: 'Fixed homepage News section. Edit its content, not the page structure.',
      collapsed: true,
      summary: '{{fields.title}}',
      fields: [
        buildField({
          label: 'Title',
          name: 'title',
          widget: 'string',
          hint: 'Main heading for the homepage News section.',
        }),
        buildField({
          label: 'Link text',
          name: 'link_text',
          widget: 'string',
          hint: 'CTA label. Example: "Read News".',
        }),
        buildField({
          label: 'Link URL',
          name: 'link_url',
          widget: 'string',
          hint: 'Internal section path starting with /. Example: /news/.',
          pattern: { value: internalSitePathPatternSource, message: 'Use a safe internal path beginning with /.' },
        }),
      ],
    }),
    buildField({
      label: 'Artists',
      name: 'artists',
      widget: 'object',
      hint: 'Fixed homepage Artists section. Edit its content, not the page structure.',
      collapsed: true,
      summary: '{{fields.title}}',
      fields: [
        buildField({
          label: 'Title',
          name: 'title',
          widget: 'string',
          hint: 'Main heading for the homepage Artists section.',
        }),
        buildField({
          label: 'Button text',
          name: 'button_text',
          widget: 'string',
          hint: 'CTA label. Example: "View full roster".',
        }),
        buildField({
          label: 'Button link',
          name: 'button_link',
          widget: 'string',
          hint: 'Internal section path starting with /. Example: /artists/.',
          pattern: { value: internalSitePathPatternSource, message: 'Use a safe internal path beginning with /.' },
        }),
      ],
    }),
  ];
}
