import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { buildHomeFields } from './decap-home-fields';

type ParsedField = {
  allow_add?: boolean;
  allow_remove?: boolean;
  allow_reorder?: boolean;
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
  it('locks the current Hero, News, and Artists layout and removes dormant blocks', () => {
    const fields = parse(buildHomeFields().join('\n')) as ParsedField[];
    const hero = findField(fields, 'hero');
    const sections = findField(fields, 'sections');

    expect(fields[0]).toMatchObject({ name: '$schema', widget: 'hidden' });
    expect(sections).toMatchObject({
      allow_add: false,
      allow_remove: false,
      allow_reorder: false,
    });
    expect(sections.types?.map(({ name }) => name)).toEqual(['news', 'artists']);
    expect(sections.types?.flatMap(({ fields: childFields }) => childFields.map(({ name }) => name))).not.toContain(
      'section_label',
    );
    expect(
      sections.types?.flatMap(({ fields: childFields }) => childFields.filter(({ widget }) => widget === 'list')),
    ).toEqual([]);
    expect(buildHomeFields().join('\n')).not.toMatch(/name: "(?:distro|journey)"/);

    expect(findField(hero.fields ?? [], 'image_alt')).toMatchObject({
      required: true,
      hint: expect.stringContaining('Required.'),
    });
    expect(findField(hero.fields ?? [], 'image').hint).toContain('mobile crops');
  });
});
