import { describe, expect, it } from 'vitest';

import { buildSettingsFields } from './decap-settings-fields';

describe('Decap settings fields', () => {
  it('builds site settings metadata, logo, and location fields', () => {
    const yaml = buildSettingsFields().join('\n');

    expect(yaml).toContain('default: "../../../.astro/collections/settings.schema.json"');
    expect(yaml).toContain('label: "Label name"\n  name: "label_name"\n  widget: string');
    expect(yaml).toContain('label: "Established year"');
    expect(yaml).toContain('value_type: int');
    expect(yaml).toContain('label: "URL"');
    expect(yaml).toContain('label: "Logo path"');
    expect(yaml).toContain('label: "Location"\n  name: "location"\n  widget: object');
    expect(yaml).toContain('summary: "{{fields.locality}}, {{fields.country}}"');
  });
});
