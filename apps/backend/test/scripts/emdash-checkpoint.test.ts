import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cms, orders, fetchCommerce, cmsAsset } = vi.hoisted(() => ({
  cms: vi.fn(),
  orders: vi.fn(),
  fetchCommerce: vi.fn(),
  cmsAsset: vi.fn(),
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
vi.mock('@astrojs/cloudflare/fetch', () => ({ cf: cmsAsset, finalize: vi.fn() }));
vi.mock('emdash/middleware', () => ({ runScheduledTasks: cms }));
vi.mock('../../src/index', () => ({ CommerceRuntime: class {}, default: { scheduled: orders, fetch: fetchCommerce } }));
vi.mock('../../src/cms/auth', () => ({ authenticate: vi.fn().mockRejectedValue(new Error('Unauthorized')) }));

import worker, { CmsRuntime } from '../../src/cms';
import { authenticate } from '../../src/cms/auth';

const thumbnailBytes = Uint8Array.from(
  Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
);

describe('EmDash checkpoint composition', () => {
  beforeEach(() => {
    vi.mocked(authenticate).mockReset().mockRejectedValue(new Error('Unauthorized'));
    cmsAsset.mockReset();
  });

  it('rejects member token administration before storage and restricts owner tokens to export reads', async () => {
    const prepare = vi.fn();
    const runtime = new CmsRuntime(
      {} as DurableObjectState,
      {
        PRODUCT_ENVIRONMENT: 'UAT',
        CMS_DB: { prepare },
      } as unknown as ConstructorParameters<typeof CmsRuntime>[1],
    );
    for (const role of [30, 50]) {
      vi.mocked(authenticate).mockResolvedValueOnce({ email: 'operator@example.com', name: 'Operator', role });
      const response = await runtime.fetch(
        new Request('https://staff.example/_emdash/api/admin/api-tokens', {
          method: 'POST',
          body: JSON.stringify({ name: 'Overbroad', scopes: ['admin'] }),
        }),
      );
      expect(response.status).toBe(role === 30 ? 403 : 400);
    }
    expect(prepare).not.toHaveBeenCalled();
  });

  it('keeps static assets out of the CMS object and never initializes an empty hosted CMS', async () => {
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
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not found');
    expect(assets).not.toHaveBeenCalled();
    expect(bindings.CMS_DB.prepare).not.toHaveBeenCalled();
    vi.mocked(authenticate).mockResolvedValueOnce({ email: 'member@example.com', name: 'Member', role: 30 });
    expect((await runtime.fetch(new Request('https://staff.example/_emdash/api/content/posts'))).status).toBe(503);
    await expect(runtime.runMaintenance()).rejects.toThrow('CMS requires explicit initialization');
    first.mockRejectedValueOnce(new Error('Missing schema'));
    vi.mocked(authenticate).mockResolvedValueOnce({ email: 'member@example.com', name: 'Member', role: 30 });
    expect((await runtime.fetch(new Request('https://staff.example/_emdash/api/content/posts'))).status).toBe(503);
  });

  it('routes authenticated staff static GET and HEAD requests directly to assets', async () => {
    vi.mocked(authenticate).mockReset().mockResolvedValue({ email: 'member@example.com', name: 'Member', role: 30 });
    const assets = vi.fn().mockResolvedValue(new Response('staff'));
    const cms = vi.fn().mockResolvedValue(new Response('cms'));
    const bindings = {
      PRODUCT_ENVIRONMENT: 'LOCAL',
      ASSETS: { fetch: assets },
      CMS_DB: { prepare: vi.fn() },
      CMS_RUNTIME: { getByName: vi.fn().mockReturnValue({ fetch: cms }) },
    } as unknown as Parameters<typeof worker.fetch>[1];

    for (const method of ['GET', 'HEAD']) {
      const request = new Request(`http://127.0.0.1/${method.toLowerCase()}.html`, { method });
      const response = await worker.fetch(request, bindings, {} as ExecutionContext);
      expect(response.status).toBe(200);
      expect(assets).toHaveBeenCalledExactlyOnceWith(request);
      expect(cms).not.toHaveBeenCalled();
      expect(bindings.CMS_DB.prepare).not.toHaveBeenCalled();
      assets.mockClear();
    }
    expect(authenticate).toHaveBeenCalledTimes(2);
  });

  it('denies static assets before the asset binding when identity verification fails', async () => {
    const assets = vi.fn().mockResolvedValue(new Response('staff'));
    const bindings = {
      PRODUCT_ENVIRONMENT: 'LOCAL',
      ASSETS: { fetch: assets },
    } as unknown as Parameters<typeof worker.fetch>[1];

    const response = await worker.fetch(new Request('http://127.0.0.1/stock/'), bindings, {} as ExecutionContext);
    expect(response.status).toBe(403);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(assets).not.toHaveBeenCalled();
  });

  it('serves private thumbnails with one R2 read and rejects malformed or token-export access', async () => {
    vi.mocked(authenticate).mockResolvedValue({ email: 'member@example.com', name: 'Member', role: 30 });
    const object = {
      body: {},
      arrayBuffer: vi.fn().mockResolvedValue(thumbnailBytes.buffer),
      size: thumbnailBytes.byteLength,
      httpMetadata: { contentType: 'image/png' },
      customMetadata: { version: '1', width: '1', height: '1' },
    };
    const get = vi.fn().mockResolvedValue(object);
    const head = vi.fn().mockResolvedValue(object);
    const media = { get, head };
    const bindings = {
      PRODUCT_ENVIRONMENT: 'LOCAL',
      MEDIA: media,
      ASSETS: { fetch: vi.fn() },
      CMS_RUNTIME: { getByName: vi.fn() },
    } as unknown as Parameters<typeof worker.fetch>[1];
    const path = 'http://127.0.0.1/_emdash/api/blackbox/thumbnails/cover.png';

    const response = await worker.fetch(new Request(path), bindings, {} as ExecutionContext);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('content-type')).toContain('image/png');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(thumbnailBytes);
    expect(get).toHaveBeenCalledExactlyOnceWith('staff-thumbnails/v1/cover.png.png');
    expect(head).not.toHaveBeenCalled();

    const headResponse = await worker.fetch(new Request(path, { method: 'HEAD' }), bindings, {} as ExecutionContext);
    expect(headResponse.status).toBe(200);
    expect((await headResponse.arrayBuffer()).byteLength).toBe(0);
    expect(head).toHaveBeenCalledExactlyOnceWith('staff-thumbnails/v1/cover.png.png');

    get.mockClear();
    head.mockClear();
    const malformed = await worker.fetch(
      new Request('http://127.0.0.1/_emdash/api/blackbox/thumbnails/cover%2Fother.png'),
      bindings,
      {} as ExecutionContext,
    );
    expect(malformed.status).toBe(400);
    expect(malformed.headers.get('cache-control')).toBe('private, no-store');
    expect(get).not.toHaveBeenCalled();
    expect(head).not.toHaveBeenCalled();

    get.mockResolvedValueOnce(null);
    const missing = await worker.fetch(new Request(path), bindings, {} as ExecutionContext);
    expect(missing.status).toBe(404);
    expect(missing.headers.get('cache-control')).toBe('private, no-store');
    get.mockClear();
    head.mockClear();

    const token = await worker.fetch(
      new Request(path, { headers: { Authorization: `Bearer ec_pat_${'a'.repeat(32)}` } }),
      bindings,
      {} as ExecutionContext,
    );
    expect(token.status).toBe(403);
    expect(get).not.toHaveBeenCalled();
    expect(head).not.toHaveBeenCalled();
  });

  it('keeps native media status and identity while storing only compatible post-upload derivatives', async () => {
    vi.mocked(authenticate).mockResolvedValue({ email: 'member@example.com', name: 'Member', role: 30 });
    const put = vi.fn().mockResolvedValue(undefined);
    const storageKey = '01JABC1234567890ABCDEF.png';
    const runtime = () =>
      new CmsRuntime(
        {} as DurableObjectState,
        {
          PRODUCT_ENVIRONMENT: 'LOCAL',
          MEDIA: { put },
          COMMERCE_DB: { prepare: vi.fn() },
        } as unknown as ConstructorParameters<typeof CmsRuntime>[1],
      );
    const uploadRequest = (thumbnail = thumbnailBytes) => {
      const form = new FormData();
      form.set('file', new File([thumbnailBytes], 'cover.png', { type: 'image/png' }));
      form.set('thumbnail', new File([thumbnail], 'thumbnail.png', { type: 'image/png' }));
      return new Request('http://127.0.0.1/_emdash/api/media', {
        method: 'POST',
        headers: { Origin: 'http://127.0.0.1', 'X-EmDash-Request': '1' },
        body: form,
      });
    };
    const native = (status: 200 | 201) =>
      Response.json({ success: true, data: { item: { id: 'media', storageKey } } }, { status });

    cmsAsset.mockResolvedValueOnce(native(201)).mockResolvedValueOnce(native(200));
    const first = await runtime().fetch(uploadRequest());
    const second = await runtime().fetch(uploadRequest());
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(((await first.json()) as { data: { item: { storageKey: string } } }).data.item.storageKey).toBe(storageKey);
    expect(((await second.json()) as { data: { item: { storageKey: string } } }).data.item.storageKey).toBe(storageKey);
    expect(put).toHaveBeenCalledTimes(2);
    expect(put.mock.calls[0][0]).toBe(`staff-thumbnails/v1/${storageKey}.png`);
    expect(put.mock.calls[0][2]).toMatchObject({
      httpMetadata: { contentType: 'image/png' },
      customMetadata: { version: '1', width: '1', height: '1' },
    });

    put.mockClear();
    cmsAsset.mockReset();
    const rejected = await runtime().fetch(
      new Request('http://127.0.0.1/_emdash/api/media', {
        method: 'POST',
        headers: { Origin: 'http://127.0.0.1', 'X-EmDash-Request': '1' },
        body: (() => {
          const form = new FormData();
          form.set('file', new File(['not an image'], 'cover.png', { type: 'image/png' }));
          return form;
        })(),
      }),
    );
    expect(rejected.status).toBe(400);
    expect(cmsAsset).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();

    const incompatible = new Uint8Array(thumbnailBytes);
    incompatible[19] = 97;
    cmsAsset.mockResolvedValueOnce(native(201));
    const incompatibleResponse = await runtime().fetch(uploadRequest(incompatible));
    expect(incompatibleResponse.status).toBe(201);
    expect(put).not.toHaveBeenCalled();

    put.mockRejectedValueOnce(new Error('MEDIA unavailable'));
    cmsAsset.mockResolvedValueOnce(native(201));
    const derivativeFailure = await runtime().fetch(uploadRequest());
    expect(derivativeFailure.status).toBe(201);
    expect(((await derivativeFailure.json()) as { data: { item: { storageKey: string } } }).data.item.storageKey).toBe(
      storageKey,
    );
  });

  it('keeps public, internal, workflow, export, and unsupported requests on their existing destinations', async () => {
    vi.mocked(authenticate).mockReset().mockResolvedValue({ email: 'member@example.com', name: 'Member', role: 30 });
    const commerce = vi.fn().mockResolvedValue(new Response('commerce'));
    const cms = vi.fn().mockResolvedValue(new Response('cms'));
    const assets = vi.fn().mockResolvedValue(new Response('assets'));
    const bindings = {
      PRODUCT_ENVIRONMENT: 'LOCAL',
      ASSETS: { fetch: assets },
      COMMERCE_RUNTIME: { getByName: vi.fn().mockReturnValue({ fetch: commerce }) },
      CMS_RUNTIME: { getByName: vi.fn().mockReturnValue({ fetch: cms }) },
    } as unknown as Parameters<typeof worker.fetch>[1];

    expect(
      (await worker.fetch(new Request('http://127.0.0.1/api/store/capabilities'), bindings, {} as ExecutionContext))
        .status,
    ).toBe(200);
    expect(
      (await worker.fetch(new Request('http://127.0.0.1/api/internal/variants'), bindings, {} as ExecutionContext))
        .status,
    ).toBe(200);
    expect(
      (
        await worker.fetch(
          new Request('http://127.0.0.1/_emdash/api/blackbox/publications/run', { method: 'POST' }),
          bindings,
          {} as ExecutionContext,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await worker.fetch(
          new Request('http://127.0.0.1/_emdash/api/media/file/cover.jpg', {
            headers: { Authorization: `Bearer ec_pat_${'a'.repeat(32)}` },
          }),
          bindings,
          {} as ExecutionContext,
        )
      ).status,
    ).toBe(200);
    expect(
      (await worker.fetch(new Request('http://127.0.0.1/stock/', { method: 'POST' }), bindings, {} as ExecutionContext))
        .status,
    ).toBe(200);
    expect(commerce).toHaveBeenCalledTimes(2);
    expect(cms).toHaveBeenCalledTimes(3);
    expect(assets).not.toHaveBeenCalled();
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
