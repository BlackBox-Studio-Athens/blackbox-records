import { base as astroBasePath, site as astroSiteUrl } from 'astro:config/client';

export const siteConfig = {
  title: 'Blackbox Records',
  description: 'Helping artists release/share/tour their music. Dreaming about a planet full of art.',
  socialImage: '/assets/images/brand/logo.png',
  socialImageAlt: 'Blackbox Records logo',
} as const;

export const siteBrandAssets = {
  badgeLogo: '/assets/images/brand/logo.png',
  wordmarkLogo: '/assets/images/brand/logo-horizontal.png',
  faviconSvg: '/favicon.svg',
  faviconPng96: '/favicon-96x96.png',
  faviconIco: '/favicon.ico',
  // Opaque #0d0d0d squares rendered from favicon.svg; the manifest lists the 192/512 and maskable icons.
  appleTouchIcon: '/apple-touch-icon.png',
  appIcon192: '/favicon-192x192.png',
  appIcon512: '/favicon-512x512.png',
  appIconMaskable512: '/favicon-maskable-512x512.png',
  webManifest: '/manifest.webmanifest',
} as const;

export const siteThemeColor = '#0d0d0d';

/** Canonical and og:url: the configured site origin plus the path, without the query or the serving host. */
export function createCanonicalUrl(url: URL, site?: URL) {
  return new URL(url.pathname, site ?? url).toString();
}

function normalizePath(path = '/') {
  return path.startsWith('/') ? path : `/${path}`;
}

function normalizeBasePath(basePath = '/') {
  const normalizedBasePath = basePath.trim().replace(/\/$/, '');
  return normalizedBasePath === '/' ? '' : normalizedBasePath;
}

export function getProjectBasePath() {
  return normalizeBasePath(astroBasePath || import.meta.env.BASE_URL || '/');
}

export function createProjectRelativeUrl(path = '/') {
  const normalizedPath = normalizePath(path);
  const projectBasePath = getProjectBasePath();
  return normalizedPath === '/' ? `${projectBasePath || ''}/` : `${projectBasePath}${normalizedPath}`;
}

export function createAbsoluteSiteUrl(path = '/') {
  if (!astroSiteUrl) return createProjectRelativeUrl(path);
  return new URL(createProjectRelativeUrl(path), astroSiteUrl).toString();
}

function isExternalUrl(path = '') {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(path);
}

type LinkAttributes = {
  href: string;
  rel?: string;
  shouldPrefetch: boolean;
  target?: '_blank';
};

export function resolveLinkAttributes(path = '/'): LinkAttributes {
  if (isExternalUrl(path)) {
    return {
      href: path,
      rel: 'noreferrer noopener',
      shouldPrefetch: false,
      target: '_blank',
    };
  }

  return {
    href: createProjectRelativeUrl(path),
    shouldPrefetch: true,
  };
}
