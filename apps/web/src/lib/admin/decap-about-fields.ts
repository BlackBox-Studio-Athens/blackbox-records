import { buildField, buildFieldMapping, buildSchemaField } from './decap-yaml-builder';

export function buildAboutFields() {
  return [
    buildSchemaField('../../../.astro/collections/about.schema.json'),
    buildField({
      label: 'Hero',
      name: 'hero',
      widget: 'object',
      hint: 'Opening section for the full About page.',
      collapsed: true,
      summary: '{{fields.title}}',
      fields: [
        buildField({
          label: 'Section label',
          name: 'section_label',
          widget: 'string',
          hint: 'Small label above the hero title.',
        }),
        buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Primary About page title.' }),
        buildField({
          label: 'Image',
          name: 'image',
          widget: 'image',
          hint: 'Hero image for the About page. Use a clear focal point that survives a tall crop.',
        }),
        buildField({
          label: 'Image alt',
          name: 'image_alt',
          widget: 'string',
          hint: 'Describe the About hero image for screen readers.',
        }),
      ],
    }),
    buildField({
      label: 'Sections',
      name: 'sections',
      widget: 'list',
      hint: 'Add, remove, or reorder whole About page sections.',
      collapsed: true,
      types: [
        {
          label: 'Lead',
          name: 'lead',
          summary: '{{fields.text}}',
          fields: [
            buildField({
              label: 'Text',
              name: 'text',
              widget: 'text',
              hint: 'Opening paragraph immediately after the About hero.',
            }),
          ],
        },
        {
          label: 'Story',
          name: 'story',
          summary: '{{fields.title}}',
          fields: [
            buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Section heading.' }),
            buildField({
              label: 'Paragraphs',
              name: 'paragraphs',
              widget: 'list',
              collapsed: true,
              summary: '{{fields.value}}',
              field: buildFieldMapping({
                label: 'Paragraph',
                name: 'value',
                widget: 'text',
                hint: 'Section body copy. Keep each item to one paragraph.',
              }),
            }),
          ],
        },
        {
          label: 'Quote',
          name: 'quote',
          summary: '{{fields.cite}}',
          fields: [
            buildField({ label: 'Text', name: 'text', widget: 'text', hint: 'Quoted line or statement.' }),
            buildField({
              label: 'Cite',
              name: 'cite',
              widget: 'string',
              hint: 'Attribution line shown with the quote.',
            }),
          ],
        },
        {
          label: 'Contact',
          name: 'contact',
          summary: '{{fields.title}}',
          fields: [
            buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Contact panel heading.' }),
            buildField({
              label: 'Intro',
              name: 'intro',
              widget: 'text',
              hint: 'Short intro line before the contact rows.',
            }),
            buildField({
              label: 'Items',
              name: 'items',
              widget: 'list',
              hint: 'Contact rows such as email, city, or booking.',
              collapsed: true,
              summary: '{{fields.label}}: {{fields.value}}',
              fields: [
                buildField({
                  label: 'Label',
                  name: 'label',
                  widget: 'string',
                  hint: 'Left-hand label. Example: "Email".',
                }),
                buildField({ label: 'Value', name: 'value', widget: 'string', hint: 'Displayed value or address.' }),
              ],
            }),
          ],
        },
        {
          label: 'Stats',
          name: 'stats',
          summary: 'Stats',
          fields: [
            buildField({
              label: 'Items',
              name: 'items',
              widget: 'list',
              hint: 'Small label/value pairs shown near the About content.',
              collapsed: true,
              summary: '{{fields.label}}',
              fields: [
                buildField({
                  label: 'Key',
                  name: 'key',
                  widget: 'string',
                  hint: 'Short value or number. Example: "12" or "EST. 2026".',
                }),
                buildField({ label: 'Label', name: 'label', widget: 'string', hint: 'Descriptor shown with the key.' }),
              ],
            }),
          ],
        },
      ],
    }),
  ];
}
