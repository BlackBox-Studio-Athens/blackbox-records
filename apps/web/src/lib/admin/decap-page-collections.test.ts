import { describe, expect, it } from 'vitest';

import { buildPageFileCollections } from './decap-page-collections';

describe('Decap page file collections', () => {
  it('builds the singleton content collections with caller-provided fields', () => {
    const yaml = buildPageFileCollections({
      homeFields: ['home-field'],
      aboutFields: ['about-field'],
      distroPageFields: ['distro-page-field'],
      servicesFields: ['services-field'],
      settingsFields: ['settings-field'],
      newsletterFields: ['newsletter-field'],
    }).join('\n');

    expect(yaml).toContain('name: "home"');
    expect(yaml).toContain('extension: json');
    expect(yaml).toContain('format: json');
    expect(yaml).toContain('file: "apps/web/src/content/home/site.json"');
    expect(yaml).toContain('home-field');
    expect(yaml).toContain('name: "about"');
    expect(yaml).toContain('file: "apps/web/src/content/about/site.json"');
    expect(yaml).toContain('about-field');
    expect(yaml).toContain('name: "distro-page"');
    expect(yaml).toContain('file: "apps/web/src/content/distro-page/site.json"');
    expect(yaml).toContain('distro-page-field');
    expect(yaml).toContain('name: "services"');
    expect(yaml).toContain('file: "apps/web/src/content/services/site.json"');
    expect(yaml).toContain('services-field');
    expect(yaml).toContain('name: "settings"');
    expect(yaml).toContain('file: "apps/web/src/content/settings/site.json"');
    expect(yaml).toContain('settings-field');
    expect(yaml).toContain('name: "newsletter"');
    expect(yaml).toContain('file: "apps/web/src/content/newsletter/site.json"');
    expect(yaml).toContain('newsletter-field');
  });

  it('marks every singleton page collection with explicit JSON extension and format', () => {
    const yaml = buildPageFileCollections({
      homeFields: ['home-field'],
      aboutFields: ['about-field'],
      distroPageFields: ['distro-page-field'],
      servicesFields: ['services-field'],
      settingsFields: ['settings-field'],
      newsletterFields: ['newsletter-field'],
    });

    expect(yaml).toHaveLength(6);
    for (const collectionYaml of yaml) {
      expect(collectionYaml).toContain('extension: json');
      expect(collectionYaml).toContain('format: json');
    }

    expect(yaml.join('\n')).toContain('file: "apps/web/src/content/home/site.json"');
    expect(yaml.join('\n')).toContain('file: "apps/web/src/content/about/site.json"');
    expect(yaml.join('\n')).toContain('file: "apps/web/src/content/distro-page/site.json"');
    expect(yaml.join('\n')).toContain('file: "apps/web/src/content/services/site.json"');
    expect(yaml.join('\n')).toContain('file: "apps/web/src/content/newsletter/site.json"');
    expect(yaml.join('\n')).toContain('file: "apps/web/src/content/settings/site.json"');
  });
});
