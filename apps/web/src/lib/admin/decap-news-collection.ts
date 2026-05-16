import { buildField, buildFolderCollection } from './decap-yaml-builder';

export function buildNewsCollection() {
  return buildFolderCollection({
    name: 'news',
    label: 'News',
    folder: 'src/content/news',
    create: true,
    delete: true,
    extension: 'md',
    format: 'frontmatter',
    identifierField: 'title',
    mediaFolder: '.',
    publicFolder: './',
    summary: '{{title}} - {{date}}',
    fields: [
      buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Article title.' }),
      buildField({
        label: 'Date',
        name: 'date',
        widget: 'datetime',
        hint: 'Publish date for the card and article header. Example: 2026-05-12.',
        extras: ['date_format: YYYY-MM-DD', 'time_format: false'],
      }),
      buildField({ label: 'Summary', name: 'summary', widget: 'text', hint: 'Short teaser used in listing cards.' }),
      buildField({
        label: 'Image',
        name: 'image',
        widget: 'image',
        hint: 'Lead image for the news card and article header.',
      }),
      buildField({
        label: 'Image alt',
        name: 'image_alt',
        widget: 'string',
        required: false,
        hint: 'Describe the news image for screen readers.',
      }),
      buildField({
        label: 'Section label',
        name: 'section_label',
        widget: 'string',
        required: false,
        hint: 'Optional small label shown above the article title.',
      }),
      buildField({ label: 'Body', name: 'body', widget: 'markdown', hint: 'Main article body in Markdown.' }),
    ],
  });
}
