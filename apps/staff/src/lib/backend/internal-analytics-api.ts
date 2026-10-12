import type { InternalApiComponents, InternalApiOperations } from '@blackbox/api-client/internal';
import { buildInternalStockApiUrl, readErrorBody } from './internal-stock-api';
import { extractSafeProblemDetail } from './problem-details';

export type SiteAnalytics = InternalApiComponents['schemas']['SiteAnalytics'];
export type SiteAnalyticsRange = InternalApiOperations['readSiteAnalytics']['parameters']['query']['range'];

const unavailable = 'Analytics is temporarily unavailable. Try again.';

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

export function createInternalAnalyticsApi({
  backendBaseUrl = '',
  fetcher = fetch,
}: { backendBaseUrl?: string; fetcher?: typeof fetch } = {}) {
  return {
    // `not_configured` is HTTP 200 data, not an error; callers render its own setup state.
    async readAnalytics(range: SiteAnalyticsRange): Promise<SiteAnalytics> {
      let response: Response;
      try {
        response = await fetcher(buildInternalStockApiUrl(backendBaseUrl, '/api/internal/analytics', { range }), {
          cache: 'no-store',
          credentials: 'same-origin',
        });
      } catch {
        throw new InternalAnalyticsApiError(0, 'Analytics could not be reached. Check your connection and try again.');
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
      const data = (await response.json().catch(() => null)) as SiteAnalytics | null;
      if (data?.status !== 'ok' && data?.status !== 'not_configured') {
        throw new InternalAnalyticsApiError(response.status, unavailable, headerId);
      }
      return data;
    },
  };
}
