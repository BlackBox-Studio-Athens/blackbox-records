import { describe, expect, it } from 'vitest';

import { buildArtistCollection, createArtistSlugSuggestion } from './decap-artist-collection';

describe('Decap artist collection', () => {
  it('builds the artist folder collection with profile and video fields', () => {
    const yaml = buildArtistCollection();

    expect(yaml).toContain('name: "artists"');
    expect(yaml).toContain('folder: "apps/web/src/content/artists"');
    expect(yaml).toContain('extension: md');
    expect(yaml).toContain('format: frontmatter');
    expect(yaml).toContain('slug: "{{fields.slug}}"');
    expect(yaml).toContain('summary: "{{title}} - {{slug}}"');
    expect(yaml).toContain('pattern: ["^[a-z0-9]+(?:-[a-z0-9]+)*$", "Use lowercase kebab-case');
    expect(yaml).toContain('hint: "Portrait-oriented artist image. Keep the subject centered for the 3:4 crop."');
    expect(yaml).toContain('name: "profile_links"');
    expect(yaml).toContain('summary: "{{fields.label}}"');
    expect(yaml).toContain('hint: "Full public profile URL including https://."');
    expect(yaml).toContain('name: "videos"');
    expect(yaml).toContain('name: "youtube_video_id"');
    expect(yaml).toContain('hint: "The 11-character ID from a YouTube URL, for example dQw4w9WgXcQ."');
    expect(yaml).toContain('name: "shop_collection_handle"');
    expect(yaml).toContain('name: "body"');
  });

  it('routes artist slug suggestions through the shared slug wrapper', () => {
    expect(createArtistSlugSuggestion('Μass Culture / Live')).toBe('mass-culture-live');
  });
});
