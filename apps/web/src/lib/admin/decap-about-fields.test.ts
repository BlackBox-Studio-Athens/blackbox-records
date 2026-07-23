import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { buildAboutFields } from './decap-about-fields';

type ParsedField = {
  allow_add?: boolean;
  allow_remove?: boolean;
  allow_reorder?: boolean;
  fields?: ParsedField[];
  hint?: string;
  label_singular?: string;
  name: string;
  required?: boolean;
  summary?: string;
  types?: Array<{ fields: ParsedField[]; name: string }>;
};

function findField(fields: ParsedField[], name: string): ParsedField {
  const field = fields.find((candidate) => candidate.name === name);
  if (!field) throw new Error(`Missing field: ${name}`);
  return field;
}

function findType(sections: ParsedField, name: string) {
  const type = sections.types?.find((candidate) => candidate.name === name);
  if (!type) throw new Error(`Missing section type: ${name}`);
  return type;
}

describe('Decap about fields', () => {
  it('locks the outer layout while keeping rendered child lists editable and ordered', () => {
    const fields = parse(buildAboutFields().join('\n')) as ParsedField[];
    const hero = findField(fields, 'hero');
    const sections = findField(fields, 'sections');

    expect(sections).toMatchObject({
      allow_add: false,
      allow_remove: false,
      allow_reorder: false,
    });
    expect(sections.types?.map(({ name }) => name)).toEqual(['lead', 'story', 'quote', 'contact', 'stats']);

    const repeatableLists = [
      findField(findType(sections, 'story').fields, 'paragraphs'),
      findField(findType(sections, 'contact').fields, 'items'),
      findField(findType(sections, 'stats').fields, 'items'),
    ];
    expect(repeatableLists).toEqual([
      expect.objectContaining({
        allow_add: true,
        allow_remove: true,
        allow_reorder: true,
        label_singular: 'Paragraph',
        summary: '{{fields.value}}',
      }),
      expect.objectContaining({
        allow_add: true,
        allow_remove: true,
        allow_reorder: true,
        label_singular: 'Contact row',
        summary: '{{fields.label}}: {{fields.value}}',
      }),
      expect.objectContaining({
        allow_add: true,
        allow_remove: true,
        allow_reorder: true,
        label_singular: 'Stat',
        summary: '{{fields.key}} — {{fields.label}}',
      }),
    ]);
    expect(findField(hero.fields ?? [], 'image_alt')).toMatchObject({
      required: true,
      hint: expect.stringContaining('Required.'),
    });
  });
});
