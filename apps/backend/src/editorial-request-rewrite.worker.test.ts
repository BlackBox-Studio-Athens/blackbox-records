import { applyD1Migrations, env } from 'cloudflare:test';
import type * as CloudflareWorkers from 'cloudflare:workers';
import { SchemaRegistry } from 'emdash';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';

const { forward } = vi.hoisted(() => ({ forward: vi.fn() }));
vi.mock('cloudflare:workers', async (importOriginal) => ({
  ...(await importOriginal<typeof CloudflareWorkers>()),
  // Reuse the checkpoint constructor fixture; Request and Headers remain native workerd APIs.
  DurableObject: class {
    constructor(
      public ctx: unknown,
      public env: unknown,
    ) {}
  },
}));
vi.mock('astro/fetch', () => ({
  FetchState: class {
    constructor(public request: Request) {}
  },
  astro: vi.fn(),
}));
vi.mock('@astrojs/cloudflare/fetch', () => ({ cf: forward, finalize: vi.fn() }));
vi.mock('emdash/middleware', () => ({
  withEmDashRuntime: (callback: (runtime: { db: unknown }) => unknown) => callback({ db: {} }),
}));

import { CmsRuntime } from './cms-worker';

beforeAll(async () => {
  await applyD1Migrations(env.TEST_CMS_DB, env.TEST_CMS_MIGRATIONS);
});
afterEach(() => vi.restoreAllMocks());

it.each([
  {
    method: 'POST',
    path: '/_emdash/api/content/artists',
    payload: { slug: 'native-artist', data: { title: 'Native artist', image: null, bio: '' } },
    expected: { slug: 'native-artist', data: { title: 'Native artist', bio: '' } },
  },
  {
    method: 'PUT',
    path: '/_emdash/api/content/releases/native-release',
    payload: { _rev: 'saved-revision', data: { title: 'Native release', artist: 'artist-one' } },
    expected: { _rev: 'saved-revision', data: { title: 'Native release' }, references: { artist: ['artist-one'] } },
  },
])(
  'forwards native $method $path with rewritten JSON and retained request identity',
  async ({ method, path, payload, expected }) => {
    const getField = vi.spyOn(SchemaRegistry.prototype, 'getField').mockResolvedValue({
      id: 'release-artist-field',
      collectionId: 'releases',
      slug: 'artist',
      label: 'Artist',
      type: 'reference',
      columnType: 'TEXT',
      required: false,
      unique: false,
      validation: { relation: 'release-artists' },
      sortOrder: 0,
      searchable: false,
      indexed: false,
      translatable: true,
      createdAt: '2026-09-01T00:00:00.000Z',
    });
    forward.mockReset().mockImplementation(async ({ request }: { request: Request }) =>
      Response.json({
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers),
        body: await request.text(),
      }),
    );
    const body = JSON.stringify(payload);
    const headers = {
      Origin: 'http://127.0.0.1',
      Authorization: 'Bearer native-rewrite-fixture',
      'Cf-Access-Jwt-Assertion': 'local-fixture-assertion',
      'X-EmDash-Request': '1',
      'X-Editorial-Test': 'retained',
      'Content-Type': 'application/json',
      'Content-Length': String(new TextEncoder().encode(body).byteLength),
    };
    const request = new Request(`http://127.0.0.1${path}`, { method, headers, body });
    const runtime = new CmsRuntime(
      {} as DurableObjectState,
      { ...env, CMS_DB: env.TEST_CMS_DB } as unknown as ConstructorParameters<typeof CmsRuntime>[1],
    );
    const response = await runtime.fetch(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(forward).toHaveBeenCalledOnce();
    const forwarded = await response.json();
    expect(forwarded).toEqual({
      method,
      url: request.url,
      headers: Object.fromEntries(
        Object.entries(headers)
          .filter(([name]) => name !== 'Content-Length')
          .map(([name, value]) => [name.toLowerCase(), value]),
      ),
      body: JSON.stringify(expected),
    });
    expect(request.headers.get('Content-Length')).toBe(headers['Content-Length']);
    if (method === 'PUT') expect(getField).toHaveBeenCalledExactlyOnceWith('releases', 'artist');
    else expect(getField).not.toHaveBeenCalled();
  },
);
