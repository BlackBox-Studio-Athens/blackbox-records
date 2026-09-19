// Call only after authentication, including conditional GET/HEAD requests.
export function staffAssetResponse(request: Request, response: Response): Response {
  const url = new URL(request.url);
  const extension = /^\/_astro\/[^/]+\.[\w-]{8,}\.(js|css|woff2?)$/.exec(url.pathname)?.[1];
  const type = response.headers.get('Content-Type')?.split(';')[0].trim();
  const correctType =
    extension === 'js'
      ? type === 'text/javascript' || type === 'application/javascript'
      : extension === 'css'
        ? type === 'text/css'
        : type === `font/${extension}`;
  const reusable =
    ['GET', 'HEAD'].includes(request.method) &&
    extension &&
    !url.search &&
    ((response.status === 200 && correctType) || response.status === 304) &&
    response.headers.has('ETag') &&
    !response.headers.has('Set-Cookie');
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', reusable ? 'private, no-cache, must-revalidate' : 'private, no-store');
  return new Response(response.body, { status: response.status, headers });
}
