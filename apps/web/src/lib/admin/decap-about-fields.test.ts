import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { buildAboutFields } from './decap-about-fields';

type ParsedField = {
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

describe('Decap about fields', () => {
  it('models named page objects while keeping nested lists editable and ordered', () => {
    const fields = parse(buildAboutFields().join('\n')) as ParsedField[];
    const hero = findField(fields, 'hero');
    expect(fields.map(({ name }) => name)).toEqual(['$schema', 'hero', 'lead', 'story', 'quote', 'contact', 'stats']);

    const repeatableLists = [
      findField(findField(fields, 'story').fields ?? [], 'paragraphs'),
      findField(findField(fields, 'contact').fields ?? [], 'items'),
      findField(findField(fields, 'stats').fields ?? [], 'items'),
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
