import {
  buildBandcampPlayerProvider,
  buildTidalPlayerProviderFromEmbedUrl,
  type PlayerProvider,
  type PlayerProviderId,
} from '@/utils/music';

export type { PlayerEmbedLayout, PlayerProvider, PlayerProviderId } from '@/utils/music';

export type PlayerProviderEmbedUrls = {
  bandcampEmbedUrl?: string | undefined;
  tidalEmbedUrl?: string | undefined;
};

const EMBED_PROVIDER_PRIORITY: PlayerProviderId[] = ['bandcamp', 'tidal'];

export function buildPlayerProviders({ bandcampEmbedUrl, tidalEmbedUrl }: PlayerProviderEmbedUrls): PlayerProvider[] {
  return [buildBandcampPlayerProvider(bandcampEmbedUrl), buildTidalPlayerProviderFromEmbedUrl(tidalEmbedUrl)].filter(
    (provider): provider is PlayerProvider => provider !== null,
  );
}

export function readPlayerProvidersFromElement(element: HTMLElement) {
  return buildPlayerProviders({
    bandcampEmbedUrl: element.dataset.musicStreamingServiceEmbeddedPlayerBandcampEmbedUrl,
    tidalEmbedUrl: element.dataset.musicStreamingServiceEmbeddedPlayerTidalEmbedUrl,
  });
}

export function readPlayerReleaseIdFromElement(element: HTMLElement) {
  return element.dataset.musicStreamingServiceEmbeddedPlayerReleaseId || '';
}

export function readPlayerTitleFromElement(element: HTMLElement) {
  return element.dataset.musicStreamingServiceEmbeddedPlayerTitle || '';
}

export function selectDefaultPlayerProvider(providers: PlayerProvider[]) {
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const preferredProviderId = EMBED_PROVIDER_PRIORITY.find((providerId) => providerById.has(providerId));
  return preferredProviderId ? providerById.get(preferredProviderId) || providers[0] : providers[0];
}
