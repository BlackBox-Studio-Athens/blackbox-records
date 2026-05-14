import { CheckoutConfigurationError } from '../../../application/commerce/checkout';

const DEFAULT_CHECKOUT_RETURN_ORIGINS = [
  'http://127.0.0.1:4321',
  'http://localhost:4321',
  'https://blackbox-studio-athens.github.io',
];

export function createPublicCheckoutReturnUrl(
  headers: Headers,
  requestUrl: string,
  storeItemSlug: string,
  configuredReturnOrigins?: string,
): string {
  const allowedOrigins = readAllowedCheckoutReturnOrigins(configuredReturnOrigins);
  const referer = headers.get('referer');

  if (referer) {
    const refererUrl = parseUrl(referer);

    if (refererUrl) {
      const checkoutPath = refererUrl.pathname.endsWith('/') ? refererUrl.pathname : `${refererUrl.pathname}/`;

      if (allowedOrigins.has(refererUrl.origin) && isCheckoutPathForStoreItem(checkoutPath, storeItemSlug)) {
        return `${refererUrl.origin}${checkoutPath}return?session_id={CHECKOUT_SESSION_ID}`;
      }
    }
  }

  const origin = headers.get('origin') ?? new URL(requestUrl).origin;
  const originUrl = parseUrl(origin);

  if (!originUrl || !allowedOrigins.has(originUrl.origin)) {
    throw new CheckoutConfigurationError('Checkout return URL is not allowed.');
  }

  return `${originUrl.origin}/store/${encodeURIComponent(storeItemSlug)}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;
}

export function readAllowedCheckoutReturnOrigins(configuredReturnOrigins?: string): Set<string> {
  const configuredOrigins = configuredReturnOrigins
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set(
    (configuredOrigins?.length ? configuredOrigins : DEFAULT_CHECKOUT_RETURN_ORIGINS)
      .map((origin) => parseUrl(origin)?.origin)
      .filter((origin): origin is string => Boolean(origin)),
  );
}

function isCheckoutPathForStoreItem(pathname: string, storeItemSlug: string): boolean {
  return pathname.endsWith(`/store/${encodeURIComponent(storeItemSlug)}/checkout/`);
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}
