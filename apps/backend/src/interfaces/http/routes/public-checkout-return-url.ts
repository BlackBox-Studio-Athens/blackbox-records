import { CheckoutConfigurationError } from '../../../application/commerce/checkout';

const DEFAULT_CHECKOUT_RETURN_ORIGINS = [
  'http://127.0.0.1:4321',
  'http://localhost:4321',
  'https://blackbox-studio-athens.github.io/blackbox-records',
];
const CART_CHECKOUT_PATH = '/store/checkout/';
const CART_CHECKOUT_RETURN_PATH = '/store/checkout/return/';

export function createPublicCheckoutReturnUrl(
  headers: Headers,
  requestUrl: string,
  storeItemSlug: string,
  configuredReturnOrigins?: string,
): string {
  const allowedReturnTargets = readAllowedCheckoutReturnTargets(configuredReturnOrigins);
  const referer = headers.get('referer');

  if (referer) {
    const refererUrl = parseUrl(referer);

    if (refererUrl) {
      const checkoutPath = refererUrl.pathname.endsWith('/') ? refererUrl.pathname : `${refererUrl.pathname}/`;

      if (
        hasAllowedOrigin(allowedReturnTargets, refererUrl.origin) &&
        isAllowedCheckoutPath(checkoutPath, storeItemSlug)
      ) {
        const returnTarget = findAllowedReturnTarget(allowedReturnTargets, refererUrl.origin);
        if (returnTarget) {
          return `${readCheckoutBaseUrl(refererUrl, checkoutPath) ?? returnTarget.baseUrl}${CART_CHECKOUT_RETURN_PATH}?session_id={CHECKOUT_SESSION_ID}`;
        }
      }
    }
  }

  const origin = headers.get('origin') ?? new URL(requestUrl).origin;
  const returnTarget = findAllowedReturnTarget(allowedReturnTargets, origin);

  if (!returnTarget) {
    throw new CheckoutConfigurationError('Checkout return URL is not allowed.');
  }

  return `${returnTarget.baseUrl}${CART_CHECKOUT_RETURN_PATH}?session_id={CHECKOUT_SESSION_ID}`;
}

export function createPublicCheckoutCancelUrl(
  headers: Headers,
  requestUrl: string,
  storeItemSlug: string,
  configuredReturnOrigins?: string,
): string {
  const allowedReturnTargets = readAllowedCheckoutReturnTargets(configuredReturnOrigins);
  const referer = headers.get('referer');

  if (referer) {
    const refererUrl = parseUrl(referer);

    if (refererUrl) {
      const checkoutPath = refererUrl.pathname.endsWith('/') ? refererUrl.pathname : `${refererUrl.pathname}/`;

      if (
        hasAllowedOrigin(allowedReturnTargets, refererUrl.origin) &&
        isAllowedCheckoutPath(checkoutPath, storeItemSlug)
      ) {
        const returnTarget = findAllowedReturnTarget(allowedReturnTargets, refererUrl.origin);
        if (returnTarget) {
          return `${readCheckoutBaseUrl(refererUrl, checkoutPath) ?? returnTarget.baseUrl}${CART_CHECKOUT_PATH}`;
        }
      }
    }
  }

  const origin = headers.get('origin') ?? new URL(requestUrl).origin;
  const returnTarget = findAllowedReturnTarget(allowedReturnTargets, origin);

  if (!returnTarget) {
    throw new CheckoutConfigurationError('Checkout return URL is not allowed.');
  }

  return `${returnTarget.baseUrl}${CART_CHECKOUT_PATH}`;
}

export function readAllowedCheckoutReturnOrigins(configuredReturnOrigins?: string): Set<string> {
  return new Set(readAllowedCheckoutReturnTargets(configuredReturnOrigins).map((target) => target.origin));
}

type AllowedCheckoutReturnTarget = {
  baseUrl: string;
  origin: string;
};

function readAllowedCheckoutReturnTargets(configuredReturnOrigins?: string): AllowedCheckoutReturnTarget[] {
  const configuredOrigins = configuredReturnOrigins
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return (configuredOrigins?.length ? configuredOrigins : DEFAULT_CHECKOUT_RETURN_ORIGINS)
    .map((origin) => parseUrl(origin))
    .filter((url): url is URL => Boolean(url))
    .map((url) => {
      const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '');

      return {
        baseUrl: `${url.origin}${pathname}`,
        origin: url.origin,
      };
    });
}

function findAllowedReturnTarget(
  allowedReturnTargets: AllowedCheckoutReturnTarget[],
  origin: string,
): AllowedCheckoutReturnTarget | null {
  const originUrl = parseUrl(origin);

  if (!originUrl) {
    return null;
  }

  return allowedReturnTargets.find((target) => target.origin === originUrl.origin) ?? null;
}

function hasAllowedOrigin(allowedReturnTargets: AllowedCheckoutReturnTarget[], origin: string): boolean {
  return allowedReturnTargets.some((target) => target.origin === origin);
}

function readCheckoutBaseUrl(url: URL, checkoutPath: string): string | null {
  const storeSegmentIndex = checkoutPath.lastIndexOf('/store/');
  if (storeSegmentIndex < 0) return null;

  return `${url.origin}${checkoutPath.slice(0, storeSegmentIndex)}`;
}

function isAllowedCheckoutPath(pathname: string, storeItemSlug: string): boolean {
  if (pathname.endsWith(CART_CHECKOUT_PATH)) return true;

  return pathname.endsWith(`/store/${encodeURIComponent(storeItemSlug)}/checkout/`);
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}
