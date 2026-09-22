import type { RetainedPreview } from './preview-contexts';
import { readBoundedText } from './preview-content';
import { publicationPublicUrl } from './publication-review';
import type { PublicationEnvironment } from './published-storage';
import { previewPolicy } from './preview-policy';

export const privatePreviewHeaders = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

export async function renderPreviewPage(
  request: Request,
  id: string,
  retained: RetainedPreview,
  renderer: Fetcher,
  environment: PublicationEnvironment,
) {
  const url = new URL(request.url);
  const content = retained.selection.content;
  const images = Object.fromEntries(
    Object.entries(retained.selection.media).map(([key, image]) => [
      key,
      {
        src: `/_preview/media/${id}/${key}`,
        width: image.width,
        height: image.height,
        format: image.mimeType === 'image/jpeg' ? 'jpg' : image.mimeType.slice(6),
      },
    ]),
  );
  const response = await renderer.fetch(
    new Request(new URL('/__publication/preview', publicationPublicUrl(environment)), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: id,
        generation: retained.generation,
        parentOrigin: retained.parentOrigin,
        path: url.pathname,
        content: {
          records: content.records.map(({ collection, id, slug, data }) => ({ collection, id, slug, data })),
          ...(content.storeItems ? { storeItems: content.storeItems } : {}),
        },
        images,
      }),
    }),
  );
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(privatePreviewHeaders)) headers.set(key, value);
  headers.set('Content-Security-Policy', previewPolicy(retained.parentOrigin));
  const internalUrl = (href: string) => {
    const target = new URL(href, url);
    if (![url.origin, new URL(publicationPublicUrl(environment)).origin].includes(target.origin)) return href;
    target.host = url.host;
    target.protocol = url.protocol;
    target.searchParams.set('__preview', id);
    return target.href;
  };
  if (headers.has('Location')) headers.set('Location', internalUrl(headers.get('Location')!));
  const body = response.body ? await readBoundedText(response.body, 4 * 1024 * 1024) : '';
  if (!response.ok || !headers.get('Content-Type')?.includes('text/html'))
    return new Response(body, { status: response.status, headers });
  return new HTMLRewriter()
    .on('meta[http-equiv="refresh"]', {
      element(element) {
        const refresh = /^(\d+;\s*url=)(.+)$/i.exec(element.getAttribute('content') ?? '');
        if (refresh) element.setAttribute('content', refresh[1] + internalUrl(refresh[2]!));
      },
    })
    .on('script[data-redirect-url]', {
      element(element) {
        element.setAttribute('data-redirect-url', internalUrl(element.getAttribute('data-redirect-url')!));
      },
    })
    .on('a[href]', {
      element(element) {
        element.setAttribute('href', internalUrl(element.getAttribute('href')!));
      },
    })
    .transform(new Response(body, { status: response.status, headers }));
}
