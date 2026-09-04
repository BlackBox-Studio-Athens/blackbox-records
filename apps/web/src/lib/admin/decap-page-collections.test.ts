import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import distroPage from '../../content/distro-page/site.json';
import { DISTRO_GROUP_VALUES } from '../distro-data';
import { buildDistroPageFields } from './decap-distro-page-fields';
import { buildPageFileCollections } from './decap-page-collections';

describe('Decap page file collections', () => {
  it('builds one ordered Site Pages collection with caller-provided fields', () => {
    const collections = buildPageFileCollections({
      homeFields: ['home-field'],
      aboutFields: ['about-field'],
      distroPageFields: ['distro-page-field'],
      servicesFields: ['services-field'],
      settingsFields: ['settings-field'],
      newsletterFields: ['newsletter-field'],
    });
    const parsed = parse(collections.sitePages) as Array<{
      files: Array<{ fields: string[]; file: string; name: string }>;
      name: string;
    }>;
    const [sitePages] = parsed;

    expect(sitePages?.name).toBe('site-pages');
    expect(sitePages?.files.map(({ name }) => name)).toEqual([
      'home-site',
      'about-site',
      'services-site',
      'newsletter-site',
      'distro-page-site',
    ]);
    expect(sitePages?.files.map(({ file }) => file)).toEqual([
      'apps/web/src/content/home/site.json',
      'apps/web/src/content/about/site.json',
      'apps/web/src/content/services/site.json',
      'apps/web/src/content/newsletter/site.json',
      'apps/web/src/content/distro-page/site.json',
    ]);
    expect(sitePages?.files.map(({ fields }) => fields[0])).toEqual([
      'home-field',
      'about-field',
      'services-field',
      'newsletter-field',
      'distro-page-field',
    ]);
  });

  it('marks every singleton page collection with explicit JSON extension and format', () => {
    const collections = buildPageFileCollections({
      homeFields: ['home-field'],
      aboutFields: ['about-field'],
      distroPageFields: ['distro-page-field'],
      servicesFields: ['services-field'],
      settingsFields: ['settings-field'],
      newsletterFields: ['newsletter-field'],
    });

    type ParsedCollection = {
      create: boolean;
      delete: boolean;
      extension: string;
      files: Array<{ file: string; name: string }>;
      format: string;
      name: string;
    };
    const parsedCollections = Object.values(collections).map((collectionYaml) => {
      const [collection] = parse(collectionYaml) as ParsedCollection[];
      if (!collection) throw new Error('Missing parsed singleton collection.');
      return collection;
    });
    expect(parsedCollections).toHaveLength(2);
    for (const collection of parsedCollections) {
      expect(collection).toMatchObject({ create: false, delete: false, extension: 'json', format: 'json' });
    }
    expect(parsedCollections.find(({ name }) => name === 'site-pages')?.files).toHaveLength(5);
    expect(parsedCollections.find(({ name }) => name === 'settings')?.files).toHaveLength(1);
  });

  it('uses editor-facing labels and descriptions for routine and advanced singleton collections', () => {
    const collections = buildPageFileCollections({
      homeFields: ['home-field'],
      aboutFields: ['about-field'],
      distroPageFields: ['distro-page-field'],
      servicesFields: ['services-field'],
      settingsFields: ['settings-field'],
      newsletterFields: ['newsletter-field'],
    });

    expect(collections.sitePages).toContain('label: "Site Pages"');
    expect(collections.sitePages).toContain('name: "home-site"');
    expect(collections.sitePages).toContain('description: "Homepage hero, News, and Artists content.');
    expect(collections.sitePages).toContain('name: "distro-page-site"');
    expect(collections.settings).toContain('label: "Advanced — Site Settings"');
    expect(collections.settings).toContain('description: "Advanced: site-wide label identity');
  });

  it('exposes only Store/Distro copy consumed by the public shelves', () => {
    type ParsedField = {
      fields?: ParsedField[];
      hint?: string;
      label?: string;
      name: string;
      summary?: string;
      widget: string;
    };
    const fields = parse(buildDistroPageFields().join('\n')) as ParsedField[];
    const field = (name: string) => fields.find((candidate) => candidate.name === name);

    expect(fields.map(({ name }) => name)).toEqual(['$schema', 'hero', 'group_intros']);
    expect(field('hero')).toMatchObject({
      hint: expect.stringContaining('Store/Distro shelves'),
      summary: '{{fields.title}}',
      widget: 'object',
    });
    expect(field('hero')?.fields?.map(({ name }) => name)).toEqual(['title', 'intro']);
    expect(Object.keys(distroPage.group_intros)).toEqual([
      'vinyl_12_inch',
      'vinyl_10_inch',
      'vinyl_7_inch',
      'CDs',
      'Clothes',
      'Tapes',
      'Other',
    ]);
    expect(field('group_intros')?.fields?.map(({ name }) => name)).toEqual(Object.keys(distroPage.group_intros));
    expect(field('group_intros')?.fields?.map(({ label }) => label)).toEqual([...DISTRO_GROUP_VALUES]);
    expect(fields.some(({ name }) => ['page_title', 'page_description', 'section_label'].includes(name))).toBe(false);
  });
});
