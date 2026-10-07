import { createPublicApiFetcher, type PublicApiComponents } from '@blackbox/api-client/public';

import { resolvePublicCheckoutApiBaseUrl } from './public-checkout-presentation';

export { formatStoreLowStockLabel, resolvePublicCheckoutApiBaseUrl } from './public-checkout-presentation';

export type PublicStoreOffer = PublicApiComponents['schemas']['PublicStoreOffer'];
export type PublicStoreListingPrice = PublicApiComponents['schemas']['PublicStoreListingPrice'];

export type StoreCapabilities = PublicApiComponents['schemas']['StoreCapabilities'];
export type CheckoutState = PublicApiComponents['schemas']['CheckoutState'];
export type NewsletterRegistrationBody = PublicApiComponents['schemas']['NewsletterRegistrationBody'];
export type NewsletterRegistrationResponse = PublicApiComponents['schemas']['NewsletterRegistrationResponse'];
export type ServicesInquiryBody = PublicApiComponents['schemas']['ServicesInquiryBody'];
export type ServicesInquiryResponse = PublicApiComponents['schemas']['ServicesInquiryResponse'];
export type StartCheckoutBody = PublicApiComponents['schemas']['StartCheckoutBody'];
export type StartCheckoutResponse = PublicApiComponents['schemas']['StartCheckoutResponse'];
export type BackendErrorResponse = PublicApiComponents['schemas']['BackendErrorResponse'];
export type DeliveryQuoteResponse = PublicApiComponents['schemas']['DeliveryQuoteResponse'];
export type AvailabilityAlertRequestBody = PublicApiComponents['schemas']['AvailabilityAlertRequestBody'];
export type AvailabilityAlertRequestResponse = PublicApiComponents['schemas']['AvailabilityAlertRequestResponse'];

export async function readDeliveryQuote(
  lines: NonNullable<StartCheckoutBody['lines']>,
  signal?: AbortSignal,
): Promise<DeliveryQuoteResponse> {
  const fetcher = createPublicApiFetcher(resolvePublicCheckoutApiBaseUrl());
  const request = fetcher.path('/api/store/delivery-quote').method('post').create();
  return readPublicCheckoutResponse(
    () => request({ lines }, signal ? { signal } : undefined),
    'Could not calculate delivery.',
  );
}

type OpenApiErrorLike = {
  data: unknown;
  status: number;
};

export interface PublicCheckoutApi {
  readStoreCapabilities(): Promise<StoreCapabilities>;
  readStoreOffer(storeItemSlug: string): Promise<PublicStoreOffer>;
  readStoreOfferVariants(storeItemSlug: string): Promise<PublicStoreOffer[]>;
  startCheckout(body: StartCheckoutBody, idempotencyKey?: string): Promise<StartCheckoutResponse>;
  readCheckoutState(checkoutSessionId: string): Promise<CheckoutState>;
  registerNewsletterSignup(body: NewsletterRegistrationBody): Promise<NewsletterRegistrationResponse>;
  requestAvailabilityAlert(
    storeItemSlug: string,
    body: AvailabilityAlertRequestBody,
  ): Promise<AvailabilityAlertRequestResponse>;
}

export class PublicCheckoutApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'PublicCheckoutApiError';
    this.status = status;
    this.body = body;
  }
}

const storeOfferReads = new Map<string, Promise<PublicStoreOffer>>();

export function createPublicCheckoutApi(
  configuredBackendBaseUrl = import.meta.env.PUBLIC_BACKEND_BASE_URL,
): PublicCheckoutApi {
  const backendBaseUrl = resolvePublicCheckoutApiBaseUrl(configuredBackendBaseUrl);
  const fetcher = createPublicApiFetcher(backendBaseUrl);

  const readStoreCapabilitiesRequest = fetcher.path('/api/store/capabilities').method('get').create();
  const readStoreOfferRequest = fetcher.path('/api/store/items/{storeItemSlug}').method('get').create();
  const readStoreOfferVariantsRequest = fetcher
    .path('/api/store/items/{storeItemSlug}/variants')
    .method('get')
    .create();
  const startCheckoutRequest = fetcher.path('/api/checkout/sessions').method('post').create();
  const readCheckoutStateRequest = fetcher
    .path('/api/checkout/sessions/{checkoutSessionId}/state')
    .method('get')
    .create();
  const registerNewsletterSignupRequest = fetcher.path('/api/newsletter/registrations').method('post').create();
  const requestAvailabilityAlertRequest = fetcher
    .path('/api/store/items/{storeItemSlug}/availability-alerts')
    .method('post')
    .create();

  return {
    async readStoreCapabilities() {
      return readPublicCheckoutResponse(
        () => readStoreCapabilitiesRequest({}),
        'Could not load checkout capabilities.',
      );
    },
    readStoreOffer(storeItemSlug: string) {
      const key = JSON.stringify([backendBaseUrl, storeItemSlug]);
      const existing = storeOfferReads.get(key);
      if (existing) return existing;
      const pending = readPublicCheckoutResponse(
        () => readStoreOfferRequest({ storeItemSlug }),
        'Could not load the store offer.',
      ).finally(() => storeOfferReads.delete(key));
      storeOfferReads.set(key, pending);
      return pending;
    },
    async readStoreOfferVariants(storeItemSlug: string) {
      return readPublicCheckoutResponse(
        () => readStoreOfferVariantsRequest({ storeItemSlug }),
        'Could not load the store offer variants.',
      );
    },
    async startCheckout(body: StartCheckoutBody, idempotencyKey?: string) {
      return readPublicCheckoutResponse(
        () =>
          startCheckoutRequest(body, idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined),
        'Could not start checkout.',
      );
    },
    async readCheckoutState(checkoutSessionId: string) {
      return readPublicCheckoutResponse(
        () => readCheckoutStateRequest({ checkoutSessionId }),
        'Could not load checkout status.',
      );
    },
    async registerNewsletterSignup(body: NewsletterRegistrationBody) {
      return readPublicCheckoutResponse(
        () => registerNewsletterSignupRequest(body),
        'Newsletter signup is temporarily unavailable.',
      );
    },
    async requestAvailabilityAlert(storeItemSlug: string, body: AvailabilityAlertRequestBody) {
      return readPublicCheckoutResponse(
        () => requestAvailabilityAlertRequest({ storeItemSlug, ...body }),
        "Couldn't save that. Try again.",
      );
    },
  };
}

export async function submitPublicServicesInquiry(
  body: ServicesInquiryBody,
  configuredBackendBaseUrl = import.meta.env.PUBLIC_BACKEND_BASE_URL,
): Promise<ServicesInquiryResponse> {
  const fetcher = createPublicApiFetcher(resolvePublicCheckoutApiBaseUrl(configuredBackendBaseUrl));
  const request = fetcher.path('/api/services/inquiries').method('post').create();

  return readPublicCheckoutResponse(() => request(body), 'Services inquiry is temporarily unavailable.');
}

async function readPublicCheckoutResponse<TResponse>(
  operation: () => Promise<{ data: TResponse }>,
  fallbackMessage: string,
): Promise<TResponse> {
  try {
    return (await operation()).data;
  } catch (error) {
    throw normalizePublicCheckoutApiError(error, fallbackMessage);
  }
}

function normalizePublicCheckoutApiError(error: unknown, fallbackMessage: string): PublicCheckoutApiError {
  if (isOpenApiErrorLike(error)) {
    return new PublicCheckoutApiError(
      error.status,
      extractBackendErrorMessage(error.data, fallbackMessage),
      error.data,
    );
  }

  if (error instanceof Error) {
    return new PublicCheckoutApiError(0, error.message || fallbackMessage, error);
  }

  return new PublicCheckoutApiError(0, fallbackMessage, error);
}

function isOpenApiErrorLike(error: unknown): error is OpenApiErrorLike {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'data' in error &&
    'status' in error &&
    typeof (error as { status?: unknown }).status === 'number',
  );
}

function extractBackendErrorMessage(body: unknown, fallbackMessage: string): string {
  if (!body || typeof body !== 'object') return fallbackMessage;

  const record = body as Record<string, unknown>;
  const localType = typeof record.type === 'string' && /^\/problems\/[a-z][a-z0-9_]*$/.test(record.type);
  if (localType && typeof record.detail === 'string' && record.detail.trim())
    return record.detail.trim().slice(0, 1000);

  if (typeof record.error === 'string' && (!('type' in record) || localType) && record.error.trim()) {
    if (/^[A-Z][A-Z0-9_]+$/.test(record.error.trim())) return fallbackMessage;
    return record.error.trim().slice(0, 1000);
  }

  return fallbackMessage;
}
