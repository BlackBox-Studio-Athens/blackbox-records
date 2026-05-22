import { buildField, buildFieldMapping, buildFolderCollection } from './decap-yaml-builder';
import { createSlugSuggestion, slugPatternSource } from '../slugs';

export function createArtistSlugSuggestion(artistName: string): string {
  return createSlugSuggestion(artistName);
}

export function buildArtistCollection() {
  return buildFolderCollection({
    name: 'artists',
    label: 'Artists',
    folder: 'src/content/artists',
    create: true,
    delete: true,
    extension: 'md',
    format: 'frontmatter',
    identifierField: 'title',
    slug: '{{fields.slug}}',
    mediaFolder: '.',
    publicFolder: './',
    summary: '{{title}} - {{slug}}',
    fields: [
      buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Artist or band name.' }),
      buildField({
        label: 'Slug',
        name: 'slug',
        widget: 'string',
        hint: `Used for the artist page filename. Use lowercase kebab-case, for example "${createArtistSlugSuggestion('Mass Culture')}".`,
        extras: [`pattern: ["${slugPatternSource}", "Use lowercase kebab-case, for example mass-culture."]`],
      }),
      buildField({
        label: 'Genre',
        name: 'genre',
        widget: 'string',
        hint: 'Short genre line shown in cards and detail views.',
      }),
      buildField({
        label: 'Country',
        name: 'country',
        widget: 'string',
        required: false,
        hint: 'Optional country or origin.',
      }),
      buildField({
        label: 'Image',
        name: 'image',
        widget: 'image',
        hint: 'Portrait-oriented artist image. Keep the subject centered for the 3:4 crop.',
      }),
      buildField({
        label: 'Image alt',
        name: 'image_alt',
        widget: 'string',
        required: false,
        hint: 'Describe the band or artist image for screen readers.',
      }),
      buildField({
        label: 'Bio',
        name: 'bio',
        widget: 'text',
        hint: 'Short artist bio used in cards, metadata, and fallback detail copy.',
      }),
      buildField({
        label: 'Profile links',
        name: 'profile_links',
        widget: 'list',
        required: false,
        collapsed: true,
        summary: '{{fields.label}}',
        hint: 'Optional quiet profile links shown near the artist story.',
        fields: [
          buildFieldMapping({ label: 'Label', name: 'label', widget: 'string', hint: 'Example: "Bandcamp".' }),
          buildFieldMapping({
            label: 'URL',
            name: 'url',
            widget: 'string',
            hint: 'Full public profile URL including https://.',
          }),
        ],
      }),
      buildField({
        label: 'Videos',
        name: 'videos',
        widget: 'list',
        required: false,
        collapsed: true,
        summary: '{{fields.title}}',
        hint: 'Optional YouTube videos for the artist page. Use the 11-character YouTube video ID, not iframe HTML.',
        fields: [
          buildFieldMapping({
            label: 'Title',
            name: 'title',
            widget: 'string',
            hint: 'Video title shown in the UI.',
          }),
          buildFieldMapping({
            label: 'YouTube video ID',
            name: 'youtube_video_id',
            widget: 'string',
            hint: 'The 11-character ID from a YouTube URL, for example dQw4w9WgXcQ.',
          }),
          buildFieldMapping({
            label: 'Description',
            name: 'description',
            widget: 'text',
            required: false,
            hint: 'Optional short context for the video.',
          }),
        ],
      }),
      buildField({
        label: 'Upcoming release',
        name: 'upcoming_release',
        widget: 'string',
        required: false,
        hint: 'Optional note shown when an artist has a release on the way.',
      }),
      buildField({
        label: 'Shop collection handle',
        name: 'shop_collection_handle',
        widget: 'string',
        required: false,
        hint: 'Optional Fourthwall collection handle, without a full URL.',
      }),
      buildField({
        label: 'Section label',
        name: 'section_label',
        widget: 'string',
        required: false,
        hint: 'Optional small label used in selected UI contexts.',
      }),
      buildField({
        label: 'Body',
        name: 'body',
        widget: 'markdown',
        required: false,
        hint: 'Rich artist profile body in Markdown. Keep frontmatter Bio short.',
      }),
    ],
  });
}
