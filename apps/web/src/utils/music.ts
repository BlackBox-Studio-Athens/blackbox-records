import { resolveLinkAttributes, siteConfig } from '../config/site';

type ReleaseLike = {
  bandcamp_embed_url?: string | undefined;
  tidal_url?: string | undefined;
};

const BANDCAMP_EMBED_HOSTNAME = 'bandcamp.com';
const BANDCAMP_EMBED_PATH_PREFIX = '/EmbeddedPlayer/';
const BANDCAMP_EMBED_ID_PATTERN = /(?:^|\/)(album|track)=\d+(?:\/|$)/;
const TIDAL_PUBLIC_HOSTNAME = 'tidal.com';
const TIDAL_EMBED_PATH_BY_ENTITY_TYPE: Record<string, string> = {
  album: 'albums',
  track: 'tracks',
  playlist: 'playlists',
  video: 'videos',
};

export function buildBandcampEmbedUrl(bandcampEmbedUrl?: string) {
  if (!bandcampEmbedUrl) return '';

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(bandcampEmbedUrl);
  } catch {
    return '';
  }

  if (parsedUrl.protocol !== 'https:') return '';
  if (parsedUrl.hostname !== BANDCAMP_EMBED_HOSTNAME) return '';
  if (!parsedUrl.pathname.startsWith(BANDCAMP_EMBED_PATH_PREFIX)) return '';
  if (!BANDCAMP_EMBED_ID_PATTERN.test(parsedUrl.pathname)) return '';

  return parsedUrl.toString();
}

export function buildTidalEmbedUrl(tidalUrl?: string) {
  if (!tidalUrl) return '';

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(tidalUrl);
  } catch {
    return '';
  }

  if (parsedUrl.protocol !== 'https:') return '';
  if (parsedUrl.hostname !== TIDAL_PUBLIC_HOSTNAME) return '';

  const tidalUrlParts = parsedUrl.pathname.split('/').filter(Boolean);
  const entityTypeIndex = tidalUrlParts[0] === 'browse' ? 1 : 0;
  const entityType = tidalUrlParts[entityTypeIndex] || '';
  const tidalId = tidalUrlParts[entityTypeIndex + 1] || '';
  if (!entityType || !tidalId) return '';

  const tidalEmbedPath = TIDAL_EMBED_PATH_BY_ENTITY_TYPE[entityType] || '';
  if (!tidalEmbedPath || !tidalId) return '';

  return `https://embed.tidal.com/${tidalEmbedPath}/${tidalId}?coverInitially=true&disableAnalytics=true`;
}

export function buildEmbeddedPlayerData(release: ReleaseLike, title?: string) {
  const bandcampEmbedUrl = buildBandcampEmbedUrl(release.bandcamp_embed_url);
  const tidalEmbedUrl = buildTidalEmbedUrl(release.tidal_url);
  const hasProvider = Boolean(bandcampEmbedUrl || tidalEmbedUrl);

  if (!hasProvider) {
    return {
      hasProvider,
      title: '',
      bandcampEmbedUrl: '',
      tidalEmbedUrl: '',
    };
  }

  return {
    hasProvider,
    title: title || '',
    bandcampEmbedUrl,
    tidalEmbedUrl,
  };
}

export function buildShopCollectionHref(shopCollectionHandle?: string) {
  if (!shopCollectionHandle) return '';

  const normalizedHandle = shopCollectionHandle
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/^collections\//i, '');

  if (!normalizedHandle) return '';

  return `${siteConfig.shopUrl.replace(/\/+$/g, '')}/collections/${normalizedHandle}`;
}

export function resolveMerchHref(merchUrl?: string, shopCollectionHandle?: string) {
  const resolvedMerchSource = merchUrl || buildShopCollectionHref(shopCollectionHandle);
  if (!resolvedMerchSource) return '';
  return resolveLinkAttributes(resolvedMerchSource).href;
}
