import { normalizeAppPathname, parseShellSectionRoute } from '@/components/app-shell/routing';
import { previewUrl } from '@/platform/lib/private-preview';

import { type EagerImageSource, preloadEagerImages, preloadImageSources } from './shell-first-screen-images';
import { readDocumentShellPageSnapshot, type ShellPageSnapshot } from './shell-page-snapshot';
import type { ShellPrefetchOptions } from './shell-prefetch-intent';

type ShellPageSnapshotResponse = Pick<Response, 'ok' | 'text' | 'url'>;

type ShellPageSnapshotLoaderOptions = {
  cache?: Map<string, ShellPageSnapshot>;
  currentHref?: () => string;
  fetchPage?: (href: string, init: RequestInit) => Promise<ShellPageSnapshotResponse>;
  inFlightRequests?: Map<string, Promise<ShellPageSnapshot>>;
  parseHtml?: (html: string) => Document;
  preloadImages?: (html: string, limit?: number) => EagerImageSource[] | void;
  preloadImageSources?: (sources: readonly EagerImageSource[]) => void;
  readSnapshot?: typeof readDocumentShellPageSnapshot;
};

export function createShellPageSnapshotLoader({
  cache = new Map<string, ShellPageSnapshot>(),
  currentHref = () => window.location.href,
  fetchPage = (href, init) => fetch(previewUrl(href), init),
  inFlightRequests = new Map<string, Promise<ShellPageSnapshot>>(),
  parseHtml = (html) => new DOMParser().parseFromString(html, 'text/html'),
  preloadImages = preloadEagerImages,
  preloadImageSources: preloadDeferredImageSources = preloadImageSources,
  readSnapshot = readDocumentShellPageSnapshot,
}: ShellPageSnapshotLoaderOptions = {}) {
  // Eager images a speculative prefetch left cold, requested once the page is actually opened.
  const deferredImageSources = new Map<string, EagerImageSource[]>();

  function cacheSnapshot(pageSnapshot: ShellPageSnapshot) {
    cache.set(pageSnapshot.pathname, pageSnapshot);
  }

  function getCachedSnapshot(pathname: string) {
    return cache.get(normalizeAppPathname(pathname)) ?? null;
  }

  function hasCachedSnapshot(pathname: string) {
    return cache.has(normalizeAppPathname(pathname));
  }

  function warmSnapshotImages(pathname: string) {
    const normalizedPathname = normalizeAppPathname(pathname);
    const sources = deferredImageSources.get(normalizedPathname);
    if (!sources) return;

    deferredImageSources.delete(normalizedPathname);
    preloadDeferredImageSources(sources);
  }

  async function fetchSnapshot(
    pathname: string,
    href: string,
    signal?: AbortSignal,
    { speculative = false }: ShellPrefetchOptions = {},
  ) {
    const normalizedPathname = normalizeAppPathname(pathname);
    const cachedSnapshot = cache.get(normalizedPathname);
    if (cachedSnapshot) return cachedSnapshot;

    const existingRequest = inFlightRequests.get(normalizedPathname);
    if (existingRequest) return existingRequest;

    const request = fetchPage(href, {
      credentials: 'same-origin',
      headers: {
        accept: 'text/html',
      },
      signal: signal ?? null,
      ...(speculative ? { priority: 'low' as const } : {}),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Shell page request failed for ${normalizedPathname}`);
        }

        const html = await response.text();
        const pageSnapshot = readSnapshot(parseHtml(html), response.url || href);

        if (!pageSnapshot) {
          throw new Error(`Shell page snapshot is not available for ${normalizedPathname}`);
        }

        cache.set(normalizedPathname, pageSnapshot);
        // Queue eager image requests now: an inserted <img> only requests after the insertion task's layout,
        // which can take seconds on a phone for brand-font text.
        // A speculative prefetch warms only the first image; the rest wait until the page is opened.
        const remainingSources = speculative
          ? preloadImages(pageSnapshot.mainHtml, 1)
          : preloadImages(pageSnapshot.mainHtml);
        if (remainingSources && remainingSources.length > 0) {
          deferredImageSources.set(normalizedPathname, remainingSources);
        }
        return pageSnapshot;
      })
      .finally(() => {
        inFlightRequests.delete(normalizedPathname);
      });

    inFlightRequests.set(normalizedPathname, request);
    return request;
  }

  async function prefetchHref(href: string, options?: ShellPrefetchOptions) {
    const resolvedUrl = new URL(href, currentHref());
    const route = parseShellSectionRoute(resolvedUrl.pathname);
    if (!route || cache.has(route.pathname)) return;

    try {
      await fetchSnapshot(route.pathname, resolvedUrl.toString(), undefined, options);
    } catch {
      // Ignore speculative prefetch failures and let click fallback to real navigation.
    }
  }

  return {
    cacheSnapshot,
    fetchSnapshot,
    getCachedSnapshot,
    hasCachedSnapshot,
    prefetchHref,
    warmSnapshotImages,
  };
}
