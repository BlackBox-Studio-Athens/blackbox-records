// Replaced by the release build from Astro's resolved route patterns. Empty means fail closed for site documents.
const publicRoutePatterns = [];
export const publicGatewayRoutes = {
  version: 1,
  include: ['/*'],
  exclude: ['/assets/*', '/_astro/*', '/favicon*', '/robots.txt'],
};

export function createPublicGateway(patterns) {
  const routes = patterns.map((pattern) => new RegExp(pattern));
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
      const path = new URL(request.url).pathname;
      if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
      if (/^\/(?:api|_emdash|__publication|content|stock)(?:\/|$)/.test(path)) return notFound();
      if (/^\/(?:assets|_astro)\//.test(path) || /^\/(?:favicon[^/]*|robots\.txt)$/.test(path))
        return env.ASSETS.fetch(request);
      if (
        !routes.some((pattern) => pattern.test(path)) &&
        path !== '/_image' &&
        !/^\/media\/content\/(?:[a-f0-9]{64}\/)?[a-f0-9]{64}$/.test(path) &&
        !['/release.json', '/content-version.json'].includes(path)
      )
        return notFoundDocument(request, env);
      const headers = new Headers({ Accept: request.headers.get('Accept') ?? '*/*' });
      const etag = request.headers.get('If-None-Match');
      if (etag !== null) headers.set('If-None-Match', etag);
      return env.PUBLIC_SITE.fetch(new Request(request.url, { method: request.method, headers }));
    },
  };
}

export default createPublicGateway(publicRoutePatterns);
