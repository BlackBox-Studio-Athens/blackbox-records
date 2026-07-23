import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { buildNewsCollection } from './decap-news-collection';

type ParsedField = {
  date_format?: string;
  name: string;
  required?: boolean;
  time_format?: boolean;
  widget: string;
};

type ParsedCollection = {
  delete: boolean;
  description: string;
  fields: ParsedField[];
  label_singular: string;
  preview_path: string;
  slug: string;
  sortable_fields: string[];
  summary: string;
};

describe('Decap news collection', () => {
  it('builds the news frontmatter folder collection', () => {
    const [collection] = parse(buildNewsCollection()) as [ParsedCollection];
    const field = (name: string) => collection.fields.find((candidate) => candidate.name === name);

    expect(collection).toMatchObject({
      delete: true,
      label_singular: 'News article',
      preview_path: 'news/{{slug}}/',
      slug: '{{slug}}',
      sortable_fields: ['date', 'title', 'commit_date'],
      summary: '{{date}} — {{title}}',
    });
    expect(collection.description).toContain('may be deleted after confirming');
    expect(field('date')).toMatchObject({ date_format: 'YYYY-MM-DD', time_format: false, widget: 'datetime' });
    expect(field('image_alt')).toMatchObject({ required: true, widget: 'string' });
    expect(field('summary')?.widget).toBe('text');
    expect(field('section_label')?.widget).toBe('string');
    expect(field('body')?.widget).toBe('markdown');
  });
});
