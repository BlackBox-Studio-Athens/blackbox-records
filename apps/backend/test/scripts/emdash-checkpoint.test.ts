import { describe, expect, it, vi } from 'vitest';

const { cms, orders, fetchCommerce } = vi.hoisted(() => ({
  cms: vi.fn(),
  orders: vi.fn(),
  fetchCommerce: vi.fn(),
}));
vi.mock('astro/fetch', () => ({ astro: vi.fn(), FetchState: vi.fn() }));
vi.mock('cloudflare:workers', () => ({
  DurableObject: class {
    constructor(
      public ctx: unknown,
      public env: unknown,
    ) {}
  },
}));
vi.mock('@astrojs/cloudflare/fetch', () => ({ cf: vi.fn(), finalize: vi.fn() }));
vi.mock('emdash/middleware', () => ({ runScheduledTasks: cms }));
vi.mock('../../src/index', () => ({ CommerceRuntime: class {}, default: { scheduled: orders, fetch: fetchCommerce } }));
vi.mock('../../src/cms/auth', () => ({ authenticate: vi.fn().mockRejectedValue(new Error('Unauthorized')) }));

import worker, { CmsRuntime } from '../../src/cms';
import { authenticate } from '../../src/cms/auth';

describe('EmDash checkpoint composition', () => {
  it('serves staff assets only after authentication and never initializes an empty hosted CMS', async () => {
    const assets = vi.fn().mockResolvedValue(new Response('staff'));
    const first = vi.fn().mockResolvedValue(null);
    const bindings = {
      PRODUCT_ENVIRONMENT: 'UAT',
      ASSETS: { fetch: assets },
      CMS_DB: { prepare: vi.fn().mockReturnValue({ first }) },
    } as unknown as ConstructorParameters<typeof CmsRuntime>[1];
    const runtime = new CmsRuntime({} as DurableObjectState, bindings);
    expect((await runtime.fetch(new Request('https://staff.example/stock/'))).status).toBe(403);
    expect(assets).not.toHaveBeenCalled();
    vi.mocked(authenticate).mockResolvedValueOnce({ email: 'member@example.com', name: 'Member', role: 30 });
    const response = await runtime.fetch(new Request('https://staff.example/stock/'));
    expect(await response.text()).toBe('staff');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(bindings.CMS_DB.prepare).not.toHaveBeenCalled();
    vi.mocked(authenticate).mockResolvedValueOnce({ email: 'member@example.com', name: 'Member', role: 30 });
    expect((await runtime.fetch(new Request('https://staff.example/_emdash/api/content/posts'))).status).toBe(503);
    await expect(runtime.runMaintenance()).rejects.toThrow('CMS requires explicit initialization');
    first.mockRejectedValueOnce(new Error('Missing schema'));
    vi.mocked(authenticate).mockResolvedValueOnce({ email: 'member@example.com', name: 'Member', role: 30 });
    expect((await runtime.fetch(new Request('https://staff.example/_emdash/api/content/posts'))).status).toBe(503);
  });
  it('routes checkout to commerce without invoking the CMS or consuming its CPU allowance', async () => {
    const request = new Request('https://shop.example/api/checkout/sessions', { method: 'POST', body: '{}' });
    const fetch = vi.fn().mockResolvedValue(new Response('checkout', { status: 200 }));
    const bindings = {
      COMMERCE_RUNTIME: { getByName: vi.fn().mockReturnValue({ fetch }) },
      CMS_RUNTIME: { getByName: vi.fn() },
    };
    const response = await worker.fetch(
      request,
      bindings as unknown as Parameters<typeof worker.fetch>[1],
      {} as ExecutionContext,
    );
    expect(await response.text()).toBe('checkout');
    expect(fetch).toHaveBeenCalledExactlyOnceWith(request);
    expect(bindings.CMS_RUNTIME.getByName).not.toHaveBeenCalled();
  });

  it.each(['invoke', 'binding'])(
    'runs paid-order delivery even when CMS %s fails, and reports the failure',
    async (failurePoint) => {
      const failure = new Error('CMS unavailable');
      cms.mockReset();
      orders.mockClear();
      cms.mockRejectedValueOnce(failure);
      orders.mockResolvedValueOnce(undefined);
      const controller = { scheduledTime: 1234 } as ScheduledController;
      const bindings = {
        PRODUCT_ENVIRONMENT: 'LOCAL',
        CMS_RUNTIME: {
          getByName: () => {
            if (failurePoint === 'binding') throw failure;
            return { runMaintenance: cms };
          },
        },
      } as unknown as Parameters<typeof worker.scheduled>[1];

      await expect(worker.scheduled(controller, bindings)).rejects.toMatchObject({ errors: [failure] });
      expect(orders).toHaveBeenCalledExactlyOnceWith(controller, bindings);
    },
  );

  it.each([
    'https://alias.example/_emdash/api/content/posts',
    'https://alias.example/_astro/private.js',
    'https://alias.example/checkpoint.html',
    'https://alias.example/api/internal/variants',
  ])('rejects alternate hosts before CMS or asset handling: %s', async (url) => {
    const response = await worker.fetch(
      new Request(url),
      {
        PRODUCT_ENVIRONMENT: 'LOCAL',
      } as Parameters<typeof worker.fetch>[1],
      {} as ExecutionContext,
    );
    expect(response.status).toBe(403);
  });

  it.each(['orders', 'cms', 'publication'] as const)(
    'isolates scheduled %s failure from the other work',
    async (failed) => {
      const publication = vi.fn().mockResolvedValue({ status: 'idle' });
      orders.mockReset().mockResolvedValue(undefined);
      cms.mockReset().mockResolvedValue(undefined);
      const failure = new Error('Scheduled operation unavailable');
      ({ orders, cms, publication })[failed].mockRejectedValueOnce(failure);
      const bindings = {
        CMS_PUBLICATION_GITHUB_TOKEN: 'fake-github-test-token',
        CMS_PUBLICATION_EXPORT_TOKEN: 'a'.repeat(64),
        CMS_RUNTIME: { getByName: () => ({ runMaintenance: cms, dispatchPublication: publication }) },
      } as unknown as Parameters<typeof worker.scheduled>[1];
      await expect(worker.scheduled({} as ScheduledController, bindings)).rejects.toMatchObject({ errors: [failure] });
      expect(orders).toHaveBeenCalledTimes(1);
      expect(cms).toHaveBeenCalledTimes(1);
      expect(publication).toHaveBeenCalledTimes(1);
    },
  );
});
