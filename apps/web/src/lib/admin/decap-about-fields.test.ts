import { describe, expect, it } from 'vitest';

import { buildAboutFields } from './decap-about-fields';

describe('Decap about fields', () => {
  it('builds the About page schema, hero object, and editor-removable section blocks', () => {
    const yaml = buildAboutFields().join('\n');

    expect(yaml).toContain('default: "../../../.astro/collections/about.schema.json"');
    expect(yaml).toContain('label: "Hero"\n  name: "hero"\n  widget: object');
    expect(yaml).toContain('hint: "Opening section for the full About page."');
    expect(yaml).toContain('label: "Sections"\n  name: "sections"\n  widget: list');
    expect(yaml).toContain('label: "Lead"');
    expect(yaml).toContain('label: "Story"');
    expect(yaml).toContain('label: "Quote"');
    expect(yaml).toContain('label: "Contact"');
    expect(yaml).toContain('label: "Stats"');
    expect(yaml).toContain('summary: "{{fields.label}}: {{fields.value}}"');
    expect(yaml).toContain('summary: "{{fields.label}}"');
  });
});
