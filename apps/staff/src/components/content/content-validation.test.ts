import { describe, expect, it } from 'vitest';
import { getContentValidation } from './content-validation';

describe('content validation adapter', () => {
  it('returns field paths for required and constrained values', () => {
    const result = getContentValidation('news', {
      title: ' ',
      date: '2026-02-30',
      summary: 'Copy',
      image: { id: 'image-1' },
      image_alt: 'Cover',
      section_label: null,
    });

    expect(result.valid).toBe(false);
    expect(result.byPath.title).toEqual(['Enter a value.']);
    expect(result.byPath.date).toBeDefined();
    expect(result.firstPath).toBe('title');
  });

  it('keeps optional blanks valid and indexes nested row errors', () => {
    const result = getContentValidation('artists', {
      title: 'Artist',
      genre: 'Rock',
      bio: 'Biography',
      image: { provider: 'local', id: 'image-1', width: 1200, height: 1600 },
      image_alt: 'Artist portrait',
      country: null,
      profile_links: [{ label: '', url: 'unsafe' }],
    });

    expect(result.byPath['profile_links.0.label']).toEqual(['Enter a value.']);
    expect(result.byPath['profile_links.0.url']).toBeDefined();
    expect(result.byPath.country).toBeUndefined();
  });
});
