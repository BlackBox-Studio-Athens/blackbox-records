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
