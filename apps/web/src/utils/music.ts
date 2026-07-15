type ReleaseLike = {
  bandcamp_embed_url?: string | undefined;
  tidal_url?: string | undefined;
};

export type BandcampPlayerProvider = {
  embedLayout: 'bandcamp-album' | 'bandcamp-track';
  embedUrl: string;
  id: 'bandcamp';
};

export type TidalPlayerProvider = {
  embedLayout: 'tidal';
  embedUrl: string;
  id: 'tidal';
};

export type PlayerProvider = BandcampPlayerProvider | TidalPlayerProvider;
export type PlayerProviderId = PlayerProvider['id'];
export type PlayerEmbedLayout = PlayerProvider['embedLayout'];

export type EmbeddedPlayerData = {
  providers: [PlayerProvider, ...PlayerProvider[]];
  releaseId: string;
  title: string;
};

const BANDCAMP_EMBED_ORIGIN = 'https://bandcamp.com';
const BANDCAMP_EMBED_OPTION_PATTERN =
  /^(?:size=(?:small|large)|bgcol=[\da-fA-F]{6}|linkcol=[\da-fA-F]{6}|artwork=(?:small|big|none)|tracklist=(?:true|false)|transparent=(?:true|false)|linkback=(?:true|false))$/;
const TIDAL_PUBLIC_ORIGIN = 'https://tidal.com';
const TIDAL_EMBED_ORIGIN = 'https://embed.tidal.com';
const TIDAL_ID_PATTERN = /^[A-Za-z0-9-]+$/;
const TIDAL_EMBED_PATH_BY_ENTITY_TYPE = {
  album: 'albums',
  track: 'tracks',
  playlist: 'playlists',
  video: 'videos',
} as const;

export function buildBandcampPlayerProvider(bandcampEmbedUrl?: string): BandcampPlayerProvider | null {
  const parsedUrl = parseUrl(bandcampEmbedUrl);
  if (!parsedUrl || parsedUrl.origin !== BANDCAMP_EMBED_ORIGIN || parsedUrl.search || parsedUrl.hash) return null;

  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
  const entityMatch = /^(album|track)=(\d+)$/.exec(pathSegments[1] || '');
  if (pathSegments[0] !== 'EmbeddedPlayer' || !entityMatch) return null;
  if (pathSegments.slice(2).some((segment) => !BANDCAMP_EMBED_OPTION_PATTERN.test(segment))) return null;

  return {
    embedLayout: entityMatch[1] === 'track' ? 'bandcamp-track' : 'bandcamp-album',
    embedUrl: parsedUrl.toString(),
    id: 'bandcamp',
  };
}

export function buildBandcampEmbedUrl(bandcampEmbedUrl?: string) {
  return buildBandcampPlayerProvider(bandcampEmbedUrl)?.embedUrl || '';
}

export function buildTidalPlayerProvider(tidalUrl?: string): TidalPlayerProvider | null {
  const parsedUrl = parseUrl(tidalUrl);
  if (!parsedUrl || parsedUrl.origin !== TIDAL_PUBLIC_ORIGIN || parsedUrl.hash) return null;

  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
  const entityTypeIndex = pathSegments[0] === 'browse' ? 1 : 0;
  if (pathSegments.length !== entityTypeIndex + 2) return null;

  const entityType = pathSegments[entityTypeIndex] as keyof typeof TIDAL_EMBED_PATH_BY_ENTITY_TYPE;
  const tidalId = pathSegments[entityTypeIndex + 1] || '';
  const tidalEmbedPath = TIDAL_EMBED_PATH_BY_ENTITY_TYPE[entityType];
  if (!tidalEmbedPath || !TIDAL_ID_PATTERN.test(tidalId)) return null;

  return {
    embedLayout: 'tidal',
    embedUrl: `${TIDAL_EMBED_ORIGIN}/${tidalEmbedPath}/${tidalId}?coverInitially=true&disableAnalytics=true`,
    id: 'tidal',
  };
}

export function buildTidalPlayerProviderFromEmbedUrl(tidalEmbedUrl?: string): TidalPlayerProvider | null {
  const parsedUrl = parseUrl(tidalEmbedUrl);
  if (!parsedUrl || parsedUrl.origin !== TIDAL_EMBED_ORIGIN || parsedUrl.hash) return null;

  const [embedPath = '', tidalId = '', ...remainingPath] = parsedUrl.pathname.split('/').filter(Boolean);
  if (remainingPath.length > 0 || !TIDAL_ID_PATTERN.test(tidalId)) return null;
  if (!Object.values(TIDAL_EMBED_PATH_BY_ENTITY_TYPE).includes(embedPath as 'albums')) return null;

  const canonicalUrl = `${TIDAL_EMBED_ORIGIN}/${embedPath}/${tidalId}?coverInitially=true&disableAnalytics=true`;
  if (parsedUrl.toString() !== canonicalUrl) return null;

  return { embedLayout: 'tidal', embedUrl: canonicalUrl, id: 'tidal' };
}

export function buildTidalEmbedUrl(tidalUrl?: string) {
  return buildTidalPlayerProvider(tidalUrl)?.embedUrl || '';
}

export function buildEmbeddedPlayerData(
  releaseId: string,
  release: ReleaseLike,
  title: string,
): EmbeddedPlayerData | null {
  const normalizedReleaseId = releaseId.trim();
  const normalizedTitle = title.trim();
  const providers = [
    buildBandcampPlayerProvider(release.bandcamp_embed_url),
    buildTidalPlayerProvider(release.tidal_url),
  ].filter((provider): provider is PlayerProvider => provider !== null);

  if (!normalizedReleaseId || !normalizedTitle || !providers[0]) return null;

  return {
    providers: providers as [PlayerProvider, ...PlayerProvider[]],
    releaseId: normalizedReleaseId,
    title: normalizedTitle,
  };
}

function parseUrl(value?: string) {
  if (!value) return null;

  try {
    return new URL(value);
  } catch {
    return null;
  }
}
