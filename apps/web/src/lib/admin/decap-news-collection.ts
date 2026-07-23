import { buildField, buildFolderCollection } from './decap-yaml-builder';
import { decapCollectionDescriptions } from './decap-editorial-copy';
import { decapCollectionMedia } from './decap-media';

export function buildNewsCollection() {
  return buildFolderCollection({
    name: 'news',
    label: 'News',
    description: decapCollectionDescriptions.news,
    labelSingular: 'News article',
    previewPath: 'news/{{slug}}/',
    sortableFields: ['date', 'title', 'commit_date'],
    folder: 'apps/web/src/content/news',
    create: true,
    delete: true,
    extension: 'md',
    format: 'frontmatter',
    identifierField: 'title',
    slug: '{{slug}}',
    mediaFolder: decapCollectionMedia.news.mediaFolder,
    publicFolder: decapCollectionMedia.news.publicFolder,
    summary: '{{date}} — {{title}}',
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
        hint: 'Lead editorial image used in the News card, article header, and social metadata.',
      }),
      buildField({
        label: 'Image alt',
        name: 'image_alt',
        widget: 'string',
        required: true,
        hint: 'Required. Describe the visible scene or artwork without repeating only the article title.',
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
