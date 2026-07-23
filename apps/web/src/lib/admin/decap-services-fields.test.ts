import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { buildServicesFields } from './decap-services-fields';

type ParsedField = {
  allow_add?: boolean;
  allow_remove?: boolean;
  allow_reorder?: boolean;
  fields?: ParsedField[];
  hint?: string;
  label_singular?: string;
  min?: number;
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

describe('Decap services fields', () => {
  it('locks the page layout while preserving service, capability, and process ordering', () => {
    const fields = parse(buildServicesFields().join('\n')) as ParsedField[];
    const sections = findField(fields, 'sections');

    expect(sections).toMatchObject({
      allow_add: false,
      allow_remove: false,
      allow_reorder: false,
    });
    expect(sections.types?.map(({ name }) => name)).toEqual(['services', 'process', 'inquiry']);

    const serviceItems = findField(findType(sections, 'services').fields, 'items');
    const bullets = findField(serviceItems.fields ?? [], 'bullets');
    const steps = findField(findType(sections, 'process').fields, 'steps');
    expect(serviceItems).toMatchObject({
      allow_add: true,
      allow_remove: true,
      allow_reorder: true,
      label_singular: 'Service',
      summary: '{{fields.title}}',
    });
    expect(bullets).toMatchObject({
      allow_add: true,
      allow_remove: true,
      allow_reorder: true,
      label_singular: 'Capability',
      min: 2,
      summary: '{{fields.value}}',
    });
    expect(steps).toMatchObject({
      allow_add: true,
      allow_remove: true,
      allow_reorder: true,
      label_singular: 'Process step',
      min: 3,
      summary: '{{fields.title}}',
    });
    expect(findField(serviceItems.fields ?? [], 'image_alt')).toMatchObject({
      required: true,
      hint: expect.stringContaining('Required.'),
    });
  });
});
