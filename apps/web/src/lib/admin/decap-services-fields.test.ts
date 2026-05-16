import { describe, expect, it } from 'vitest';

import { buildServicesFields } from './decap-services-fields';

describe('Decap services fields', () => {
  it('builds the Services schema, hero object, service list, process, and inquiry blocks', () => {
    const yaml = buildServicesFields().join('\n');

    expect(yaml).toContain('default: "../../../.astro/collections/services.schema.json"');
    expect(yaml).toContain('label: "Hero"\n  name: "hero"\n  widget: object');
    expect(yaml).toContain('hint: "Opening copy block at the top of the Services page."');
    expect(yaml).toContain('label: "Sections"\n  name: "sections"\n  widget: list');
    expect(yaml).toContain('label: "Services list"');
    expect(yaml).toContain('name: "services"');
    expect(yaml).toContain('hint: "Stable ID used for inquiry preselection.');
    expect(yaml).toContain('summary: "{{fields.value}}"');
    expect(yaml).toContain('label: "Process"');
    expect(yaml).toContain('name: "steps"');
    expect(yaml).toContain('label: "Inquiry"');
    expect(yaml).toContain('name: "submit_text"');
  });
});
