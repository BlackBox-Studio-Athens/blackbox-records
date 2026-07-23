import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { internalSitePathPatternSource } from '../editorial-validation';
import { buildSiteChromeCollections } from './decap-site-chrome-collections';

describe('Decap site chrome collections', () => {
  it('protects Navigation while preserving confirmed Social Link deletion', () => {
    type ParsedField = {
      default?: boolean;
      min?: number;
      name: string;
      pattern?: [string, string];
      required?: boolean;
      value_type?: string;
    };
    type ParsedCollection = {
      create: boolean;
      delete: boolean;
      description: string;
      fields: ParsedField[];
      label: string;
      label_singular?: string;
      name: string;
      sortable_fields: string[];
      summary: string;
    };
    const collections = buildSiteChromeCollections();
    const [navigation] = parse(collections.navigation) as [ParsedCollection];
    const [socials] = parse(collections.socials) as [ParsedCollection];
    const navigationField = (name: string) => navigation.fields.find((candidate) => candidate.name === name);
    const socialField = (name: string) => socials.fields.find((candidate) => candidate.name === name);

    expect(navigation).toMatchObject({
      create: false,
      delete: false,
      label: 'Advanced — Navigation',
      name: 'navigation',
      sortable_fields: ['order', 'title', 'commit_date'],
      summary: '{{order}} — {{title}} → {{url}}',
    });
    expect(navigation.description).toContain('site-wide navigation');
    expect(navigationField('url')?.pattern?.[0]).toBe(internalSitePathPatternSource);
    expect(navigationField('order')).toMatchObject({ min: 0, value_type: 'int' });
    expect(navigationField('show_in_header')).toMatchObject({ default: true, required: true });
    expect(navigationField('show_in_footer')).toMatchObject({ default: true, required: true });

    expect(socials).toMatchObject({
      create: true,
      delete: true,
      label: 'Advanced — Social Links',
      label_singular: 'Social link',
      name: 'socials',
      sortable_fields: ['order', 'title', 'commit_date'],
    });
    expect(socials.description).toContain('site-wide social identity');
    const socialUrlPattern = new RegExp(socialField('url')?.pattern?.[0] ?? '');
    expect(socialUrlPattern.test('#')).toBe(true);
    expect(socialUrlPattern.test('https://example.com/profile')).toBe(true);
    expect(socialUrlPattern.test('http://example.com/profile')).toBe(false);
    expect(socialField('order')).toMatchObject({ min: 0, value_type: 'int' });
  });
});
