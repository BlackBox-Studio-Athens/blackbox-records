import { isCurrentPath } from '@/utils/urls';
import { normalizeAppPathname, parseOverlayRoute, parseShellSectionRoute } from '@/lib/app-shell/routing';

export type ShellNavigationSource = 'footer' | 'header' | 'history' | 'mobile-nav' | 'programmatic';

export type ShellSectionHistoryState = {
  __appShellSection: true;
  pathname: string;
};

export const SHELL_SECTION_LABELS = {
  about: 'About',
  artists: 'Artists',
  distro: 'Distro',
  home: 'Home',
  news: 'News',
  releases: 'Releases',
  services: 'Services',
  store: 'Store',
} as const;

export function isModifiedEvent(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

export function resolveInternalUrl(anchorElement: HTMLAnchorElement, currentHref = window.location.href) {
  try {
    return new URL(anchorElement.href, currentHref);
  } catch {
    return null;
  }
}

export function waitForAnimationFrames(count = 1) {
  return new Promise<void>((resolve) => {
    function step(remainingFrames: number) {
      window.requestAnimationFrame(() => {
        if (remainingFrames <= 1) {
          resolve();
          return;
        }

        step(remainingFrames - 1);
      });
    }

    step(count);
  });
}

export function resolveShellNavigationSource(
  anchorElement: HTMLAnchorElement,
  isMobileNavigationLink: boolean,
): ShellNavigationSource {
  if (isMobileNavigationLink) return 'mobile-nav';
  if (anchorElement.closest('footer')) return 'footer';
  if (anchorElement.closest('header')) return 'header';
  return 'programmatic';
}

export function isNavigableOverlayAnchor(anchorElement: HTMLAnchorElement, currentHref = window.location.href) {
  if (anchorElement.target && anchorElement.target !== '_self') return false;
  if (anchorElement.hasAttribute('download')) return false;
  if (anchorElement.hasAttribute('data-astro-reload')) return false;

  const resolvedUrl = resolveInternalUrl(anchorElement, currentHref);
  if (!resolvedUrl || resolvedUrl.origin !== window.location.origin) return false;

  return parseOverlayRoute(resolvedUrl.pathname) !== null;
}

export function isNavigableShellSectionAnchor(anchorElement: HTMLAnchorElement, currentHref = window.location.href) {
  if (anchorElement.target && anchorElement.target !== '_self') return false;
  if (anchorElement.hasAttribute('download')) return false;
  if (anchorElement.hasAttribute('data-astro-reload')) return false;

  const resolvedUrl = resolveInternalUrl(anchorElement, currentHref);
  if (!resolvedUrl || resolvedUrl.origin !== window.location.origin) return false;

  return parseShellSectionRoute(resolvedUrl.pathname) !== null;
}

export function syncDesktopNavigationState(pathname: string, currentHref = window.location.href) {
  document.querySelectorAll<HTMLAnchorElement>('.header-nav-link[href]').forEach((anchorElement) => {
    const anchorPathname = normalizeNavigationPathname(anchorElement, currentHref);
    const isActive = isCurrentPath(pathname, anchorPathname);

    if (isActive) {
      anchorElement.setAttribute('aria-current', 'page');
    } else {
      anchorElement.removeAttribute('aria-current');
    }
  });
}

export function markCurrentHistoryEntryForShellSection(pathname: string, href = window.location.href) {
  const shellSectionRoute = parseShellSectionRoute(pathname);
  if (!shellSectionRoute) return;

  window.history.replaceState(
    {
      ...(window.history.state || {}),
      __appShellSection: true,
      pathname: shellSectionRoute.pathname,
    } satisfies ShellSectionHistoryState,
    '',
    href,
  );
}

function normalizeNavigationPathname(anchorElement: HTMLAnchorElement, currentHref: string) {
  return normalizeAppPathname(
    anchorElement.dataset.navigationPathname || new URL(anchorElement.href, currentHref).pathname,
  );
}
