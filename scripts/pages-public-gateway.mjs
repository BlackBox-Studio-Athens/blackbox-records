// Pages preserves public origins and serves compiled assets; only public GET/HEAD reaches the renderer.
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
    if (/^\/(?:api|_emdash|__publication|content|stock)(?:\/|$)/.test(path))
      return new Response('Not found', { status: 404 });
    if (/^\/(?:assets|_astro)\//.test(path) || /^\/(?:favicon\.[^/]+|robots\.txt)$/.test(path))
      return env.ASSETS.fetch(request);
    return env.PUBLIC_SITE.fetch(new Request(request.url, { method: request.method }));
  },
};
