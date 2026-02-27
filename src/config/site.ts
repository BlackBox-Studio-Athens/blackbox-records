export const siteConfig = {
  title: 'Blackbox Records',
  description: 'Experimental record label with a focus on boundary-pushing music.',
  socialImage: '/assets/images/brand/logo.png',
  socialImageAlt: 'Blackbox Records logo',
  origin: 'https://zantoichi.github.io',
  basePath: '/blackbox-records/',
} as const;

export function createProjectRelativeUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedBase = (import.meta.env.BASE_URL || siteConfig.basePath).replace(/\/$/, '');
  return normalizedPath === '/' ? `${normalizedBase}/` : `${normalizedBase}${normalizedPath}`;
}

export function createAbsoluteSiteUrl(path = '/') {
  return new URL(createProjectRelativeUrl(path), siteConfig.origin).toString();
}
