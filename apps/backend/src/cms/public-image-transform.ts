export const publicImageTransformOrigin = 'https://images.blackboxrecordsathens.com';

// Transformation ladder. Requested widths snap up to the next rung so every candidate is a shared, bounded transform.
export const publicImageWidths = [
  96, 160, 240, 320, 360, 480, 640, 720, 800, 900, 960, 1080, 1200, 1400, 1440, 1600, 1800,
] as const;

/**
 * Widths the site's image components list in `widths` or `width` (144/216 are gallery thumbnails; 540 is a News card). Astro also requests
 * each CMS image at its intrinsic width as the `src` fallback; the renderer accepts that width per image.
 */
export const publicImageRequestWidths: ReadonlySet<number> = new Set([...publicImageWidths, 144, 176, 216, 540]);

// Fixed profiles preserve component semantics without accepting arbitrary Images options.
export type PublicImageProfile = 'auto' | 'webp' | 'editorial' | 'blur' | 'metadata';

export function isPublicImageRequestWidth(width: string, intrinsicWidth: number) {
  if (!/^[1-9][0-9]{0,4}$/.test(width)) return false;
  return publicImageRequestWidths.has(Number(width)) || Number(width) === intrinsicWidth;
}

/** Media is addressed by its own content SHA. The legacy snapshot-scoped shape stays readable for cached pages. */
export function parsePublicMediaPath(path: string): { mediaSha256: string; snapshotSha256?: string } | null {
  const match = /^\/media\/content\/(?:([a-f0-9]{64})\/)?([a-f0-9]{64})$/.exec(path);
  if (!match) return null;
  return match[1] ? { mediaSha256: match[2]!, snapshotSha256: match[1] } : { mediaSha256: match[2]! };
}

/**
 * `sourceOrigin` is the environment's canonical Images source (an approved origin in the Images zone settings), not
 * the shopper's request host, so a new public hostname keeps transformations. An empty transformation origin
 * disables transformation (Local).
 */
export type PublicImageConfig = { sourceOrigin: string; transformationOrigin: string };

// Bounded fallback: short enough to pick transformations up again, long enough to absorb repeated misses at the edge.
export const publicImageFallbackCacheControl = 'public, max-age=300';

export function publicImageTransformUrl(
  mediaSha256: string,
  config: PublicImageConfig,
  width: number,
  profile: PublicImageProfile = 'auto',
): URL | null {
  if (!/^[a-f0-9]{64}$/.test(mediaSha256) || !Number.isInteger(width) || !(width > 0)) return null;
  if ((profile === 'blur' && width !== 160) || (profile === 'metadata' && width > 1200)) return null;
  const options = {
    auto: 'format=auto',
    webp: 'format=webp',
    editorial: 'format=webp,quality=68',
    blur: 'format=webp,quality=40',
    metadata: 'format=jpeg',
  }[profile];
  if (typeof options !== 'string') return null;
  try {
    const origin = new URL(config.transformationOrigin);
    const source = new URL(config.sourceOrigin);
    if (
      origin.origin !== publicImageTransformOrigin ||
      origin.pathname !== '/' ||
      origin.search ||
      origin.hash ||
      origin.username ||
      origin.password
    )
      return null;
    if (
      source.protocol !== 'https:' ||
      source.pathname !== '/' ||
      source.search ||
      source.hash ||
      source.username ||
      source.password
    )
      return null;
    const sourceUrl = new URL(`/media/content/${mediaSha256}`, source.origin);
    // Metadata uses one 1200px ceiling; Images' default scale-down fit never enlarges a smaller source.
    const snapped =
      profile === 'metadata'
        ? 1200
        : (publicImageWidths.find((candidate) => candidate >= width) ?? publicImageWidths.at(-1)!);
    return new URL(`/cdn-cgi/image/width=${snapped},${options}/${encodeURI(sourceUrl.href)}`, origin);
  } catch {
    return null;
  }
}

export async function deliverPublicCmsImage(
  request: Request,
  mediaSha256: string,
  width: number | null,
  config: PublicImageConfig,
  fetchOriginal: () => Promise<Response>,
  fetchTransformed: (url: URL, request: Request) => Promise<Response> = (url, imageRequest) =>
    fetch(
      new Request(url, {
        method: imageRequest.method,
        headers: { Accept: imageRequest.headers.get('Accept') ?? '*/*' },
      }),
    ),
  profile: PublicImageProfile = 'auto',
): Promise<Response> {
  // A failed transform can be transient (e.g. the monthly Images quota), so the original is never cached immutably here.
  const fallbackOriginal = async () => {
    const original = await fetchOriginal();
    const headers = new Headers(original.headers);
    headers.set('Cache-Control', original.ok ? publicImageFallbackCacheControl : 'no-store');
    headers.set('X-Blackbox-Image', 'original-fallback');
    return new Response(original.body, { status: original.status, headers });
  };
  if (width === null || !config.transformationOrigin) return fetchOriginal();
  const transformedUrl = publicImageTransformUrl(mediaSha256, config, width, profile);
  if (!transformedUrl) return fallbackOriginal();

  try {
    const transformed = await fetchTransformed(transformedUrl, request);
    const contentType = transformed.headers.get('Content-Type')?.split(';', 1)[0].trim() ?? '';
    if (transformed.status !== 200 || !/^image\/(?:avif|jpeg|png|webp)$/i.test(contentType)) {
      if (transformed.body) await transformed.body.cancel().catch(() => {});
      return fallbackOriginal();
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
    return fallbackOriginal();
  }
}
