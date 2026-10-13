import type { InternalApiComponents, InternalApiOperations } from '@blackbox/api-client/internal';
import { buildInternalStockApiUrl, readErrorBody } from './internal-stock-api';
import { extractSafeProblemDetail } from './problem-details';

export type SiteAnalytics = InternalApiComponents['schemas']['SiteAnalytics'];
export type StoreStats = InternalApiComponents['schemas']['StoreStats'];
export type SearchStats = InternalApiComponents['schemas']['SearchStats'];
export type SiteAnalyticsRange = InternalApiOperations['readSiteAnalytics']['parameters']['query']['range'];

const unreachable = 'Stats could not be reached. Check your connection and try again.';

export class InternalAnalyticsApiError extends Error {
  readonly status: number;
  readonly requestId: string | undefined;

  constructor(status: number, message: string, requestId?: string) {
    super(message);
    this.name = 'InternalAnalyticsApiError';
    this.status = status;
    this.requestId = requestId;
  }
}

const hasStatus = (data: { status?: unknown } | null) => data?.status === 'ok' || data?.status === 'not_configured';

export function createInternalAnalyticsApi({
  backendBaseUrl = '',
  fetcher = fetch,
}: { backendBaseUrl?: string; fetcher?: typeof fetch } = {}) {
  async function read<T>(
    path: string,
    range: SiteAnalyticsRange,
    unavailable: string,
    valid: (data: T | null) => boolean,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetcher(buildInternalStockApiUrl(backendBaseUrl, path, { range }), {
        cache: 'no-store',
        credentials: 'same-origin',
      });
    } catch {
      throw new InternalAnalyticsApiError(0, unreachable);
    }

    const headerId = response.headers.get('X-Request-Id') ?? undefined;
    if (!response.ok) {
      const body = await readErrorBody(response);
      const bodyId = (body as { requestId?: unknown } | null)?.requestId;
      throw new InternalAnalyticsApiError(
        response.status,
        extractSafeProblemDetail(body, unavailable),
        typeof bodyId === 'string' && bodyId ? bodyId : headerId,
      );
    }

    // An Access sign-in document can arrive as 200 HTML; never treat it as figures.
    const data = (await response.json().catch(() => null)) as T | null;
    if (!valid(data)) throw new InternalAnalyticsApiError(response.status, unavailable, headerId);
    return data!;
  }

  return {
    // `not_configured` is HTTP 200 data, not an error; callers render its own setup state.
    readAnalytics: (range: SiteAnalyticsRange) =>
      read<SiteAnalytics>(
        '/api/internal/analytics',
        range,
        'Analytics is temporarily unavailable. Try again.',
        hasStatus,
      ),
    readStoreStats: (range: SiteAnalyticsRange) =>
      read<StoreStats>(
        '/api/internal/store-stats',
        range,
        'Store figures are temporarily unavailable. Try again.',
        (data) => typeof data?.current?.paidOrders === 'number' && typeof data.previous?.paidOrders === 'number',
      ),
    readSearchStats: (range: SiteAnalyticsRange) =>
      read<SearchStats>(
        '/api/internal/search-stats',
        range,
        'Search figures are temporarily unavailable. Try again.',
        hasStatus,
      ),
  };
}
