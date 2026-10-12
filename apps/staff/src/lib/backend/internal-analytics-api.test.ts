import { describe, expect, it, vi } from 'vitest';

import { createInternalAnalyticsApi, InternalAnalyticsApiError, type SiteAnalytics } from './internal-analytics-api';

const notConfigured: SiteAnalytics = {
  range: '7d',
  generatedAt: null,
  status: 'not_configured',
  daily: [],
  topPaths: [],
  topReferrers: [],
  topCountries: [],
  deviceTypes: [],
};

const ok: SiteAnalytics = {
  ...notConfigured,
  generatedAt: '2026-10-12T14:00:00.000Z',
  status: 'ok',
  daily: [{ date: '2026-10-12', visits: 3, pageViews: 5 }],
  topReferrers: [{ host: '', visits: 2, pageViews: 3 }],
};

describe('createInternalAnalyticsApi', () => {
  it('reads a snapshot with private GET defaults', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => Response.json(ok));
    const api = createInternalAnalyticsApi({ backendBaseUrl: 'http://127.0.0.1:8787', fetcher });

    await expect(api.readAnalytics('30d')).resolves.toEqual(ok);
    expect(fetcher).toHaveBeenCalledWith('http://127.0.0.1:8787/api/internal/analytics?range=30d', {
      cache: 'no-store',
      credentials: 'same-origin',
    });
  });

  it('returns not_configured as data', async () => {
    const api = createInternalAnalyticsApi({ fetcher: async () => Response.json(notConfigured) });
    await expect(api.readAnalytics('7d')).resolves.toEqual(notConfigured);
  });

  it('maps the problem detail and request ID without the raw body', async () => {
    const problem = {
      type: '/problems/service_unavailable',
      title: 'Service unavailable.',
      status: 503,
      detail: 'Analytics is temporarily unavailable. Try again.',
      code: 'service_unavailable',
      error: 'Analytics is temporarily unavailable. Try again.',
      requestId: 'req_body',
    };
    const api = createInternalAnalyticsApi({
      fetcher: async () =>
        Response.json(problem, {
          status: 503,
          headers: { 'content-type': 'application/problem+json', 'X-Request-Id': 'req_header' },
        }),
    });

    const error = await api.readAnalytics('7d').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(InternalAnalyticsApiError);
    expect(error).toMatchObject({ status: 503, message: problem.detail, requestId: 'req_body' });
  });

  it('falls back to the header request ID for an unreadable error body', async () => {
    const api = createInternalAnalyticsApi({
      fetcher: async () =>
        new Response('<html>private upstream</html>', { status: 502, headers: { 'X-Request-Id': 'req_header' } }),
    });
    const error = await api.readAnalytics('7d').catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 502, requestId: 'req_header' });
    expect((error as Error).message).not.toContain('private upstream');
  });

  it('rejects an Access sign-in document returned as 200', async () => {
    const api = createInternalAnalyticsApi({ fetcher: async () => new Response('<html>Sign in</html>') });
    await expect(api.readAnalytics('7d')).rejects.toBeInstanceOf(InternalAnalyticsApiError);
  });

  it('maps a network failure to status 0', async () => {
    const api = createInternalAnalyticsApi({
      fetcher: async () => {
        throw new TypeError('Failed to fetch');
      },
    });
    await expect(api.readAnalytics('7d')).rejects.toMatchObject({ status: 0, requestId: undefined });
  });
});
