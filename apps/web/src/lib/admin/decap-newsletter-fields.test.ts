import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { emailAddressPatternSource } from '../editorial-validation';
import { buildNewsletterFields } from './decap-newsletter-fields';

describe('Decap newsletter fields', () => {
  it('matches the visible signup copy and email-shaped placeholder contract', () => {
    const fields = parse(buildNewsletterFields().join('\n')) as Array<{
      hint?: string;
      name: string;
      pattern?: [string, string];
      widget: string;
    }>;
    const field = (name: string) => fields.find((candidate) => candidate.name === name);

    expect(fields.map(({ name }) => name)).toEqual([
      '$schema',
      'section_label',
      'title',
      'description',
      'placeholder',
      'button_label',
      'note',
    ]);
    expect(field('section_label')?.hint).toContain('Visible eyebrow');
    expect(field('description')).toMatchObject({ widget: 'text' });
    expect(field('placeholder')).toMatchObject({
      hint: expect.stringContaining('your@email.com'),
      pattern: [emailAddressPatternSource, expect.stringContaining('email-shaped placeholder')],
    });
    expect(field('note')).toMatchObject({ widget: 'text' });
  });
});
