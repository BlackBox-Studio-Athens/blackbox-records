import { describe, expect, it } from 'vitest';

import { buildSiteChromeCollections } from './decap-site-chrome-collections';

describe('Decap site chrome collections', () => {
  it('builds navigation and socials folder collections', () => {
    const collections = buildSiteChromeCollections();
    const yaml = Object.values(collections).join('\n');

    expect(yaml).toContain('name: "navigation"');
    expect(yaml).toContain('folder: "apps/web/src/content/navigation"');
    expect(yaml).toContain('default: "../../../.astro/collections/navigation.schema.json"');
    expect(yaml).toContain('name: "show_in_header"');
    expect(yaml).toContain('name: "show_in_footer"');
    expect(yaml).toContain('name: "socials"');
    expect(yaml).toContain('folder: "apps/web/src/content/socials"');
    expect(yaml).toContain('default: "../../../.astro/collections/socials.schema.json"');
    expect(yaml).toContain('hint: "Platform or network name."');
    expect(collections.navigation).toContain('label: "Advanced — Navigation"');
    expect(collections.socials).toContain('label: "Advanced — Social Links"');
    expect(collections.navigation).toContain('description: "Advanced: site-wide navigation');
    expect(collections.socials).toContain('description: "Advanced: site-wide social identity');
  });
});
