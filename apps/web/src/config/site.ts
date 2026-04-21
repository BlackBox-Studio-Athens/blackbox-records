import { base as astroBasePath, site as astroSiteUrl } from 'astro:config/client';

export const siteConfig = {
  title: 'Blackbox Records',
  description: 'Helping artists release/share/tour their music. Dreaming about a planet full of art.',
  socialImage: '/assets/images/brand/logo.png',
  socialImageAlt: 'Blackbox Records logo',
  shopUrl: 'https://blackboxrecords-shop.fourthwall.com',
} as const;

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

export function isExternalUrl(path = '') {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(path);
}

export function isShopUrl(path = '') {
  const normalizedPath = path.trim().replace(/\/+$/, '');
  const normalizedShopUrl = siteConfig.shopUrl.replace(/\/+$/, '');
  return normalizedPath === normalizedShopUrl;
}

type LinkAttributes = {
  href: string;
  rel?: string;
  shouldPrefetch: boolean;
  target?: '_blank';
};

export function resolveLinkAttributes(path = '/'): LinkAttributes {
  if (isShopUrl(path)) {
    return {
      href: siteConfig.shopUrl,
      rel: 'noreferrer noopener',
      shouldPrefetch: false,
      target: '_blank',
    };
  }

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
