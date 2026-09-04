import { buildField, buildSchemaField } from './decap-yaml-builder';
import { DISTRO_INTRO_FIELDS } from '../distro-data';

export function buildDistroPageFields() {
  return [
    buildSchemaField('../../../.astro/collections/distroPage.schema.json'),
    buildField({
      label: 'Page introduction',
      name: 'hero',
      widget: 'object',
      hint: 'Visible heading and introduction above the Store/Distro shelves.',
      collapsed: true,
      summary: '{{fields.title}}',
      fields: [
        buildField({
          label: 'Title',
          name: 'title',
          widget: 'string',
          hint: 'Visible Store/Distro heading. Example: "Distro".',
        }),
        buildField({
          label: 'Intro',
          name: 'intro',
          widget: 'text',
          hint: 'Visible paragraph directly under the heading.',
        }),
      ],
    }),
    buildField({
      label: 'Shelf introductions',
      name: 'group_intros',
      widget: 'object',
      hint: 'Visible copy shown with each Store/Distro format shelf.',
      collapsed: true,
      fields: DISTRO_INTRO_FIELDS.map(({ name, label }) =>
        buildField({
          label,
          name,
          widget: 'text',
          hint: `Intro copy for the ${label} shelf.`,
        }),
      ),
    }),
  ];
}
