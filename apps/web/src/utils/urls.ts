import { getProjectBasePath } from '@/config/site';

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
