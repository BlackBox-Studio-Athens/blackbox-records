import { describe, expect, it } from 'vitest';

import { buildReleaseCollection } from './decap-release-collection';

describe('Decap release collection', () => {
  it('builds the release folder collection with artist options and media fields', () => {
    const yaml = buildReleaseCollection([{ label: 'Mass Culture', value: 'mass-culture' }]);

    expect(yaml).toContain('name: "releases"');
    expect(yaml).toContain('folder: "apps/web/src/content/releases"');
    expect(yaml).toContain('extension: md');
    expect(yaml).toContain('format: frontmatter');
    expect(yaml).toContain('summary: "{{title}} - {{artist}}"');
    expect(yaml).toContain('name: "artist"');
    expect(yaml).toContain('widget: select');
    expect(yaml).toContain('label: "Mass Culture"');
    expect(yaml).toContain('value: "mass-culture"');
    expect(yaml).toContain('name: "release_date"');
    expect(yaml).toContain(
      'hint: "Official release date used by the public site for display and release ordering/latest behavior. Time is ignored. Example: 2026-09-18."',
    );
    expect(yaml).toContain('date_format: YYYY-MM-DD');
    expect(yaml).toContain('name: "bandcamp_embed_url"');
    expect(yaml).toContain('name: "tidal_url"');
    expect(yaml).toContain('name: "formats"');
    expect(yaml).toContain('field:');
    expect(yaml).toContain('summary: "{{fields.value}}"');
    expect(yaml).toContain('name: "credits"');
    expect(yaml).toContain('summary: "{{fields.role}}"');
    expect(yaml).not.toContain('name: "commerce"');
    expect(yaml).not.toContain('name: "publish_target"');
    expect(yaml).not.toContain('name: "smoke_candidate"');
    expect(yaml).not.toContain('name: "retired"');
    expect(yaml).not.toContain('name: "shop_collection_handle"');
  });
});
