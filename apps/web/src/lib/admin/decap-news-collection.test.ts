import { describe, expect, it } from 'vitest';

import { buildNewsCollection } from './decap-news-collection';

describe('Decap news collection', () => {
  it('builds the news frontmatter folder collection', () => {
    const yaml = buildNewsCollection();

    expect(yaml).toContain('name: "news"');
    expect(yaml).toContain('folder: "src/content/news"');
    expect(yaml).toContain('extension: md');
    expect(yaml).toContain('format: frontmatter');
    expect(yaml).toContain('summary: "{{title}} - {{date}}"');
    expect(yaml).toContain('name: "date"');
    expect(yaml).toContain('date_format: YYYY-MM-DD');
    expect(yaml).toContain('time_format: false');
    expect(yaml).toContain('name: "summary"');
    expect(yaml).toContain('name: "image_alt"');
    expect(yaml).toContain('name: "section_label"');
    expect(yaml).toContain('name: "body"');
    expect(yaml).toContain('widget: markdown');
  });
});
