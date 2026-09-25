export const publicImageTransformOrigin = 'https://images.blackboxrecordsathens.com';

// These widths already occur in the site's Astro image candidates.
export const publicImageWidths = [
  96, 160, 240, 320, 360, 480, 640, 720, 800, 900, 960, 1080, 1200, 1400, 1440, 1600, 1800,
] as const;

type PublicImageEnvironment = 'local' | 'uat' | 'prd';

export function publicImageTransformUrl(
  source: URL,
  transformationOrigin: string,
  environment: PublicImageEnvironment,
  width: number,
): URL | null {
  const allowedOrigin =
    environment === 'uat'
      ? 'https://blackbox-records-web-uat.pages.dev'
      : environment === 'prd'
        ? 'https://blackbox-records-web.pages.dev'
        : null;
  const imagePath = source.pathname.replace(/^\/blackbox-records(?=\/)/, '');
  if (
    !allowedOrigin ||
    source.origin !== allowedOrigin ||
    source.search ||
    source.hash ||
    !/^\/media\/content\/[a-f0-9]{64}\/[a-f0-9]{64}$/.test(imagePath) ||
    !publicImageWidths.some((candidate) => candidate === width)
  )
    return null;
  try {
    const origin = new URL(transformationOrigin);
    if (origin.origin !== publicImageTransformOrigin || origin.pathname !== '/') return null;
    return new URL(`/cdn-cgi/image/width=${width},format=auto/${encodeURI(source.href)}`, origin);
  } catch {
    return null;
  }
}

export async function deliverPublicCmsImage(
  request: Request,
  source: URL,
  environment: PublicImageEnvironment,
  transformationOrigin: string,
  fetchOriginal: () => Promise<Response>,
  fetchTransformed: (url: URL, request: Request) => Promise<Response> = (url, imageRequest) =>
    fetch(
      new Request(url, {
        method: imageRequest.method,
        headers: { Accept: imageRequest.headers.get('Accept') ?? '*/*' },
      }),
    ),
): Promise<Response> {
  const width = Number(new URL(request.url).searchParams.get('w'));
  const transformedUrl = publicImageTransformUrl(source, transformationOrigin, environment, width);
  if (!transformedUrl) return fetchOriginal();

  try {
    const transformed = await fetchTransformed(transformedUrl, request);
    const contentType = transformed.headers.get('Content-Type')?.split(';', 1)[0].trim() ?? '';
    if (transformed.status !== 200 || !/^image\/(?:avif|jpeg|png|webp)$/i.test(contentType)) {
      if (transformed.body) await transformed.body.cancel().catch(() => {});
      return fetchOriginal();
    }
    const headers = new Headers(transformed.headers);
    if (request.method === 'HEAD' && transformed.body) await transformed.body.cancel().catch(() => {});
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    const vary = new Set(
      (headers.get('Vary') ?? '')
        .split(',')
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean),
    );
    vary.add('accept');
    headers.set('Vary', [...vary].join(', '));
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(request.method === 'HEAD' ? null : transformed.body, { status: 200, headers });
  } catch {
    return fetchOriginal();
  }
}
