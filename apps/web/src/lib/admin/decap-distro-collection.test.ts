import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { buildDistroCollection } from './decap-distro-collection';
import { DISTRO_GROUP_VALUES } from '../distro-data';

type ParsedField = {
  allow_add?: boolean;
  allow_remove?: boolean;
  allow_reorder?: boolean;
  collapsed?: boolean;
  fields?: ParsedField[];
  min?: number;
  multiple?: boolean;
  name: string;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  summary?: string;
  value_type?: string;
  widget: string;
  choose_url?: boolean;
};

type ParsedCollection = {
  delete: boolean;
  description: string;
  fields: ParsedField[];
  label: string;
  label_singular: string;
  preview_path: string;
  slug: string;
  sortable_fields: string[];
  summary: string;
  view_filters: Array<{ field: string; label: string; pattern: string }>;
  view_groups: Array<{ field: string; label: string }>;
};

describe('Decap distro collection', () => {
  it('builds the distro JSON folder collection with shelf options', () => {
    const [collection] = parse(buildDistroCollection()) as [ParsedCollection];
    const field = (name: string) => collection.fields.find((candidate) => candidate.name === name);

    expect(collection).toMatchObject({
      delete: false,
      label: 'Store Items — Distro & Merch',
      label_singular: 'Store Item',
      preview_path: 'store/{{slug}}/',
      slug: '{{slug}}',
      sortable_fields: ['title', 'group', 'order', 'commit_date'],
      summary: '{{title}} — {{group}} — order {{order}}',
      view_filters: DISTRO_GROUP_VALUES.map((group) => ({ field: 'group', label: group, pattern: group })),
      view_groups: [{ field: 'group', label: 'Group' }],
    });
    expect(collection.description).toContain('Price, stock, checkout availability, orders, and fulfillment');
    expect(collection.description).toContain('protected stock or commerce-operator controls');
    expect(field('group')?.options).toEqual(DISTRO_GROUP_VALUES.map((group) => ({ label: group, value: group })));
    expect(field('image_alt')).toMatchObject({ required: true, widget: 'string' });
    expect(field('gallery')).toMatchObject({
      allow_add: true,
      allow_remove: true,
      allow_reorder: true,
      collapsed: true,
      required: false,
      summary: '{{fields.image_alt}}',
      widget: 'list',
    });
    expect(field('gallery')?.fields).toEqual([
      expect.objectContaining({ choose_url: false, multiple: false, name: 'image', widget: 'image' }),
      expect.objectContaining({ name: 'image_alt', required: true, widget: 'string' }),
    ]);
    expect(field('order')).toMatchObject({ min: 0, value_type: 'int', widget: 'number' });

    for (const unsupported of ['fourthwall_url', 'commerce', 'publish_target', 'smoke_candidate', 'retired']) {
      expect(collection.fields.some(({ name }) => name === unsupported)).toBe(false);
    }
  });
});
