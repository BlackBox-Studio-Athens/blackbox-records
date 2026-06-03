import { describe, expect, it, vi } from 'vitest';

import {
  defaultHostedCacheAuditOverlayPath,
  defaultHostedCacheAuditSiteUrl,
  defaultHostedCacheAuditStoreItemSlug,
  defaultHostedCacheAuditWorkerUrl,
  extractFirstAstroAssetPath,
  formatHostedCacheAuditReport,
  parseHostedCacheAuditArgs,
  runHostedCacheAudit,
} from '../../scripts/check-hosted-cache-policy';

type HostedCachePolicyResponseInit = {
  status?: number;
  [header: string]: string | number | undefined;
};

function createResponse(body: BodyInit | null, init: HostedCachePolicyResponseInit = {}): Response {
  const { status = 200, ...headerValues } = init;
  const headers = new Map(
    Object.entries(headerValues)
      .filter(([, value]) => value !== undefined)
      .map(([name, value]) => [name.toLowerCase(), String(value)] as const),
  );

  return {
    headers: {
      get: (name: string) => headers.get(name.toLowerCase()) ?? null,
    } as Headers,
    ok: status >= 200 && status < 300,
    status,
    text: async () => String(body ?? ''),
    url: '',
  } as unknown as Response;
}

function createFetchStub(responses: Record<string, Response>) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const response = responses[url];

    if (!response) {
      throw new Error(`Unexpected fetch: ${url}`);
    }

    return response;
  });
}

describe('check-hosted-cache-policy', () => {
  it('parses explicit inputs for the hosted audit command', () => {
    expect(
      parseHostedCacheAuditArgs([
        '--site-url',
        'https://example.pages.dev/',
        '--worker-url=https://example.workers.dev/',
        '--store-item-slug',
        'demo-item',
        '--overlay-path',
        '/app-shell-overlay/releases/demo/',
        '--asset-url',
        'https://example.pages.dev/_astro/demo.css',
        '--timeout-ms',
        '2500',
      ]),
    ).toEqual({
      assetUrl: 'https://example.pages.dev/_astro/demo.css',
      overlayPath: '/app-shell-overlay/releases/demo/',
      siteUrl: 'https://example.pages.dev',
      storeItemSlug: 'demo-item',
      timeoutMs: 2500,
      workerUrl: 'https://example.workers.dev',
    });
  });

  it('extracts the first hashed Astro asset path from document HTML', () => {
    expect(
      extractFirstAstroAssetPath(
        '<html><head><link rel="stylesheet" href="/_astro/global.abc123.css"><script src="/_astro/app.def456.js"></script></head></html>',
      ),
    ).toBe('/_astro/global.abc123.css');
  });

  it('audits the bounded hosted cache policy surface with read-only fetches', async () => {
    const rootUrl = defaultHostedCacheAuditSiteUrl.endsWith('/')
      ? defaultHostedCacheAuditSiteUrl
      : `${defaultHostedCacheAuditSiteUrl}/`;
    const assetUrl = `${defaultHostedCacheAuditSiteUrl}/_astro/global.abc123.css`;
    const storeDocumentUrl = `${defaultHostedCacheAuditSiteUrl}/store/${defaultHostedCacheAuditStoreItemSlug}/`;
    const overlayUrl = `${defaultHostedCacheAuditSiteUrl}${defaultHostedCacheAuditOverlayPath}`;
    const capabilitiesUrl = `${defaultHostedCacheAuditWorkerUrl}/api/store/capabilities`;
    const storeOfferUrl = `${defaultHostedCacheAuditWorkerUrl}/api/store/items/${defaultHostedCacheAuditStoreItemSlug}`;

    const responses = {
      [rootUrl]: createResponse(
        '<html><head><link rel="stylesheet" href="/_astro/global.abc123.css"></head><body>BlackBox</body></html>',
        {
          'content-type': 'text/html; charset=utf-8',
        },
      ),
      [assetUrl]: createResponse('', {
        'cache-control': 'public, max-age=31536000, immutable',
        'content-type': 'text/css; charset=utf-8',
        etag: '"asset-etag"',
      }),
      [storeDocumentUrl]: createResponse('', {
        'cache-control': 'public, max-age=0, must-revalidate',
        'content-type': 'text/html; charset=utf-8',
      }),
      [overlayUrl]: createResponse('', {
        'cache-control': 'public, max-age=0, must-revalidate',
        'content-type': 'text/html; charset=utf-8',
      }),
      [capabilitiesUrl]: createResponse(
        JSON.stringify({
          nativeCheckout: {
            enabled: false,
            unavailableReason: 'disabled',
          },
        }),
        {
          'cache-control': 'no-store',
          'content-type': 'application/json',
        },
      ),
      [storeOfferUrl]: createResponse(
        JSON.stringify({
          availability: {
            label: 'Sold out',
            status: 'sold_out',
          },
          canCheckout: false,
          catalogStatus: 'sold_out',
          price: null,
          storeItemSlug: defaultHostedCacheAuditStoreItemSlug,
          variantId: 'variant-123',
        }),
        {
          'cache-control': 'no-store',
          'content-type': 'application/json',
        },
      ),
    };

    const fetchStub = createFetchStub(responses);

    const run = await runHostedCacheAudit(
      {
        overlayPath: defaultHostedCacheAuditOverlayPath,
        siteUrl: defaultHostedCacheAuditSiteUrl,
        storeItemSlug: defaultHostedCacheAuditStoreItemSlug,
        timeoutMs: 2500,
        workerUrl: defaultHostedCacheAuditWorkerUrl,
      },
      fetchStub,
    );

    expect(run.requestCount).toBe(6);
    expect(run.issues).toEqual([]);
    expect(run.discoveryNote).toContain('Discovered hashed asset');
    expect(fetchStub).toHaveBeenCalledTimes(6);

    const report = formatHostedCacheAuditReport(run);
    expect(report).toContain('Request budget: 6 requests max; this run used 6.');
    expect(report).toContain('[Hashed Astro asset]');
    expect(report).toContain('cache-control: public, max-age=31536000, immutable');
    expect(report).toContain('touches worker: yes');
    expect(report).toContain('touches D1: yes');
  });

  it('collects policy issues when a worker response is missing no-store', async () => {
    const rootUrl = defaultHostedCacheAuditSiteUrl.endsWith('/')
      ? defaultHostedCacheAuditSiteUrl
      : `${defaultHostedCacheAuditSiteUrl}/`;
    const assetUrl = `${defaultHostedCacheAuditSiteUrl}/_astro/global.abc123.css`;
    const storeDocumentUrl = `${defaultHostedCacheAuditSiteUrl}/store/${defaultHostedCacheAuditStoreItemSlug}/`;
    const overlayUrl = `${defaultHostedCacheAuditSiteUrl}${defaultHostedCacheAuditOverlayPath}`;
    const capabilitiesUrl = `${defaultHostedCacheAuditWorkerUrl}/api/store/capabilities`;
    const storeOfferUrl = `${defaultHostedCacheAuditWorkerUrl}/api/store/items/${defaultHostedCacheAuditStoreItemSlug}`;

    const fetchStub = createFetchStub({
      [rootUrl]: createResponse('<html><head><link rel="stylesheet" href="/_astro/global.abc123.css"></head></html>', {
        'content-type': 'text/html; charset=utf-8',
      }),
      [assetUrl]: createResponse('', {
        'cache-control': 'public, max-age=31536000, immutable',
      }),
      [storeDocumentUrl]: createResponse('', {
        'cache-control': 'public, max-age=0, must-revalidate',
      }),
      [overlayUrl]: createResponse('', {
        'cache-control': 'public, max-age=0, must-revalidate',
      }),
      [capabilitiesUrl]: createResponse('{}', {
        'content-type': 'application/json',
      }),
      [storeOfferUrl]: createResponse('{}', {
        'cache-control': 'no-store',
        'content-type': 'application/json',
      }),
    });

    const run = await runHostedCacheAudit(
      {
        overlayPath: defaultHostedCacheAuditOverlayPath,
        siteUrl: defaultHostedCacheAuditSiteUrl,
        storeItemSlug: defaultHostedCacheAuditStoreItemSlug,
        timeoutMs: 2500,
        workerUrl: defaultHostedCacheAuditWorkerUrl,
      },
      fetchStub,
    );

    expect(run.issues).toContain('Expected Cache-Control: no-store for the store capabilities response.');
    expect(formatHostedCacheAuditReport(run)).toContain('issues found');
  });
});
