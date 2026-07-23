import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { DISTRO_GROUP_VALUES } from '../distro-data';
import { buildDistroPageFields } from './decap-distro-page-fields';
import { buildPageFileCollections } from './decap-page-collections';

describe('Decap page file collections', () => {
  it('builds the singleton content collections with caller-provided fields', () => {
    const collections = buildPageFileCollections({
      homeFields: ['home-field'],
      aboutFields: ['about-field'],
      distroPageFields: ['distro-page-field'],
      servicesFields: ['services-field'],
      settingsFields: ['settings-field'],
      newsletterFields: ['newsletter-field'],
    });
    const yaml = Object.values(collections).join('\n');

    expect(yaml).toContain('name: "home"');
    expect(yaml).toContain('extension: json');
    expect(yaml).toContain('format: json');
    expect(yaml).toContain('file: "apps/web/src/content/home/site.json"');
    expect(yaml).toContain('home-field');
    expect(yaml).toContain('name: "about"');
    expect(yaml).toContain('file: "apps/web/src/content/about/site.json"');
    expect(yaml).toContain('about-field');
    expect(yaml).toContain('name: "distro-page"');
    expect(yaml).toContain('file: "apps/web/src/content/distro-page/site.json"');
    expect(yaml).toContain('distro-page-field');
    expect(yaml).toContain('name: "services"');
    expect(yaml).toContain('file: "apps/web/src/content/services/site.json"');
    expect(yaml).toContain('services-field');
    expect(yaml).toContain('name: "settings"');
    expect(yaml).toContain('file: "apps/web/src/content/settings/site.json"');
    expect(yaml).toContain('settings-field');
    expect(yaml).toContain('name: "newsletter"');
    expect(yaml).toContain('file: "apps/web/src/content/newsletter/site.json"');
    expect(yaml).toContain('newsletter-field');
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
    expect(parsedCollections).toHaveLength(6);
    for (const collection of parsedCollections) {
      expect(collection).toMatchObject({ create: false, delete: false, extension: 'json', format: 'json' });
      expect(collection.files).toHaveLength(1);
    }

    expect(parsedCollections.map(({ files }) => files[0]?.file)).toEqual([
      'apps/web/src/content/home/site.json',
      'apps/web/src/content/about/site.json',
      'apps/web/src/content/distro-page/site.json',
      'apps/web/src/content/services/site.json',
      'apps/web/src/content/newsletter/site.json',
      'apps/web/src/content/settings/site.json',
    ]);
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

    expect(collections.home).toContain('description: "Homepage hero, News, and Artists content.');
    expect(collections.distroPage).toContain('label: "Store — Distro Page Copy"');
    expect(collections.settings).toContain('label: "Advanced — Site Settings"');
    expect(collections.settings).toContain('description: "Advanced: site-wide label identity');
  });

  it('exposes only Store/Distro copy consumed by the public shelves', () => {
    type ParsedField = { fields?: ParsedField[]; hint?: string; name: string; summary?: string; widget: string };
    const fields = parse(buildDistroPageFields().join('\n')) as ParsedField[];
    const field = (name: string) => fields.find((candidate) => candidate.name === name);

    expect(fields.map(({ name }) => name)).toEqual(['$schema', 'hero', 'group_intros']);
    expect(field('hero')).toMatchObject({
      hint: expect.stringContaining('Store/Distro shelves'),
      summary: '{{fields.title}}',
      widget: 'object',
    });
    expect(field('hero')?.fields?.map(({ name }) => name)).toEqual(['title', 'intro']);
    expect(field('group_intros')?.fields?.map(({ name }) => name)).toEqual([...DISTRO_GROUP_VALUES]);
    expect(fields.some(({ name }) => ['page_title', 'page_description', 'section_label'].includes(name))).toBe(false);
  });
});
