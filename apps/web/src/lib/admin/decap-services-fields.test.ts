import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { buildServicesFields } from './decap-services-fields';

type ParsedField = {
  fields?: ParsedField[];
  hint?: string;
  label_singular?: string;
  max?: number;
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

describe('Decap services fields', () => {
  it('models named page objects while preserving nested service and process ordering', () => {
    const fields = parse(buildServicesFields().join('\n')) as ParsedField[];
    expect(fields.map(({ name }) => name)).toEqual(['$schema', 'hero', 'services', 'process', 'inquiry']);

    const serviceItems = findField(findField(fields, 'services').fields ?? [], 'items');
    const bullets = findField(serviceItems.fields ?? [], 'bullets');
    const steps = findField(findField(fields, 'process').fields ?? [], 'steps');
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
      max: 12,
      summary: '{{fields.value}}',
    });
    expect(steps).toMatchObject({
      allow_add: true,
      allow_remove: true,
      allow_reorder: true,
      label_singular: 'Process step',
      min: 3,
      max: 12,
      summary: '{{fields.title}}',
    });
    expect(findField(serviceItems.fields ?? [], 'image_alt')).toMatchObject({
      required: true,
      hint: expect.stringContaining('Required.'),
    });
  });
});
