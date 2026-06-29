import { describe, expect, it } from 'vitest';

import { buildDistroCollection } from './decap-distro-collection';

describe('Decap distro collection', () => {
  it('builds the distro JSON folder collection with shelf options', () => {
    const yaml = buildDistroCollection();

    expect(yaml).toContain('name: "distro"');
    expect(yaml).toContain('folder: "apps/web/src/content/distro"');
    expect(yaml).toContain('extension: json');
    expect(yaml).toContain('format: json');
    expect(yaml).toContain('summary: "{{title}} - {{group}}"');
    expect(yaml).toContain('default: "../../../.astro/collections/distro.schema.json"');
    expect(yaml).toContain('name: "group"');
    expect(yaml).toContain('label: "Vinyl 12-inch"');
    expect(yaml).toContain('value: "Vinyl 7-inch"');
    expect(yaml).toContain('name: "release_date"');
    expect(yaml).toContain(
      'hint: "Optional known release date used for public display metadata. Leave empty when unknown; do not infer from description text."',
    );
    expect(yaml).toContain('date_format: YYYY-MM-DD');
    expect(yaml).toContain('name: "order"');
    expect(yaml).toContain('value_type: int');
    expect(yaml).not.toContain('name: "fourthwall_url"');
    expect(yaml).not.toContain('name: "commerce"');
    expect(yaml).not.toContain('name: "publish_target"');
    expect(yaml).not.toContain('name: "smoke_candidate"');
    expect(yaml).not.toContain('name: "retired"');
  });
});
