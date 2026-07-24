import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { buildHomeFields } from './decap-home-fields';

type ParsedField = {
  fields?: ParsedField[];
  hint?: string;
  name: string;
  required?: boolean;
  types?: Array<{ fields: ParsedField[]; name: string; summary?: string }>;
  widget: string;
};

function findField(fields: ParsedField[], name: string): ParsedField {
  const field = fields.find((candidate) => candidate.name === name);
  if (!field) throw new Error(`Missing field: ${name}`);
  return field;
}

describe('Decap home fields', () => {
  it('models Hero, News, and Artists as fixed named objects', () => {
    const fields = parse(buildHomeFields().join('\n')) as ParsedField[];
    const hero = findField(fields, 'hero');

    expect(fields.map(({ name }) => name)).toEqual(['$schema', 'hero', 'news', 'artists']);
    expect(findField(fields, 'news').fields?.map(({ name }) => name)).toEqual(['title', 'link_text', 'link_url']);
    expect(findField(fields, 'artists').fields?.map(({ name }) => name)).toEqual([
      'title',
      'button_text',
      'button_link',
    ]);
    expect(buildHomeFields().join('\n')).not.toMatch(/name: "(?:distro|journey)"/);

    expect(findField(hero.fields ?? [], 'image_alt')).toMatchObject({
      required: true,
      hint: expect.stringContaining('Required.'),
    });
    expect(findField(hero.fields ?? [], 'image').hint).toContain('mobile crops');
  });
});
