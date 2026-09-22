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
