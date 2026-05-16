import { buildField, buildFieldMapping, buildSchemaField } from './decap-yaml-builder';

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
        buildField({
          label: 'Tagline',
          name: 'tagline',
          widget: 'string',
          hint: 'Short line over the hero still. Example: "Heavy music on record."',
        }),
        buildField({
          label: 'Hero image',
          name: 'image',
          widget: 'image',
          hint: 'Upload the hero still used behind the landing section. Keep the subject centered for narrow mobile crops.',
        }),
        buildField({
          label: 'Hero image alt',
          name: 'image_alt',
          widget: 'string',
          hint: 'Describe the visible scene for screen readers.',
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
      label: 'Sections',
      name: 'sections',
      widget: 'list',
      hint: 'Add, remove, or reorder whole homepage sections.',
      collapsed: true,
      types: [
        {
          label: 'Latest releases',
          name: 'latest_releases',
          summary: '{{fields.title}}',
          fields: [
            buildField({
              label: 'Section label',
              name: 'section_label',
              widget: 'string',
              hint: 'Small label above the section title.',
            }),
            buildField({
              label: 'Title',
              name: 'title',
              widget: 'string',
              hint: 'Main heading for the homepage releases section.',
            }),
            buildField({
              label: 'Link text',
              name: 'link_text',
              widget: 'string',
              hint: 'CTA label. Example: "View all releases".',
            }),
            buildField({
              label: 'Link URL',
              name: 'link_url',
              widget: 'string',
              hint: 'Internal section path starting with /. Example: /releases/.',
            }),
          ],
        },
        {
          label: 'Artists',
          name: 'artists',
          summary: '{{fields.title}}',
          fields: [
            buildField({
              label: 'Section label',
              name: 'section_label',
              widget: 'string',
              hint: 'Small label above the section title.',
            }),
            buildField({
              label: 'Title',
              name: 'title',
              widget: 'string',
              hint: 'Main heading for the homepage artists section.',
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
            }),
          ],
        },
        {
          label: 'Distro',
          name: 'distro',
          summary: '{{fields.title}}',
          fields: [
            buildField({
              label: 'Section label',
              name: 'section_label',
              widget: 'string',
              hint: 'Small label above the section title.',
            }),
            buildField({
              label: 'Title',
              name: 'title',
              widget: 'string',
              hint: 'Main heading for the homepage distro shelf.',
            }),
            buildField({
              label: 'Link text',
              name: 'link_text',
              widget: 'string',
              hint: 'CTA label. Example: "View all distro".',
            }),
            buildField({
              label: 'Link URL',
              name: 'link_url',
              widget: 'string',
              hint: 'Internal section path starting with /. Example: /distro/.',
            }),
          ],
        },
        {
          label: 'Journey',
          name: 'journey',
          summary: '{{fields.title}}',
          fields: [
            buildField({
              label: 'Section label',
              name: 'section_label',
              widget: 'string',
              hint: 'Small label above the section title.',
            }),
            buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Main heading for the story block.' }),
            buildField({
              label: 'Image',
              name: 'image',
              widget: 'image',
              hint: 'Supporting image for the journey section. Use a crop that survives both desktop and mobile framing.',
            }),
            buildField({
              label: 'Image alt',
              name: 'image_alt',
              widget: 'string',
              hint: 'Describe the journey image for screen readers.',
            }),
            buildField({
              label: 'Paragraphs',
              name: 'paragraphs',
              widget: 'list',
              hint: 'Short editorial paragraphs shown in order.',
              collapsed: true,
              summary: '{{fields.value}}',
              field: buildFieldMapping({
                label: 'Paragraph',
                name: 'value',
                widget: 'text',
                hint: 'Keep paragraphs concise so the section remains readable on mobile.',
              }),
            }),
            buildField({
              label: 'Stats',
              name: 'stats',
              widget: 'list',
              hint: 'Small label/value pairs shown beside the journey copy.',
              collapsed: true,
              summary: '{{fields.label}}',
              fields: [
                buildField({
                  label: 'Key',
                  name: 'key',
                  widget: 'string',
                  hint: 'Short value or number. Example: "12" or "EST. 2026".',
                }),
                buildField({
                  label: 'Label',
                  name: 'label',
                  widget: 'string',
                  hint: 'Descriptor shown under or beside the key.',
                }),
              ],
            }),
          ],
        },
      ],
    }),
  ];
}
