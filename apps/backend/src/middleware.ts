import type { MiddlewareHandler } from 'astro';
import { slugPatternSource } from '@blackbox/content-model';
import { isCmsCollection } from '@blackbox/content-model';

const slugPattern = new RegExp(slugPatternSource);

export function isSupportedCmsApiRequest(request: Request): boolean {
  const pathname = new URL(request.url).pathname;
  if (pathname.startsWith('/_emdash/api/media/file/')) {
    try {
      const key = decodeURIComponent(pathname.slice('/_emdash/api/media/file/'.length));
      if (/^(?:snapshots|backups|drafts)(?:\/|$)/.test(key) || key.includes('%')) return false;
    } catch {
      return false;
    }
  }
  return (
    /^\/_emdash\/api\/(?:openapi\.json$|content\/|schema\/|media(?:\/|$))/.test(pathname) ||
    (request.method === 'GET' && /^\/_emdash\/api\/revisions\/[A-Za-z0-9_-]+$/.test(pathname))
  );
}

export const onRequest: MiddlewareHandler = async ({ request, url }, next) => {
  if (['GET', 'HEAD'].includes(request.method)) return next();
  const match = /^\/_emdash\/api\/content\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/.exec(url.pathname.replace(/\/+$/, ''));
  if (!match)
    return url.pathname.startsWith('/_emdash/api/content/')
      ? new Response('Unsupported editorial action', { status: 405 })
      : next();
  const [, collection, id, action] = match;
  const reject = async (code: string, status = 400) => {
    await request.body?.pipeTo(new WritableStream());
    return Response.json({ error: { code } }, { status });
  };
  if (!isCmsCollection(collection)) return reject('UNSUPPORTED_COLLECTION');
  const remove = id && !action && request.method === 'DELETE' && ['news', 'socials'].includes(collection);
  const create = !id && request.method === 'POST';
  const save = id && !action && request.method === 'PUT';
  const lifecycle = id && ['publish', 'unpublish'].includes(action ?? '') && request.method === 'POST';
  if (!create && !save && !lifecycle && !remove) return reject('UNSUPPORTED_EDITORIAL_ACTION', 405);
  const body: unknown = await request
    .clone()
    .json()
    .catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reject('INVALID_EDITORIAL_REQUEST');
  const fields = body as Record<string, unknown>;
  const allowed = create ? ['slug', 'data'] : save ? ['_rev', 'data'] : remove ? ['_rev', 'confirm'] : ['_rev'];
  if (Object.keys(fields).some((field) => !allowed.includes(field))) return reject('INVALID_EDITORIAL_REQUEST');
  if (create && (typeof fields.slug !== 'string' || !slugPattern.test(fields.slug))) return reject('INVALID_SLUG');
  if (!create && (typeof fields._rev !== 'string' || !fields._rev.trim())) return reject('REVISION_REQUIRED');
  if (remove && fields.confirm !== true) return reject('CONFIRMATION_REQUIRED');
  return next();
};
