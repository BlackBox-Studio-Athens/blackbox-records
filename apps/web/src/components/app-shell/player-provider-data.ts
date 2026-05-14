export type PlayerProviderId = 'bandcamp' | 'tidal';
export type PlayerEmbedLayout = 'bandcamp-album' | 'bandcamp-track' | 'tidal';

export type PlayerProvider = {
  embedLayout: PlayerEmbedLayout;
  id: PlayerProviderId;
  embedUrl: string;
};

export type PlayerProviderEmbedUrls = {
  bandcampEmbedUrl?: string | undefined;
  tidalEmbedUrl?: string | undefined;
};

const EMBED_PROVIDER_PRIORITY: PlayerProviderId[] = ['bandcamp', 'tidal'];

export function buildPlayerProviders({ bandcampEmbedUrl, tidalEmbedUrl }: PlayerProviderEmbedUrls): PlayerProvider[] {
  const providers: PlayerProvider[] = [];

  if (bandcampEmbedUrl) {
    providers.push({
      embedLayout: resolvePlayerEmbedLayout('bandcamp', bandcampEmbedUrl),
      id: 'bandcamp',
      embedUrl: bandcampEmbedUrl,
    });
  }

  if (tidalEmbedUrl) {
    providers.push({ embedLayout: 'tidal', id: 'tidal', embedUrl: tidalEmbedUrl });
  }

  return providers;
}

export function resolvePlayerEmbedLayout(providerId: PlayerProviderId, embedUrl: string): PlayerEmbedLayout {
  if (providerId === 'tidal') return 'tidal';
  return embedUrl.includes('/track=') ? 'bandcamp-track' : 'bandcamp-album';
}

export function readPlayerProvidersFromElement(element: HTMLElement) {
  return buildPlayerProviders({
    bandcampEmbedUrl: element.dataset.musicStreamingServiceEmbeddedPlayerBandcampEmbedUrl,
    tidalEmbedUrl: element.dataset.musicStreamingServiceEmbeddedPlayerTidalEmbedUrl,
  });
}

export function readPlayerTitleFromElement(element: HTMLElement) {
  return element.dataset.musicStreamingServiceEmbeddedPlayerTitle || '';
}

export function selectDefaultPlayerProvider(providers: PlayerProvider[]) {
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const preferredProviderId = EMBED_PROVIDER_PRIORITY.find((providerId) => providerById.has(providerId));
  return preferredProviderId ? providerById.get(preferredProviderId) || providers[0] : providers[0];
}
