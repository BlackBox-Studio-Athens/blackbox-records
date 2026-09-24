import { verifyOperatorAccess } from '../interfaces/http/auth';
import type { AppBindings } from '../env';

type PreviewBindings = AppBindings & {
  CMS_HOSTNAME?: string;
  CMS_PREVIEW_HOSTNAME?: string;
  CMS_PREVIEW_POLICY_AUD?: string;
};
export function previewOrigin(bindings: PreviewBindings, requestUrl: URL) {
  if (bindings.PRODUCT_ENVIRONMENT === 'LOCAL') return `http://localhost:${requestUrl.port || '8787'}`;
  const hostname = bindings.CMS_PREVIEW_HOSTNAME;
  if (
    !hostname ||
    !/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/.test(hostname) ||
    hostname === bindings.CMS_HOSTNAME ||
    !bindings.CMS_PREVIEW_POLICY_AUD
  )
    throw new Error('The protected preview origin is not configured.');
  return `https://${hostname}`;
}

export function isPreviewHost(request: Request, bindings: PreviewBindings) {
  const url = new URL(request.url);
  return bindings.PRODUCT_ENVIRONMENT === 'LOCAL'
    ? url.hostname === 'localhost'
    : !!bindings.CMS_PREVIEW_HOSTNAME && url.hostname === bindings.CMS_PREVIEW_HOSTNAME;
}

export async function authenticatePreview(request: Request, bindings: PreviewBindings) {
  if (new URL(request.url).origin !== previewOrigin(bindings, new URL(request.url)))
    throw new Error('Unauthorized hostname');
  const result = await verifyOperatorAccess(request, {
    ...bindings,
    CF_ACCESS_POLICY_AUD:
      bindings.PRODUCT_ENVIRONMENT === 'LOCAL' ? bindings.CF_ACCESS_POLICY_AUD : bindings.CMS_PREVIEW_POLICY_AUD,
  });
  if (result.status !== 'verified') throw new Error('Sign in again to preview.');
  return result.identity;
}

export async function previewSessionResponse(request: Request, bindings: PreviewBindings) {
  await authenticatePreview(request, bindings);
  const url = new URL(request.url);
  const staffOrigin =
    bindings.PRODUCT_ENVIRONMENT === 'LOCAL'
      ? `http://127.0.0.1:${url.port || '8787'}`
      : `https://${bindings.CMS_HOSTNAME}`;
  const origin = request.headers.get('Origin');
  const headers = {
    'Cache-Control': 'private, no-store',
    Vary: 'Origin, Accept',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow',
    ...(origin === staffOrigin
      ? { 'Access-Control-Allow-Origin': staffOrigin, 'Access-Control-Allow-Credentials': 'true' }
      : {}),
  };
  if (request.method !== 'GET' || url.search || (origin && origin !== staffOrigin))
    return new Response('Forbidden', { status: 403, headers });
  if (request.headers.get('Accept') === 'application/json') return new Response(null, { status: 204, headers });
  return new Response(
    '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Preview sign-in complete</title><h1>Preview sign-in complete</h1><p>Return to the editor tab and choose Retry preview. You can close this tab.</p></html>',
    { headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } },
  );
}
