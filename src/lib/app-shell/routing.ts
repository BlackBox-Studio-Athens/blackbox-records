import { createProjectRelativeUrl } from '@/config/site';
import { stripBasePath } from '@/utils/urls';

export type OverlayKind = 'artists' | 'news' | 'releases';
export type ShellSectionKind = 'about' | 'artists' | 'home' | 'news' | 'releases';

export type OverlayRoute = {
  kind: OverlayKind;
  pathname: string;
  slug: string;
};

export type ShellSectionRoute = {
  kind: ShellSectionKind;
  pathname: string;
};

const overlayRouteMatchers: Array<{ kind: OverlayKind; pattern: RegExp }> = [
  { kind: 'releases', pattern: /^\/releases\/([^/]+)\/?$/ },
  { kind: 'artists', pattern: /^\/artists\/([^/]+)\/?$/ },
  { kind: 'news', pattern: /^\/news\/([^/]+)\/?$/ },
];

const shellSectionRouteMatchers: Array<{ kind: ShellSectionKind; pattern: RegExp }> = [
  { kind: 'home', pattern: /^\/$/ },
  { kind: 'news', pattern: /^\/news\/?$/ },
  { kind: 'artists', pattern: /^\/artists\/?$/ },
  { kind: 'releases', pattern: /^\/releases\/?$/ },
  { kind: 'about', pattern: /^\/about\/?$/ },
];

export function normalizeAppPathname(pathname: string) {
  const strippedPathname = stripBasePath(pathname);
  const pathnameWithoutIndex = strippedPathname.replace(/\/index\.html$/, '/');
  if (pathnameWithoutIndex === '') return '/';
  return pathnameWithoutIndex.startsWith('/') ? pathnameWithoutIndex : `/${pathnameWithoutIndex}`;
}

export function parseOverlayRoute(pathname: string): OverlayRoute | null {
  const normalizedPathname = normalizeAppPathname(pathname);

  for (const matcher of overlayRouteMatchers) {
    const match = normalizedPathname.match(matcher.pattern);
    if (!match) continue;

    return {
      kind: matcher.kind,
      pathname: normalizedPathname.endsWith('/') ? normalizedPathname : `${normalizedPathname}/`,
      slug: decodeURIComponent(match[1] || ''),
    };
  }

  return null;
}

export function isOverlayEligiblePath(pathname: string) {
  return parseOverlayRoute(pathname) !== null;
}

export function parseShellSectionRoute(pathname: string): ShellSectionRoute | null {
  const normalizedPathname = normalizeAppPathname(pathname);

  for (const matcher of shellSectionRouteMatchers) {
    if (!matcher.pattern.test(normalizedPathname)) continue;

    return {
      kind: matcher.kind,
      pathname: normalizedPathname.endsWith('/') ? normalizedPathname : `${normalizedPathname}/`,
    };
  }

  return null;
}

export function isShellSectionPath(pathname: string) {
  return parseShellSectionRoute(pathname) !== null;
}

export function buildOverlayFragmentUrl(pathname: string) {
  const route = parseOverlayRoute(pathname);
  if (!route) return null;
  return createProjectRelativeUrl(`/app-shell-overlay${route.pathname}`);
}
