import { buildField, buildSchemaField } from './decap-yaml-builder';

const distroGroupOptions = ['Vinyl 12-inch', 'Vinyl 7-inch', 'CDs', 'Clothes', 'Tapes', 'Other'];

export function buildDistroPageFields() {
  return [
    buildSchemaField('../../../.astro/collections/distroPage.schema.json'),
    buildField({
      label: 'Page title',
      name: 'page_title',
      widget: 'string',
      hint: 'Browser title for the distro page.',
    }),
    buildField({
      label: 'Page description',
      name: 'page_description',
      widget: 'text',
      hint: 'Meta description used by search engines and social previews.',
    }),
    buildField({
      label: 'Hero',
      name: 'hero',
      widget: 'object',
      hint: 'Controls the intro block above the distro shelves.',
      collapsed: true,
      summary: '{{fields.title}}',
      fields: [
        buildField({
          label: 'Section label',
          name: 'section_label',
          widget: 'string',
          hint: 'Small label above the distro title.',
        }),
        buildField({
          label: 'Title',
          name: 'title',
          widget: 'string',
          hint: 'Main heading for the distro page.',
        }),
        buildField({
          label: 'Intro',
          name: 'intro',
          widget: 'text',
          hint: 'Short paragraph under the distro title.',
        }),
      ],
    }),
    buildField({
      label: 'Group intros',
      name: 'group_intros',
      widget: 'object',
      hint: 'Intro text shown beside each distro shelf heading.',
      collapsed: true,
      fields: distroGroupOptions.map((group) =>
        buildField({
          label: group,
          name: group,
          widget: 'text',
          hint: `Intro copy for the ${group} shelf.`,
        }),
      ),
    }),
  ];
}
