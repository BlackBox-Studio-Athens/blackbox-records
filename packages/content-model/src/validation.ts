export const emailAddressPatternSource = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
export const httpsUrlPatternSource = '^https://[^\\s]+$';
export const internalOrHttpsUrlPatternSource =
  '^(?:https://[^\\s]+|/(?!/)(?!.*(?:\\.\\.?/|/\\.\\.?(?:/|$)))(?!.*\\\\)[^\\s]*)$';
export const youtubeVideoIdPatternSource = '^[A-Za-z0-9_-]{11}$';
export const bandcampEmbedUrlPatternSource =
  '^https://bandcamp\\.com/EmbeddedPlayer/(?:album|track)=\\d+/(?:[^\\s/]+/)+$';
export const tidalContentUrlPatternSource =
  '^https://tidal\\.com/(?:browse/)?(?:album|track|playlist|video)/[A-Za-z0-9-]+(?:\\?[^\\s]*)?$';
export const publicImagePathPatternSource =
  '^/assets/(?!.*(?:\\.\\.?/|/\\.\\.?(?:/|$)))(?!.*\\\\)[^\\s]+\\.(?:avif|gif|jpe?g|png|svg|webp)$';

const httpsUrlPattern = new RegExp(httpsUrlPatternSource);
const internalOrHttpsUrlPattern = new RegExp(internalOrHttpsUrlPatternSource);
const publicImagePathPattern = new RegExp(publicImagePathPatternSource);

function parsesAsUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isHttpsUrl(value: string): boolean {
  return httpsUrlPattern.test(value) && parsesAsUrl(value);
}

export function isInternalOrHttpsUrl(value: string): boolean {
  return internalOrHttpsUrlPattern.test(value) && (value.startsWith('/') || parsesAsUrl(value));
}

export function isSocialProfileUrl(value: string): boolean {
  return value === '#' || isHttpsUrl(value);
}

export function isPublicImagePath(value: string): boolean {
  return publicImagePathPattern.test(value);
}

export const DISTRO_GROUP_VALUES = [
  'Vinyl 12-inch',
  'Vinyl 10-inch',
  'Vinyl 7-inch',
  'CDs',
  'Clothes',
  'Tapes',
  'Other',
] as const;

export type DistroGroupName = (typeof DISTRO_GROUP_VALUES)[number];

export const DISTRO_INTRO_FIELDS = [
  { name: 'vinyl_12_inch', label: 'Vinyl 12-inch' },
  { name: 'vinyl_10_inch', label: 'Vinyl 10-inch' },
  { name: 'vinyl_7_inch', label: 'Vinyl 7-inch' },
  { name: 'CDs', label: 'CDs' },
  { name: 'Clothes', label: 'Clothes' },
  { name: 'Tapes', label: 'Tapes' },
  { name: 'Other', label: 'Other' },
] as const;

export type DistroIntroKey = (typeof DISTRO_INTRO_FIELDS)[number]['name'];

export const slugPatternSource = '^[a-z0-9]+(?:-[a-z0-9]+)*$';

// Public pages that editorial links may target; add a page here when its route ships.
export const SITE_PAGES = [
  { path: '/', label: 'Home' },
  { path: '/about/', label: 'Who we are' },
  { path: '/artists/', label: 'Artists' },
  { path: '/releases/', label: 'Releases' },
  { path: '/news/', label: 'News' },
  { path: '/services/', label: 'Services' },
  { path: '/store/', label: 'Store' },
  { path: '/store/distro/', label: 'Store: Distro' },
  { path: '/store/merch/', label: 'Store: Merch' },
  { path: '/store/blackbox-releases/', label: 'Store: BlackBox releases' },
  { path: '/terms/', label: 'Delivery information' },
  { path: '/privacy/', label: 'Privacy' },
] as const;

type SitePagePath = (typeof SITE_PAGES)[number]['path'];
export const SITE_PAGE_PATHS = SITE_PAGES.map(({ path }) => path) as [SitePagePath, ...SitePagePath[]];

// Keys the About page can compute a number for.
export const ABOUT_STAT_KEYS = ['artists', 'releases', 'countries', 'year'] as const;
export type AboutStatKey = (typeof ABOUT_STAT_KEYS)[number];

// Platforms the site footer has an icon for.
export const SOCIAL_PLATFORMS = ['Instagram', 'Facebook', 'Bandcamp', 'Linktree', 'Tidal'] as const;
