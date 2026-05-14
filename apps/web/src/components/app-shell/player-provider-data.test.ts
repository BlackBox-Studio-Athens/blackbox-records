import { describe, expect, it } from 'vitest';

import {
  buildPlayerProviders,
  readPlayerProvidersFromElement,
  readPlayerTitleFromElement,
  resolvePlayerEmbedLayout,
  selectDefaultPlayerProvider,
} from './player-provider-data';

const afterwiseBandcampEmbedUrl =
  'https://bandcamp.com/EmbeddedPlayer/track=2461449138/size=large/bgcol=0d0d0d/linkcol=f5f5f5/artwork=big/tracklist=false/transparent=true/';
const afterwiseTidalEmbedUrl = 'https://embed.tidal.com/albums/505727858?coverInitially=true&disableAnalytics=true';

describe('player provider data', () => {
  it('classifies single-track Bandcamp embeds separately from album embeds', () => {
    expect(resolvePlayerEmbedLayout('bandcamp', afterwiseBandcampEmbedUrl)).toBe('bandcamp-track');

    expect(
      resolvePlayerEmbedLayout(
        'bandcamp',
        'https://bandcamp.com/EmbeddedPlayer/album=1012756998/size=large/bgcol=0d0d0d/linkcol=f5f5f5/artwork=big/transparent=true/',
      ),
    ).toBe('bandcamp-album');
  });

  it('classifies Tidal embeds independently of their URL shape', () => {
    expect(resolvePlayerEmbedLayout('tidal', afterwiseTidalEmbedUrl)).toBe('tidal');
    expect(resolvePlayerEmbedLayout('tidal', 'https://embed.tidal.com/tracks/987654321')).toBe('tidal');
  });

  it('builds the provider tab data with Bandcamp first and Tidal as the second option', () => {
    expect(
      buildPlayerProviders({
        bandcampEmbedUrl: afterwiseBandcampEmbedUrl,
        tidalEmbedUrl: afterwiseTidalEmbedUrl,
      }),
    ).toEqual([
      {
        embedLayout: 'bandcamp-track',
        id: 'bandcamp',
        embedUrl: afterwiseBandcampEmbedUrl,
      },
      {
        embedLayout: 'tidal',
        id: 'tidal',
        embedUrl: afterwiseTidalEmbedUrl,
      },
    ]);
  });

  it('does not invent a provider tab when an embed URL is missing', () => {
    expect(buildPlayerProviders({ bandcampEmbedUrl: afterwiseBandcampEmbedUrl })).toEqual([
      {
        embedLayout: 'bandcamp-track',
        id: 'bandcamp',
        embedUrl: afterwiseBandcampEmbedUrl,
      },
    ]);
    expect(buildPlayerProviders({ tidalEmbedUrl: afterwiseTidalEmbedUrl })).toEqual([
      {
        embedLayout: 'tidal',
        id: 'tidal',
        embedUrl: afterwiseTidalEmbedUrl,
      },
    ]);
    expect(buildPlayerProviders({})).toEqual([]);
  });

  it('reads provider data from the rendered listen trigger element dataset', () => {
    const element = {
      dataset: {
        musicStreamingServiceEmbeddedPlayerBandcampEmbedUrl: afterwiseBandcampEmbedUrl,
        musicStreamingServiceEmbeddedPlayerTidalEmbedUrl: afterwiseTidalEmbedUrl,
      },
    } as unknown as HTMLElement;

    expect(readPlayerProvidersFromElement(element)).toEqual([
      {
        embedLayout: 'bandcamp-track',
        id: 'bandcamp',
        embedUrl: afterwiseBandcampEmbedUrl,
      },
      {
        embedLayout: 'tidal',
        id: 'tidal',
        embedUrl: afterwiseTidalEmbedUrl,
      },
    ]);
  });

  it('reads the player title from the rendered listen trigger element dataset', () => {
    expect(
      readPlayerTitleFromElement({
        dataset: { musicStreamingServiceEmbeddedPlayerTitle: 'Disintegration' },
      } as unknown as HTMLElement),
    ).toBe('Disintegration');
    expect(readPlayerTitleFromElement({ dataset: {} } as unknown as HTMLElement)).toBe('');
  });

  it('selects Bandcamp as the default provider when both providers exist', () => {
    const providers = buildPlayerProviders({
      bandcampEmbedUrl: afterwiseBandcampEmbedUrl,
      tidalEmbedUrl: afterwiseTidalEmbedUrl,
    });

    expect(selectDefaultPlayerProvider(providers)).toMatchObject({ id: 'bandcamp' });
  });

  it('falls back to the available provider when the preferred provider is missing', () => {
    const providers = buildPlayerProviders({ tidalEmbedUrl: afterwiseTidalEmbedUrl });

    expect(selectDefaultPlayerProvider(providers)).toMatchObject({ id: 'tidal' });
  });
});
