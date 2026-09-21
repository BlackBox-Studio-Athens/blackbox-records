import type { MiddlewareHandler } from 'astro';
import { slugPatternSource } from '@blackbox/content-model';
import { isCmsCollection } from '@blackbox/content-model';
import { cmsNestedProblemResponse } from './interfaces/http/responses';

const slugPattern = new RegExp(slugPatternSource);

// This only selects a forwarding path. EmDash must authenticate the token and enforce its scopes.
export function isCmsTokenExportRead(request: Request): boolean {
  if (
    request.method !== 'GET' ||
    !/^Bearer ec_pat_[A-Za-z0-9_-]{32,128}$/.test(request.headers.get('Authorization') ?? '')
  )
    return false;
  const url = new URL(request.url);
  const collection = /^\/_emdash\/api\/content\/([a-z_]+)$/.exec(url.pathname)?.[1];
  if (collection && isCmsCollection(collection)) {
    const keys = [...url.searchParams.keys()];
    return (
      new Set(keys).size === keys.length &&
      keys.every((key) => ['limit', 'orderBy', 'order', 'cursor'].includes(key)) &&
      url.searchParams.get('limit') === '100' &&
      url.searchParams.get('orderBy') === 'createdAt' &&
      url.searchParams.get('order') === 'asc' &&
      (!url.searchParams.has('cursor') ||
        (url.searchParams.get('cursor')!.length > 0 && url.searchParams.get('cursor')!.length <= 4096))
    );
  }
  if (url.search) return false;
  return (
    /^\/_emdash\/api\/(?:revisions|media)\/[A-Za-z0-9_-]{1,128}$/.test(url.pathname) ||
    (/^\/_emdash\/api\/media\/file\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.(?:png|jpe?g|webp)$/i.test(url.pathname) &&
      isSupportedCmsApiRequest(request))
  );
}

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
    (pathname === '/_emdash/api/admin/api-tokens' && ['GET', 'POST'].includes(request.method)) ||
    (request.method === 'DELETE' && /^\/_emdash\/api\/admin\/api-tokens\/[A-Za-z0-9_-]{1,128}$/.test(pathname)) ||
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
    return cmsNestedProblemResponse(status, { code });
  };
  if (!isCmsCollection(collection)) return reject('UNSUPPORTED_COLLECTION');
  const lock = id && action === 'lock' && ['POST', 'DELETE'].includes(request.method);
  const remove = id && !action && request.method === 'DELETE' && ['news', 'socials'].includes(collection);
  const create = !id && request.method === 'POST';
  const save = id && !action && request.method === 'PUT';
  const lifecycle = id && ['publish', 'unpublish', 'discard-draft'].includes(action ?? '') && request.method === 'POST';
  if (lock) return next();
  if (!create && !save && !lifecycle && !remove) return reject('UNSUPPORTED_EDITORIAL_ACTION', 405);
  const body: unknown = await request
    .clone()
    .json()
    .catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reject('INVALID_EDITORIAL_REQUEST');
  const fields = body as Record<string, unknown>;
  const allowed = create
    ? ['slug', 'data']
    : save
      ? ['_rev', 'data', 'overrideLock']
      : remove
        ? ['_rev', 'confirm']
        : ['_rev', 'overrideLock'];
  if (Object.keys(fields).some((field) => !allowed.includes(field))) return reject('INVALID_EDITORIAL_REQUEST');
  if (create && (typeof fields.slug !== 'string' || !slugPattern.test(fields.slug))) return reject('INVALID_SLUG');
  if (!create && (typeof fields._rev !== 'string' || !fields._rev.trim())) return reject('REVISION_REQUIRED');
  if (remove && fields.confirm !== true) return reject('CONFIRMATION_REQUIRED');
  return next();
};
