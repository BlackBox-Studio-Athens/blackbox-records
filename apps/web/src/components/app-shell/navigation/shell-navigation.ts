import { isCurrentPath } from '@/platform/utils/urls';
import { parseOverlayRoute, parseShellSectionRoute } from '@/components/app-shell/routing';

export type ShellNavigationSource = 'footer' | 'header' | 'history' | 'mobile-nav' | 'programmatic';

export type ShellSectionHistoryState = {
  __appShellSection: true;
  pathname: string;
};

export const SHELL_SECTION_LABELS = {
  about: 'Who we are',
  artists: 'Artists',
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

// The header and footer render once outside the swapped <main>; keep their current page in step.
export function syncNavigationCurrentState(pathname: string) {
  document.querySelectorAll<HTMLAnchorElement>('a[data-nav-link]').forEach((anchorElement) => {
    if (isCurrentPath(pathname, anchorElement.dataset.navLink ?? '')) {
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
