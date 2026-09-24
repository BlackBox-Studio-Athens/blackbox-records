import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';

import { createDistroContentSchema } from '@blackbox/content-model';

const schema = createDistroContentSchema(() => z.string().min(1));
const baseEntry = {
  artist_or_label: 'Fixture Artist',
  group: 'CDs' as const,
  image: './fixture-cd-front.jpg',
  image_alt: 'Fixture CD front cover and case',
  order: 1,
  summary: 'Fixture summary.',
  title: 'Fixture Album',
};
const bandcampEmbedUrl =
  'https://bandcamp.com/EmbeddedPlayer/album=4153954963/size=large/bgcol=0d0d0d/linkcol=f5f5f5/artwork=big/transparent=true/';
const tidalUrl = 'https://tidal.com/album/379264570';

describe('Distro content gallery schema', () => {
  it('accepts omitted, one-image, and source-ordered multi-image galleries', () => {
    expect(schema.parse(baseEntry).gallery).toBeUndefined();
    expect(
      schema.parse({
        ...baseEntry,
        gallery: [{ image: './fixture-cd-back.jpg', image_alt: 'Fixture CD back cover and track list' }],
      }).gallery,
    ).toEqual([{ image: './fixture-cd-back.jpg', image_alt: 'Fixture CD back cover and track list' }]);

    const gallery = [
      { image: './fixture-cd-back.jpg', image_alt: 'Fixture CD back cover and track list' },
      { image: './fixture-cd-open.jpg', image_alt: 'Fixture CD open with disc and booklet' },
    ];
    expect(schema.parse({ ...baseEntry, gallery }).gallery).toEqual(gallery);
  });

  it('rejects missing or blank gallery alt text', () => {
    expect(schema.safeParse({ ...baseEntry, gallery: [{ image: './fixture-cd-back.jpg' }] }).success).toBe(false);
    expect(
      schema.safeParse({
        ...baseEntry,
        gallery: [{ image: './fixture-cd-back.jpg', image_alt: '   ' }],
      }).success,
    ).toBe(false);
  });
});

describe('Distro listening source schema', () => {
  it('accepts zero, one, and two optional listening sources', () => {
    expect(schema.parse(baseEntry)).not.toHaveProperty('bandcamp_embed_url');
    expect(schema.parse({ ...baseEntry, bandcamp_embed_url: bandcampEmbedUrl })).toMatchObject({
      bandcamp_embed_url: bandcampEmbedUrl,
    });
    expect(schema.parse({ ...baseEntry, tidal_url: tidalUrl })).toMatchObject({ tidal_url: tidalUrl });
    expect(schema.parse({ ...baseEntry, bandcamp_embed_url: bandcampEmbedUrl, tidal_url: tidalUrl })).toMatchObject({
      bandcamp_embed_url: bandcampEmbedUrl,
      tidal_url: tidalUrl,
    });
  });

  it('reports the existing field errors for invalid provider URLs', () => {
    const result = schema.safeParse({
      ...baseEntry,
      bandcamp_embed_url: 'https://fixture.bandcamp.com/album/fixture-album',
      tidal_url: 'https://tidal.com/artist/123',
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['bandcamp_embed_url'],
          message:
            'Use the official Bandcamp iframe src from Share/Embed. Public album or track URLs are not valid embeds.',
        }),
        expect.objectContaining({
          path: ['tidal_url'],
          message: 'Use a Tidal album, track, playlist, or video URL. Artist profile URLs are not embedded players.',
        }),
      ]),
    );
  });
});
