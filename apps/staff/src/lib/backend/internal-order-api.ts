import { createInternalApiFetcher, type InternalApiComponents } from '@blackbox/api-client/internal';

export type InternalOrder = InternalApiComponents['schemas']['InternalCheckoutOrder'];
export type OrderStatus = InternalApiComponents['schemas']['InternalOrderStatus'];

export class InternalOrderApiError extends Error {
  constructor(readonly status: number) {
    super(
      status === 401 || status === 403
        ? 'Access required. Sign in with an allowed staff account, then reload this page.'
        : status === 404
          ? 'No order found for this Checkout Session. This does not mean a payment never occurred.'
          : 'Orders could not be read. Please try again. If this continues, check staff access and the operations runbook.',
    );
    this.name = 'InternalOrderApiError';
  }
}

export function createInternalOrderApi(baseUrl = '') {
  const client = createInternalApiFetcher(baseUrl);
  client.use(async (url, request) => {
    const response = await fetch(url, request);
    // Access denial must clear private state even if the response body is malformed JSON.
    if (!response.ok) throw new InternalOrderApiError(response.status);
    return {
      data: await response.json(),
      headers: response.headers,
      url: response.url,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
    };
  });
  const list = client.path('/api/internal/orders').method('get').create();
  const detail = client.path('/api/internal/orders/checkout-sessions/{checkoutSessionId}').method('get').create();
  const init = { cache: 'no-store', credentials: 'same-origin' } as const;

  async function read<T>(request: () => Promise<{ data: T }>): Promise<T> {
    try {
      return (await request()).data;
    } catch (error) {
      // Never forward response bodies, provider errors, or Access HTML to the UI.
      const status = error && typeof error === 'object' && 'status' in error ? Number(error.status) : 0;
      throw new InternalOrderApiError(status);
    }
  }

  return {
    async list(status?: OrderStatus) {
      const orders = await read(() => list({ limit: 100, ...(status ? { status } : {}) }, init));
      if (!Array.isArray(orders)) throw new InternalOrderApiError(0);
      return orders;
    },
    async detail(checkoutSessionId: string) {
      const order = await read(() => detail({ checkoutSessionId }, init));
      if (!order || typeof order !== 'object' || !order.fulfillment) throw new InternalOrderApiError(0);
      return order;
    },
  };
}
