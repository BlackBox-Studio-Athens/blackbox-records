import { resolveLinkAttributes, siteConfig } from '@/config/site';

type ReleaseLike = {
  bandcamp_embed_url?: string | undefined;
  tidal_url?: string | undefined;
};

export function buildTidalEmbedUrl(tidalUrl?: string) {
  if (!tidalUrl) return '';
  const tidalUrlClean = tidalUrl.split('?')[0] || '';
  const tidalUrlParts = tidalUrlClean.split('/').filter(Boolean);
  const tidalId = tidalUrlParts[tidalUrlParts.length - 1] || '';

  let tidalEmbedPath = '';
  if (tidalUrlClean.includes('/album/')) tidalEmbedPath = 'albums';
  else if (tidalUrlClean.includes('/track/')) tidalEmbedPath = 'tracks';
  else if (tidalUrlClean.includes('/playlist/')) tidalEmbedPath = 'playlists';
  else if (tidalUrlClean.includes('/video/')) tidalEmbedPath = 'videos';

  if (!tidalEmbedPath || !tidalId) return '';

  return `https://embed.tidal.com/${tidalEmbedPath}/${tidalId}?coverInitially=true&disableAnalytics=true`;
}

export function buildEmbeddedPlayerData(release: ReleaseLike, title?: string) {
  const tidalEmbedUrl = buildTidalEmbedUrl(release.tidal_url);
  const hasProvider = Boolean(release.bandcamp_embed_url || tidalEmbedUrl);

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
    bandcampEmbedUrl: release.bandcamp_embed_url || '',
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
