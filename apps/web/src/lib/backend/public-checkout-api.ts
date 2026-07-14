import { createPublicApiFetcher, type PublicApiComponents } from '@blackbox/api-client/public';

import { getPublicBackendBaseUrl } from './public-backend-config';

export type PublicStoreOffer = PublicApiComponents['schemas']['PublicStoreOffer'];
export type StoreCapabilities = PublicApiComponents['schemas']['StoreCapabilities'];
export type CheckoutState = PublicApiComponents['schemas']['CheckoutState'];
export type NewsletterRegistrationBody = PublicApiComponents['schemas']['NewsletterRegistrationBody'];
export type NewsletterRegistrationResponse = PublicApiComponents['schemas']['NewsletterRegistrationResponse'];
export type StartCheckoutBody = PublicApiComponents['schemas']['StartCheckoutBody'];
export type StartCheckoutResponse = PublicApiComponents['schemas']['StartCheckoutResponse'];
export type BackendErrorResponse = PublicApiComponents['schemas']['BackendErrorResponse'];

type OpenApiErrorLike = {
  data: unknown;
  status: number;
};

export interface PublicCheckoutApi {
  readStoreCapabilities(): Promise<StoreCapabilities>;
  readStoreOffer(storeItemSlug: string): Promise<PublicStoreOffer>;
  readStoreOfferVariants(storeItemSlug: string): Promise<PublicStoreOffer[]>;
  startCheckout(body: StartCheckoutBody): Promise<StartCheckoutResponse>;
  readCheckoutState(checkoutSessionId: string): Promise<CheckoutState>;
  registerNewsletterSignup(body: NewsletterRegistrationBody): Promise<NewsletterRegistrationResponse>;
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

export function resolvePublicCheckoutApiBaseUrl(configuredValue = import.meta.env.PUBLIC_BACKEND_BASE_URL): string {
  return getPublicBackendBaseUrl(configuredValue) ?? '';
}

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

  return {
    async readStoreCapabilities() {
      return readPublicCheckoutResponse(
        () => readStoreCapabilitiesRequest({}),
        'Could not load checkout capabilities.',
      );
    },
    async readStoreOffer(storeItemSlug: string) {
      return readPublicCheckoutResponse(
        () => readStoreOfferRequest({ storeItemSlug }),
        'Could not load the store offer.',
      );
    },
    async readStoreOfferVariants(storeItemSlug: string) {
      return readPublicCheckoutResponse(
        () => readStoreOfferVariantsRequest({ storeItemSlug }),
        'Could not load the store offer variants.',
      );
    },
    async startCheckout(body: StartCheckoutBody) {
      return readPublicCheckoutResponse(() => startCheckoutRequest(body), 'Could not start checkout.');
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
  };
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
  if (body && typeof body === 'object' && 'error' in body) {
    const errorMessage = (body as { error?: unknown }).error;

    if (typeof errorMessage === 'string' && errorMessage.trim()) {
      return errorMessage;
    }
  }

  return fallbackMessage;
}
