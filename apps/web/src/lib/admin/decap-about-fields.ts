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
          hint: 'Primary About-page image. Use a clear focal point that survives the current tall editorial crop.',
        }),
        buildField({
          label: 'Image alt',
          name: 'image_alt',
          widget: 'string',
          required: true,
          hint: 'Required. Describe the visible people, place, or equipment rather than repeating the page title.',
        }),
      ],
    }),
    buildField({
      label: 'Sections',
      name: 'sections',
      widget: 'list',
      hint: 'Fixed About-page layout. Edit content inside the existing named sections.',
      collapsed: true,
      allowAdd: false,
      allowRemove: false,
      allowReorder: false,
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
              labelSingular: 'Paragraph',
              collapsed: true,
              summary: '{{fields.value}}',
              allowAdd: true,
              allowRemove: true,
              allowReorder: true,
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
              labelSingular: 'Contact row',
              hint: 'Contact rows such as email, city, or booking.',
              collapsed: true,
              summary: '{{fields.label}}: {{fields.value}}',
              allowAdd: true,
              allowRemove: true,
              allowReorder: true,
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
              labelSingular: 'Stat',
              hint: 'Small label/value pairs shown near the About content.',
              collapsed: true,
              summary: '{{fields.key}} — {{fields.label}}',
              allowAdd: true,
              allowRemove: true,
              allowReorder: true,
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
