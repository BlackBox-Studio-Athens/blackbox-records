import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { buildReleaseCollection } from './decap-release-collection';

type ParsedField = {
  allow_add?: boolean;
  allow_remove?: boolean;
  allow_reorder?: boolean;
  collapsed?: boolean;
  collection?: string;
  display_fields?: string[];
  fields?: ParsedField[];
  label_singular?: string;
  name: string;
  options_length?: number;
  pattern?: [string, string];
  required?: boolean;
  search_fields?: string[];
  summary?: string;
  value_field?: string;
  widget: string;
};

type ParsedCollection = {
  delete: boolean;
  description: string;
  fields: ParsedField[];
  label_singular: string;
  preview_path: string;
  slug: string;
  sortable_fields: string[];
  summary: string;
};

describe('Decap release collection', () => {
  it('builds the protected release collection with a live Artist relation and editorial-only fields', () => {
    const [collection] = parse(buildReleaseCollection()) as [ParsedCollection];
    const field = (name: string) => collection.fields.find((candidate) => candidate.name === name);

    expect(collection).toMatchObject({
      delete: false,
      label_singular: 'Release',
      preview_path: 'releases/{{slug}}/',
      slug: '{{slug}}',
      sortable_fields: ['release_date', 'title', 'artist', 'commit_date'],
      summary: '{{release_date}} — {{title}} — {{artist}}',
    });
    expect(collection.description).toContain('Price, stock, and checkout');
    expect(collection.description).toContain('maintainer');
    expect(field('artist')).toMatchObject({
      collection: 'artists',
      display_fields: ['title', 'slug'],
      options_length: 50,
      search_fields: ['title', 'slug'],
      value_field: 'slug',
      widget: 'relation',
    });
    expect(field('release_date')).toMatchObject({ widget: 'datetime' });
    expect(field('cover_image_alt')).toMatchObject({ required: true, widget: 'string' });
    expect(field('merch_url')?.pattern?.[0]).toContain('https://');
    expect(field('bandcamp_embed_url')?.pattern?.[0]).toContain('bandcamp');
    expect(field('tidal_url')?.pattern?.[0]).toContain('tidal');

    expect(field('formats')).toMatchObject({
      allow_add: true,
      allow_remove: true,
      allow_reorder: true,
      collapsed: true,
      label_singular: 'Format',
      summary: '{{fields.value}}',
    });
    expect(field('credits')).toMatchObject({
      allow_add: true,
      allow_remove: true,
      allow_reorder: true,
      collapsed: true,
      label_singular: 'Credit',
      summary: '{{fields.role}} — {{fields.name}}',
    });

    for (const unsupported of ['commerce', 'publish_target', 'smoke_candidate', 'retired', 'shop_collection_handle']) {
      expect(collection.fields.some(({ name }) => name === unsupported)).toBe(false);
    }
  });
});
