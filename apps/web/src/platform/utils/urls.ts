import type { SitePagePath } from '@blackbox/content-model';
import { createProjectRelativeUrl, getProjectBasePath } from '@/platform/config/site';

export function stripBasePath(pathname: string) {
  const basePath = getProjectBasePath();
  if (!basePath || basePath === '/') return pathname;
  return pathname.startsWith(basePath) ? pathname.slice(basePath.length) || '/' : pathname;
}

export function isCurrentPath(pathname: string, itemUrl: string) {
  const currentPath = stripBasePath(pathname);
  if (itemUrl === '/') {
    return currentPath === '/' || currentPath === '/index.html';
  }
  return currentPath.includes(itemUrl);
}

// One link model for the header, the phone Menu and the footer: a page link keeps the same
// address, accent and current-page state on every surface. Astro and React spread it alike.
export function navigationLinkAttributes(url: SitePagePath, currentPathname: string) {
  return {
    href: createProjectRelativeUrl(url),
    'aria-current': isCurrentPath(currentPathname, url) ? ('page' as const) : undefined,
    // Empty selects Astro's default prefetch strategy; "true" would match no strategy.
    'data-astro-prefetch': '',
    'data-nav-accent': url.startsWith('/store/') ? 'store' : url === '/services/' ? 'services' : undefined,
    'data-nav-link': url,
  };
}
