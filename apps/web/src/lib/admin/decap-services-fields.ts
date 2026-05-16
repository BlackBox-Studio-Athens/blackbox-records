import { buildField, buildFieldMapping, buildSchemaField } from './decap-yaml-builder';

export function buildServicesFields() {
  return [
    buildSchemaField('../../../.astro/collections/services.schema.json'),
    buildField({
      label: 'Hero',
      name: 'hero',
      widget: 'object',
      hint: 'Opening copy block at the top of the Services page.',
      collapsed: true,
      summary: '{{fields.title}}',
      fields: [
        buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Main Services page heading.' }),
        buildField({ label: 'Intro', name: 'intro', widget: 'text', hint: 'Short framing paragraph under the title.' }),
        buildField({
          label: 'CTA text',
          name: 'cta_text',
          widget: 'string',
          hint: 'Short inquiry button label. Keep it compact.',
        }),
      ],
    }),
    buildField({
      label: 'Sections',
      name: 'sections',
      widget: 'list',
      hint: 'Add, remove, or reorder whole Services page sections.',
      collapsed: true,
      types: [
        {
          label: 'Services list',
          name: 'services',
          summary: 'Services list',
          fields: [
            buildField({
              label: 'Items',
              name: 'items',
              widget: 'list',
              hint: 'Editorial service entries shown on the page and used by the inquiry flow.',
              collapsed: true,
              summary: '{{fields.title}}',
              fields: [
                buildField({
                  label: 'ID',
                  name: 'id',
                  widget: 'string',
                  hint: 'Stable ID used for inquiry preselection. Use lowercase kebab-case, for example "vinyl-printing".',
                }),
                buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Visible service heading.' }),
                buildField({
                  label: 'Image',
                  name: 'image',
                  widget: 'image',
                  hint: 'Representative image for the service section. Choose a crop that works in both stacked and side-by-side layouts.',
                }),
                buildField({
                  label: 'Image alt',
                  name: 'image_alt',
                  widget: 'string',
                  hint: 'Describe the service image for screen readers.',
                }),
                buildField({
                  label: 'Summary',
                  name: 'summary',
                  widget: 'text',
                  hint: 'Short editorial description shown near the service title.',
                }),
                buildField({
                  label: 'Bullets',
                  name: 'bullets',
                  widget: 'list',
                  hint: 'Capability bullets shown under the summary.',
                  collapsed: true,
                  summary: '{{fields.value}}',
                  field: buildFieldMapping({
                    label: 'Bullet',
                    name: 'value',
                    widget: 'string',
                    hint: 'One concise capability per item.',
                  }),
                }),
                buildField({
                  label: 'Contact note',
                  name: 'contact_note',
                  widget: 'text',
                  hint: 'Short line that nudges readers toward the inquiry form.',
                }),
                buildField({
                  label: 'Partner name',
                  name: 'partner_name',
                  widget: 'string',
                  required: false,
                  hint: 'Optional partner name displayed inline.',
                }),
                buildField({
                  label: 'Partner URL',
                  name: 'partner_url',
                  widget: 'string',
                  required: false,
                  hint: 'Optional partner URL. Include https://.',
                }),
              ],
            }),
          ],
        },
        {
          label: 'Process',
          name: 'process',
          summary: '{{fields.title}}',
          fields: [
            buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Process section heading.' }),
            buildField({
              label: 'Intro',
              name: 'intro',
              widget: 'text',
              hint: 'Short sentence introducing the process steps.',
            }),
            buildField({
              label: 'Steps',
              name: 'steps',
              widget: 'list',
              collapsed: true,
              summary: '{{fields.title}}',
              fields: [
                buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Step heading.' }),
                buildField({
                  label: 'Body',
                  name: 'body',
                  widget: 'text',
                  hint: 'Short explanatory sentence for the step.',
                }),
              ],
            }),
          ],
        },
        {
          label: 'Inquiry',
          name: 'inquiry',
          summary: '{{fields.title}}',
          fields: [
            buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Inquiry section heading.' }),
            buildField({ label: 'Intro', name: 'intro', widget: 'text', hint: 'Short intro line above the form.' }),
            buildField({
              label: 'Email',
              name: 'email',
              widget: 'string',
              hint: 'Mailbox that receives inquiries. Example: hello@blackboxrecords.com.',
            }),
            buildField({
              label: 'Submit text',
              name: 'submit_text',
              widget: 'string',
              hint: 'Button label used when composing the email draft.',
            }),
          ],
        },
      ],
    }),
  ];
}
