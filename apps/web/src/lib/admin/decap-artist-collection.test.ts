import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { buildArtistCollection, createArtistSlugSuggestion } from './decap-artist-collection';

type ParsedField = {
  allow_add?: boolean;
  allow_remove?: boolean;
  allow_reorder?: boolean;
  collapsed?: boolean;
  fields?: ParsedField[];
  hint?: string;
  label_singular?: string;
  name: string;
  pattern?: [string, string];
  required?: boolean;
  summary?: string;
  widget: string;
};

type ParsedCollection = {
  create: boolean;
  delete: boolean;
  description: string;
  fields: ParsedField[];
  folder: string;
  label_singular: string;
  preview_path: string;
  slug: string;
  sortable_fields: string[];
  summary: string;
};

describe('Decap artist collection', () => {
  it('builds the artist folder collection with profile and video fields', () => {
    const [collection] = parse(buildArtistCollection()) as [ParsedCollection];
    const field = (name: string) => collection.fields.find((candidate) => candidate.name === name);

    expect(collection).toMatchObject({
      create: true,
      delete: false,
      folder: 'apps/web/src/content/artists',
      label_singular: 'Artist',
      preview_path: 'artists/{{fields.slug}}/',
      slug: '{{fields.slug}}',
      sortable_fields: ['title', 'slug', 'genre', 'country', 'commit_date'],
      summary: '{{title}} — {{genre}} — {{slug}}',
    });
    expect(collection.description).toContain('roster');
    expect(collection.description).toContain('maintainer');
    expect(field('slug')?.pattern?.[0]).toBe('^[a-z0-9]+(?:-[a-z0-9]+)*$');
    expect(field('image')?.hint).toContain('3:4 crop');
    expect(field('image_alt')).toMatchObject({ required: true, widget: 'string' });

    const profileLinks = field('profile_links');
    expect(profileLinks).toMatchObject({
      allow_add: true,
      allow_remove: true,
      allow_reorder: true,
      collapsed: true,
      label_singular: 'Profile link',
      summary: '{{fields.label}} — {{fields.url}}',
    });
    expect(profileLinks?.fields?.find(({ name }) => name === 'url')?.pattern?.[0]).toBe('^https://[^\\s]+$');

    const videos = field('videos');
    expect(videos).toMatchObject({
      allow_add: true,
      allow_remove: true,
      allow_reorder: true,
      collapsed: true,
      label_singular: 'Video',
      summary: '{{fields.title}}',
    });
    expect(videos?.fields?.find(({ name }) => name === 'youtube_video_id')?.pattern?.[0]).toBe('^[A-Za-z0-9_-]{11}$');
    expect(field('body')).toMatchObject({ name: 'body', required: false, widget: 'markdown' });
    expect(collection.fields.some(({ name }) => name === 'shop_collection_handle')).toBe(false);
  });

  it('routes artist slug suggestions through the shared slug wrapper', () => {
    expect(createArtistSlugSuggestion('Μass Culture / Live')).toBe('mass-culture-live');
  });
});
