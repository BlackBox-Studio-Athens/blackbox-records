import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { httpsUrlPatternSource, publicImagePathPatternSource } from '../editorial-validation';
import { buildSettingsFields } from './decap-settings-fields';

describe('Decap settings fields', () => {
  it('matches metadata, identity, image-path, and location constraints', () => {
    type ParsedField = {
      collapsed?: boolean;
      fields?: ParsedField[];
      max?: number;
      min?: number;
      name: string;
      pattern?: [string, string];
      summary?: string;
      value_type?: string;
      widget: string;
    };
    const fields = parse(buildSettingsFields().join('\n')) as ParsedField[];
    const field = (name: string) => fields.find((candidate) => candidate.name === name);

    expect(fields.map(({ name }) => name)).toEqual([
      '$schema',
      'label_name',
      'established_year',
      'url',
      'logo',
      'location',
    ]);
    expect(field('established_year')).toMatchObject({ max: 2100, min: 1900, value_type: 'int', widget: 'number' });
    expect(field('url')?.pattern?.[0]).toBe(httpsUrlPatternSource);
    expect(field('logo')?.pattern?.[0]).toBe(publicImagePathPatternSource);
    expect(field('location')).toMatchObject({
      collapsed: true,
      summary: '{{fields.locality}}, {{fields.country}}',
      widget: 'object',
    });
    expect(field('location')?.fields?.map(({ name }) => name)).toEqual(['locality', 'country']);
  });
});
