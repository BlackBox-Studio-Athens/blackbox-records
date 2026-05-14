import { buildOverlayFragmentUrl, parseOverlayRoute } from '@/lib/app-shell/routing';

type OverlayFragmentResponse = Pick<Response, 'ok' | 'text'>;

type OverlayFragmentLoaderOptions = {
  buildFragmentUrl?: typeof buildOverlayFragmentUrl;
  cache?: Map<string, string>;
  currentHref?: () => string;
  fetchFragment?: (href: string, init: RequestInit) => Promise<OverlayFragmentResponse>;
  inFlightRequests?: Map<string, Promise<string>>;
};

function normalizeOverlayPathname(pathname: string) {
  return parseOverlayRoute(pathname)?.pathname ?? pathname;
}

export function createOverlayFragmentLoader({
  buildFragmentUrl = buildOverlayFragmentUrl,
  cache = new Map<string, string>(),
  currentHref = () => window.location.href,
  fetchFragment = (href, init) => fetch(href, init),
  inFlightRequests = new Map<string, Promise<string>>(),
}: OverlayFragmentLoaderOptions = {}) {
  function getCachedHtml(pathname: string) {
    return cache.get(normalizeOverlayPathname(pathname)) ?? '';
  }

  function hasCachedHtml(pathname: string) {
    return cache.has(normalizeOverlayPathname(pathname));
  }

  async function fetchHtml(pathname: string, signal?: AbortSignal) {
    const normalizedPathname = normalizeOverlayPathname(pathname);
    const cachedHtml = cache.get(normalizedPathname);
    if (cachedHtml) return cachedHtml;

    const existingRequest = inFlightRequests.get(normalizedPathname);
    if (existingRequest) return existingRequest;

    const fragmentUrl = buildFragmentUrl(normalizedPathname);
    if (!fragmentUrl) {
      throw new Error(`Overlay fragment is not available for ${normalizedPathname}`);
    }

    const request = fetchFragment(fragmentUrl, {
      credentials: 'same-origin',
      headers: {
        accept: 'text/html',
      },
      signal: signal ?? null,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Overlay fragment request failed for ${normalizedPathname}`);
        }

        const html = await response.text();
        cache.set(normalizedPathname, html);
        return html;
      })
      .finally(() => {
        inFlightRequests.delete(normalizedPathname);
      });

    inFlightRequests.set(normalizedPathname, request);
    return request;
  }

  async function prefetchHref(href: string) {
    const resolvedUrl = new URL(href, currentHref());
    const route = parseOverlayRoute(resolvedUrl.pathname);
    if (!route || cache.has(route.pathname)) return;

    try {
      await fetchHtml(route.pathname);
    } catch {
      // Ignore speculative prefetch failures and let click fallback to real navigation.
    }
  }

  return {
    fetchHtml,
    getCachedHtml,
    hasCachedHtml,
    prefetchHref,
  };
}
