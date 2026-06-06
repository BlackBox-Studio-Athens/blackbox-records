import { describe, expect, it } from 'vitest';

import { buildHomeFields } from './decap-home-fields';

describe('Decap home fields', () => {
  it('builds the homepage schema, hero object, and editor-removable section blocks', () => {
    const yaml = buildHomeFields().join('\n');

    expect(yaml).toContain('default: "../../../.astro/collections/home.schema.json"');
    expect(yaml).toContain('label: "Hero"\n  name: "hero"\n  widget: object');
    expect(yaml).toContain('hint: "Short line over the hero still. Example: \\"Heavy music on record.\\""');
    expect(yaml).toContain('label: "Sections"\n  name: "sections"\n  widget: list');
    expect(yaml).toContain('label: "News"');
    expect(yaml).toContain('name: "news"');
    expect(yaml).toContain('label: "Artists"');
    expect(yaml).toContain('label: "Distro"');
    expect(yaml).toContain('label: "Journey"');
    expect(yaml).toContain('summary: "{{fields.value}}"');
  });
});
