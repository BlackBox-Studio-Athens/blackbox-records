import { describe, expect, it } from 'vitest';

import { buildNewsletterFields } from './decap-newsletter-fields';

describe('Decap newsletter fields', () => {
  it('builds the shared newsletter copy fields', () => {
    const yaml = buildNewsletterFields().join('\n');

    expect(yaml).toContain('default: "../../../.astro/collections/newsletter.schema.json"');
    expect(yaml).toContain('name: "section_label"');
    expect(yaml).toContain('name: "title"');
    expect(yaml).toContain('name: "description"\n  widget: text');
    expect(yaml).toContain('name: "placeholder"');
    expect(yaml).toContain('name: "button_label"');
    expect(yaml).toContain('name: "note"\n  widget: text');
  });
});
