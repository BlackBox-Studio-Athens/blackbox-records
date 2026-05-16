import { describe, expect, it } from 'vitest';

import { buildPageFileCollections } from './decap-page-collections';

describe('Decap page file collections', () => {
  it('builds the singleton content collections with caller-provided fields', () => {
    const yaml = buildPageFileCollections({
      homeFields: ['home-field'],
      aboutFields: ['about-field'],
      servicesFields: ['services-field'],
      settingsFields: ['settings-field'],
    }).join('\n');

    expect(yaml).toContain('name: "home"');
    expect(yaml).toContain('file: "src/content/home/site.json"');
    expect(yaml).toContain('home-field');
    expect(yaml).toContain('name: "about"');
    expect(yaml).toContain('file: "src/content/about/site.json"');
    expect(yaml).toContain('about-field');
    expect(yaml).toContain('name: "services"');
    expect(yaml).toContain('file: "src/content/services/site.json"');
    expect(yaml).toContain('services-field');
    expect(yaml).toContain('name: "settings"');
    expect(yaml).toContain('file: "src/content/settings/site.json"');
    expect(yaml).toContain('settings-field');
  });
});
