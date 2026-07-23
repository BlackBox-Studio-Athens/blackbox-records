import { buildField, buildFieldMapping, buildFolderCollection } from './decap-yaml-builder';
import { httpsUrlPatternSource, youtubeVideoIdPatternSource } from '../editorial-validation';
import { createSlugSuggestion, slugPatternSource } from '../slugs';
import { decapCollectionDescriptions } from './decap-editorial-copy';
import { decapCollectionMedia } from './decap-media';

export function createArtistSlugSuggestion(artistName: string): string {
  return createSlugSuggestion(artistName);
}

export function buildArtistCollection() {
  return buildFolderCollection({
    name: 'artists',
    label: 'Artists',
    description: decapCollectionDescriptions.artists,
    labelSingular: 'Artist',
    previewPath: 'artists/{{fields.slug}}/',
    sortableFields: ['title', 'slug', 'genre', 'country', 'commit_date'],
    folder: 'apps/web/src/content/artists',
    create: true,
    delete: false,
    extension: 'md',
    format: 'frontmatter',
    identifierField: 'title',
    slug: '{{fields.slug}}',
    mediaFolder: decapCollectionMedia.artists.mediaFolder,
    publicFolder: decapCollectionMedia.artists.publicFolder,
    summary: '{{title}} — {{genre}} — {{slug}}',
    fields: [
      buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Artist or band name.' }),
      buildField({
        label: 'Slug',
        name: 'slug',
        widget: 'string',
        hint: `Used for the artist page filename. Use lowercase kebab-case, for example "${createArtistSlugSuggestion('Mass Culture')}".`,
        pattern: {
          value: slugPatternSource,
          message: 'Use lowercase kebab-case, for example mass-culture.',
        },
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
        required: true,
        hint: 'Required. Describe the visible people, artwork, or scene without repeating only the artist name.',
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
        labelSingular: 'Profile link',
        collapsed: true,
        summary: '{{fields.label}} — {{fields.url}}',
        allowAdd: true,
        allowRemove: true,
        allowReorder: true,
        hint: 'Optional quiet profile links shown near the artist story.',
        fields: [
          buildFieldMapping({ label: 'Label', name: 'label', widget: 'string', hint: 'Example: "Bandcamp".' }),
          buildFieldMapping({
            label: 'URL',
            name: 'url',
            widget: 'string',
            hint: 'Full public profile URL. Example: https://artist.bandcamp.com/.',
            pattern: { value: httpsUrlPatternSource, message: 'Use a full HTTPS profile URL.' },
          }),
        ],
      }),
      buildField({
        label: 'Videos',
        name: 'videos',
        widget: 'list',
        required: false,
        labelSingular: 'Video',
        collapsed: true,
        summary: '{{fields.title}}',
        allowAdd: true,
        allowRemove: true,
        allowReorder: true,
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
            pattern: { value: youtubeVideoIdPatternSource, message: 'Use the 11-character YouTube video ID.' },
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
        label: 'Body',
        name: 'body',
        widget: 'markdown',
        required: false,
        hint: 'Rich artist profile body in Markdown. Keep frontmatter Bio short.',
      }),
    ],
  });
}
