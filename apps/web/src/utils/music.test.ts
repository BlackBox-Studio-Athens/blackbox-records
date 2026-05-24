import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import { buildBandcampEmbedUrl, buildEmbeddedPlayerData, buildTidalEmbedUrl } from './music';

function readReleaseFrontmatter(slug: string) {
  const releasePath = fileURLToPath(new URL(`../content/releases/${slug}.md`, import.meta.url));
  const releaseFile = readFileSync(releasePath, 'utf8');
  const frontmatterMatch = /^---\r?\n(?<frontmatter>[\s\S]*?)\r?\n---/.exec(releaseFile);
  if (!frontmatterMatch?.groups?.frontmatter) throw new Error(`Release frontmatter not found for ${slug}`);

  return Object.fromEntries(
    frontmatterMatch.groups.frontmatter
      .split(/\r?\n/)
      .map((line) => /^(?<key>[a-z_]+): (?<value>.+)$/.exec(line))
      .filter((match): match is RegExpExecArray & { groups: { key: string; value: string } } => Boolean(match?.groups))
      .map((match) => [match.groups.key, match.groups.value]),
  );
}

describe('Bandcamp embed URL resolution', () => {
  it('accepts official Bandcamp embedded player track URLs', () => {
    const embedUrl =
      'https://bandcamp.com/EmbeddedPlayer/track=2461449138/size=large/bgcol=0d0d0d/linkcol=f5f5f5/artwork=big/tracklist=false/transparent=true/';

    expect(buildBandcampEmbedUrl(embedUrl)).toBe(embedUrl);
  });

  it('accepts official Bandcamp embedded player album URLs', () => {
    const embedUrl =
      'https://bandcamp.com/EmbeddedPlayer/album=1012756998/size=large/bgcol=0d0d0d/linkcol=f5f5f5/artwork=big/transparent=true/';

    expect(buildBandcampEmbedUrl(embedUrl)).toBe(embedUrl);
  });

  it('rejects public Bandcamp album and track page URLs', () => {
    expect(buildBandcampEmbedUrl('https://chronoboros.bandcamp.com/album/caregivers')).toBe('');
    expect(buildBandcampEmbedUrl('https://afterwise.bandcamp.com/track/silverfeedssilence')).toBe('');
  });
});

describe('embedded player data', () => {
  it('preserves existing Tidal embed conversion', () => {
    expect(buildTidalEmbedUrl('https://tidal.com/browse/album/123456789?u')).toBe(
      'https://embed.tidal.com/albums/123456789?coverInitially=true&disableAnalytics=true',
    );
    expect(buildTidalEmbedUrl('https://tidal.com/album/505727858')).toBe(
      'https://embed.tidal.com/albums/505727858?coverInitially=true&disableAnalytics=true',
    );

    expect(
      buildEmbeddedPlayerData({
        tidal_url: 'https://tidal.com/browse/track/987654321',
      }),
    ).toMatchObject({
      hasProvider: true,
      tidalEmbedUrl: 'https://embed.tidal.com/tracks/987654321?coverInitially=true&disableAnalytics=true',
    });
  });

  it('rejects Tidal artist URLs because they are not embedded players', () => {
    expect(buildTidalEmbedUrl('https://tidal.com/artist/75705460/u')).toBe('');
    expect(buildTidalEmbedUrl('https://tidal.com/browse/artist/75705460')).toBe('');
  });

  it('does not expose a provider when only a Tidal artist URL is present', () => {
    expect(
      buildEmbeddedPlayerData({
        tidal_url: 'https://tidal.com/artist/75705460/u',
      }),
    ).toEqual({
      hasProvider: false,
      title: '',
      bandcampEmbedUrl: '',
      tidalEmbedUrl: '',
    });
  });

  it('exposes Bandcamp and Tidal together when both provider URLs are valid', () => {
    expect(
      buildEmbeddedPlayerData(
        {
          bandcamp_embed_url:
            'https://bandcamp.com/EmbeddedPlayer/track=2461449138/size=large/bgcol=0d0d0d/linkcol=f5f5f5/artwork=big/tracklist=false/transparent=true/',
          tidal_url: 'https://tidal.com/album/505727858',
        },
        'Disintegration - Afterwise',
      ),
    ).toEqual({
      hasProvider: true,
      title: 'Disintegration - Afterwise',
      bandcampEmbedUrl:
        'https://bandcamp.com/EmbeddedPlayer/track=2461449138/size=large/bgcol=0d0d0d/linkcol=f5f5f5/artwork=big/tracklist=false/transparent=true/',
      tidalEmbedUrl: 'https://embed.tidal.com/albums/505727858?coverInitially=true&disableAnalytics=true',
    });
  });

  it('keeps current release content aligned with the player embed contract', () => {
    const disintegration = readReleaseFrontmatter('disintegration');
    const caregivers = readReleaseFrontmatter('caregivers');

    expect(buildEmbeddedPlayerData(disintegration)).toMatchObject({
      hasProvider: true,
      bandcampEmbedUrl:
        'https://bandcamp.com/EmbeddedPlayer/track=2461449138/size=large/bgcol=0d0d0d/linkcol=f5f5f5/artwork=big/tracklist=false/transparent=true/',
      tidalEmbedUrl: 'https://embed.tidal.com/albums/505727858?coverInitially=true&disableAnalytics=true',
    });
    expect(disintegration.bandcamp_embed_url).toContain('/tracklist=false/');
    expect(disintegration.bandcamp_embed_url).toContain('/artwork=big/');
    expect(disintegration.tidal_url).toBe('https://tidal.com/album/505727858');
    expect(disintegration.tidal_url).not.toContain('/artist/');

    expect(buildEmbeddedPlayerData(caregivers)).toMatchObject({
      hasProvider: true,
      bandcampEmbedUrl:
        'https://bandcamp.com/EmbeddedPlayer/album=1012756998/size=large/bgcol=0d0d0d/linkcol=f5f5f5/artwork=big/transparent=true/',
      tidalEmbedUrl: '',
    });
    expect(caregivers.bandcamp_embed_url).toContain('/album=1012756998/');
    expect(caregivers.bandcamp_embed_url).toContain('/artwork=big/');
  });

  it('does not expose a provider when only an invalid Bandcamp public URL is present', () => {
    expect(
      buildEmbeddedPlayerData({
        bandcamp_embed_url: 'https://chronoboros.bandcamp.com/album/caregivers',
      }),
    ).toEqual({
      hasProvider: false,
      title: '',
      bandcampEmbedUrl: '',
      tidalEmbedUrl: '',
    });
  });
});
