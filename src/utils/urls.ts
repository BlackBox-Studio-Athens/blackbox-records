import { siteConfig } from '@/config/site';

function normalizeBasePath(basePath: string) {
  return basePath.replace(/\/$/, '');
}

export function stripBasePath(pathname: string) {
  const basePath = normalizeBasePath(import.meta.env.BASE_URL || siteConfig.basePath);
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
