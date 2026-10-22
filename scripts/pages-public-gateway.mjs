// Replaced by the release build from Astro's resolved route patterns. Empty means fail closed for site documents.
const publicRoutePatterns = [];
export const publicGatewayRoutes = {
  version: 1,
  include: ['/*'],
  exclude: ['/assets/*', '/_astro/*', '/favicon*', '/apple-touch-icon*', '/manifest.webmanifest', '/robots.txt'],
};

export function createPublicGateway(patterns, basePath = '/') {
  const routes = patterns.map((pattern) => new RegExp(pattern));
  const base = basePath.replace(/\/$/, '');
  const notFound = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  // Documents get the prerendered 404.html: one Pages asset read, no renderer call. Other requests stay plain text.
  const notFoundDocument = async (request, env) => {
    if (!request.headers.get('Accept')?.includes('text/html')) return notFound();
    const page = await env.ASSETS.fetch(new Request(new URL('/404', request.url)));
    const type = page.headers.get('Content-Type') ?? '';
    if (!type.startsWith('text/html')) {
      await page.body?.cancel();
      return notFound();
    }
    return new Response(request.method === 'HEAD' ? null : page.body, {
      status: 404,
      headers: { 'Content-Type': type, 'Cache-Control': 'no-store' },
    });
  };
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      const path = url.pathname;
      if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
      if (/^\/(?:api|_emdash|__publication|content|stock)(?:\/|$)/.test(path)) return notFound();
      if (
        /^\/(?:assets|_astro)\//.test(path) ||
        /^\/(?:favicon[^/]*|apple-touch-icon[^/]*|manifest\.webmanifest|robots\.txt)$/.test(path)
      )
        return env.ASSETS.fetch(request);
      const documentPath = base && path.startsWith(`${base}/`) ? path.slice(base.length) : path;
      const normalizeDocument =
        ((base && path === base) ||
          ((!base || path.startsWith(`${base}/`)) &&
            /^\/(?:about|services|terms|privacy|withdrawal|(?:artists|releases|news)(?:\/[^/.]+)?|store(?:\/(?!checkout(?:\/|$))[^/.]+)?)$/.test(
              documentPath,
            ))) &&
        routes.some((pattern) => pattern.test(`${path}/`));
      if (normalizeDocument) url.pathname = `${path}/`;
      if (
        !normalizeDocument &&
        !routes.some((pattern) => pattern.test(path)) &&
        path !== '/_image' &&
        !/^\/media\/content\/(?:[a-f0-9]{64}\/)?[a-f0-9]{64}$/.test(path) &&
        !['/release.json', '/content-version.json'].includes(path)
      )
        return notFoundDocument(request, env);
      const headers = new Headers({ Accept: request.headers.get('Accept') ?? '*/*' });
      const etag = request.headers.get('If-None-Match');
      if (etag !== null) headers.set('If-None-Match', etag);
      const response = await env.PUBLIC_SITE.fetch(new Request(url, { method: request.method, headers }));
      if (
        normalizeDocument &&
        (response.status === 304 ||
          (response.status === 200 && response.headers.get('Content-Type')?.toLowerCase().startsWith('text/html')))
      ) {
        await response.body?.cancel();
        return Response.redirect(url.toString(), 308);
      }
      if (!response.headers.get('Content-Type')?.toLowerCase().startsWith('text/html') && response.status !== 304)
        return response;
      const responseHeaders = new Headers(response.headers);
      if (!responseHeaders.get('Cache-Control')) responseHeaders.set('Cache-Control', 'no-store');
      return new Response(request.method === 'HEAD' ? null : response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    },
  };
}

export default createPublicGateway(publicRoutePatterns);
