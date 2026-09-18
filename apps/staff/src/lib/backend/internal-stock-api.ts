import type { InternalApiComponents, InternalApiOperations } from '@blackbox/api-client/internal';
import { extractSafeProblemDetail } from './problem-details';

export type InternalVariantSummary = InternalApiComponents['schemas']['InternalVariantSummary'];
export type InternalStockDetail = InternalApiComponents['schemas']['InternalStockDetail'];
export type InternalStockHistoryResponse = InternalApiComponents['schemas']['InternalStockHistoryResponse'];
export type InternalStockChangeBody = InternalApiComponents['schemas']['InternalStockChangeBody'];
export type InternalStockCountBody = InternalApiComponents['schemas']['InternalStockCountBody'];
export type RecordedStockChangeResponse = InternalApiComponents['schemas']['RecordedStockChangeResponse'];
export type RecordedStockCountResponse = InternalApiComponents['schemas']['RecordedStockCountResponse'];
export type CatalogPriceDetail = InternalApiComponents['schemas']['CatalogPriceDetail'];
export type CatalogItemPublishDetail = InternalApiComponents['schemas']['CatalogItemPublishDetail'];
export type CatalogItemPublishCommand =
  InternalApiOperations['publishCatalogItem']['requestBody']['content']['application/json'];
export type CatalogSetupCommand =
  InternalApiOperations['setupCatalogItem']['requestBody']['content']['application/json'];
export type CatalogPriceCommand = Pick<CatalogPriceDetail, 'expectedRevision' | 'price'> & {
  operationId: string;
  confirmLivePriceChange: boolean;
};
type BackendErrorResponse = InternalApiComponents['schemas']['BackendErrorResponse'];

type FetchLike = typeof fetch;

interface CreateInternalStockApiOptions {
  backendBaseUrl?: string;
  fetcher?: FetchLike;
}

export class InternalStockApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'InternalStockApiError';
    this.status = status;
  }
}

export function getInternalStockApiBaseUrl(configuredValue = import.meta.env.PUBLIC_BACKEND_BASE_URL): string {
  return configuredValue?.trim().replace(/\/+$/, '') ?? '';
}

export function buildInternalStockApiUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | undefined>,
): string {
  const queryString = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') {
      queryString.set(key, String(value));
    }
  }

  const suffix = queryString.size > 0 ? `?${queryString.toString()}` : '';

  return `${baseUrl}${path}${suffix}`;
}

export function createInternalStockApi({ backendBaseUrl = '', fetcher = fetch }: CreateInternalStockApiOptions = {}) {
  async function fetchJson<TResponse>(
    path: string,
    init?: RequestInit,
    query?: Record<string, string | number | undefined>,
  ): Promise<TResponse> {
    const response = await fetcher(buildInternalStockApiUrl(backendBaseUrl, path, query), {
      credentials: 'same-origin',
      ...init,
      cache: 'no-store',
      headers: {
        ...(init?.body ? { 'content-type': 'application/json' } : {}),
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const body = await readErrorBody(response);
      throw new InternalStockApiError(
        response.status,
        extractSafeProblemDetail(body, `Internal stock API request failed with ${response.status}.`),
      );
    }

    return response.json() as Promise<TResponse>;
  }

  return {
    readInventory(
      query: {
        q?: string;
        area?: string;
        format?: string | undefined;
        cursor?: string | undefined;
        before?: string | undefined;
        limit?: number;
      } = {},
    ) {
      return fetchJson<InternalApiComponents['schemas']['InventoryPage']>('/api/internal/inventory', undefined, query);
    },
    readPublication(variantId: string) {
      return fetchJson<CatalogItemPublishDetail>(`/api/internal/variants/${encodeURIComponent(variantId)}/publication`);
    },
    publishItem(variantId: string, body: CatalogItemPublishCommand) {
      return fetchJson<InternalApiComponents['schemas']['CatalogItemPublishResult']>(
        `/api/internal/variants/${encodeURIComponent(variantId)}/publication`,
        {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'X-Blackbox-Request': '1' },
        },
      );
    },
    setupItem(body: CatalogSetupCommand) {
      return fetchJson<InternalApiComponents['schemas']['CatalogItemSetupResult']>('/api/internal/items/setup', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'X-Blackbox-Request': '1' },
      });
    },
    readPrice(variantId: string) {
      return fetchJson<CatalogPriceDetail>(`/api/internal/variants/${encodeURIComponent(variantId)}/price`);
    },
    changePrice(variantId: string, body: CatalogPriceCommand) {
      return fetchJson<InternalApiComponents['schemas']['CatalogPriceChangeResult']>(
        `/api/internal/variants/${encodeURIComponent(variantId)}/price`,
        { method: 'POST', body: JSON.stringify(body), headers: { 'X-Blackbox-Request': '1' } },
      );
    },
    readStock(variantId: string) {
      return fetchJson<InternalStockDetail>(`/api/internal/variants/${encodeURIComponent(variantId)}/stock`);
    },
    readStockHistory(variantId: string, limit = 25) {
      return fetchJson<InternalStockHistoryResponse>(
        `/api/internal/variants/${encodeURIComponent(variantId)}/stock/history`,
        undefined,
        { limit },
      );
    },
    recordStockChange(variantId: string, body: InternalStockChangeBody) {
      return fetchJson<RecordedStockChangeResponse>(
        `/api/internal/variants/${encodeURIComponent(variantId)}/stock/changes`,
        {
          body: JSON.stringify(body),
          method: 'POST',
        },
      );
    },
    recordStockCount(variantId: string, body: InternalStockCountBody) {
      return fetchJson<RecordedStockCountResponse>(
        `/api/internal/variants/${encodeURIComponent(variantId)}/stock/counts`,
        {
          body: JSON.stringify(body),
          method: 'POST',
        },
      );
    },
    searchVariants(query = '', limit = 25) {
      return fetchJson<InternalVariantSummary[]>('/api/internal/variants', undefined, { limit, q: query });
    },
  };
}

async function readErrorBody(response: Response): Promise<BackendErrorResponse | { error?: unknown } | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as BackendErrorResponse | { error?: unknown };
  } catch {
    return null;
  }
}
