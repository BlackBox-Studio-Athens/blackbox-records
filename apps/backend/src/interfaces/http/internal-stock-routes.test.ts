import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER, CF_ACCESS_JWT_ASSERTION_HEADER } from './auth';
import { createHttpApp } from './app';

const LOCAL_ENV = {
  PRODUCT_ENVIRONMENT: 'LOCAL' as const,
  COMMERCE_DB: {} as D1Database,
  LOCAL_OPERATOR_EMAIL: 'operator@blackboxrecords.example',
};
const HOSTED_ENV = {
  PRODUCT_ENVIRONMENT: 'UAT' as const,
  COMMERCE_DB: {} as D1Database,
  CF_ACCESS_POLICY_AUD: 'operator-audience',
  CF_ACCESS_TEAM_DOMAIN: 'https://blackbox.cloudflareaccess.com',
};

const mockDisconnect = vi.fn(async () => {});
const mockSearchVariants = vi.fn();
const mockReadInventory = vi.fn();
const mockReadVariantStock = vi.fn();
const mockReadVariantStockHistory = vi.fn();
const mockRecordStockChange = vi.fn();
const mockRecordStockCount = vi.fn();
const mockSetStockPreorder = vi.fn();
const mockSetZeroStockState = vi.fn();
const VariantNotFoundError = class VariantNotFoundError extends Error {};
const InvalidStockOperationError = class InvalidStockOperationError extends Error {};
const StockConflictError = class StockConflictError extends Error {};
const StockIdempotencyConflictError = class StockIdempotencyConflictError extends Error {};
const mockCreateInternalStockServices = vi.fn();

function expectNoStoreCacheControl(response: Response): void {
  expect(response.headers.get('Cache-Control')).toBe('no-store');
}

vi.mock('./stock/internal-stock-services', () => ({
  createInternalStockServices: (...args: unknown[]) => {
    mockCreateInternalStockServices(...args);

    return {
      disconnect: mockDisconnect,
      errors: {
        StockConflictError,
        StockIdempotencyConflictError,
        InvalidStockOperationError,
        VariantNotFoundError,
      },
      readVariantStock: mockReadVariantStock,
      readVariantStockHistory: mockReadVariantStockHistory,
      recordStockChange: mockRecordStockChange,
      recordStockCount: mockRecordStockCount,
      setStockPreorder: mockSetStockPreorder,
      setZeroStockState: mockSetZeroStockState,
      searchVariants: mockSearchVariants,
      readInventory: mockReadInventory,
    };
  },
}));

describe('internal stock routes', () => {
  it('returns the pre-order state and action, rejects stale revisions and protects hosted writes', async () => {
    const app = createHttpApp();
    const url = 'http://127.0.0.1/api/internal/variants/variant_test/stock/preorder';
    const shipEstimate = { kind: 'month', month: '2099-10', part: null };
    const body = { expectedRevision: 0, shipEstimate };
    const request = { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
    mockReadVariantStock.mockResolvedValueOnce({
      availableOnlineQuantity: 0,
      heldQuantity: 6,
      sourceId: 'test',
      sourceKind: 'release',
      storeItemSlug: 'test',
      variantId: 'variant_test',
      stock: {
        revision: 1,
        quantity: 3,
        onlineQuantity: 3,
        zeroStockState: 'sold_out',
        expectedMonth: null,
        showLowStock: false,
        preorder: { shipEstimate, startedAt: '2026-10-02T10:00:00.000Z' },
        updatedAt: new Date('2026-10-02T10:00:00Z'),
      },
    });
    const response = await app.request(url, request, LOCAL_ENV);
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    const result = (await response.json()) as {
      availableOnlineQuantity?: number;
      heldQuantity?: number;
      stock: unknown;
      actions: unknown[];
    };
    expect(result.availableOnlineQuantity).toBe(0);
    expect(result.heldQuantity).toBe(6);
    expect(result.stock).toMatchObject({ preorder: { shipEstimate, open: true } });
    expect(result.actions).toContainEqual(
      expect.objectContaining({
        rel: 'set-stock-preorder',
        operationRef: 'setStockPreorder',
        method: 'PATCH',
        href: '/api/internal/variants/variant_test/stock/preorder',
        parameters: { path: { variantId: 'variant_test' }, body: { expectedRevision: 1 } },
      }),
    );
    expect(mockSetStockPreorder).toHaveBeenCalledWith({ ...body, variantId: 'variant_test' });
    mockSetStockPreorder.mockRejectedValueOnce(new StockConflictError('Stock changed.'));
    expect((await app.request(url, request, LOCAL_ENV)).status).toBe(409);
    mockSetStockPreorder.mockRejectedValueOnce(new InvalidStockOperationError('Date has passed.'));
    expect((await app.request(url, request, LOCAL_ENV)).status).toBe(400);
    mockSetStockPreorder.mockRejectedValueOnce(new VariantNotFoundError());
    expect((await app.request(url, request, LOCAL_ENV)).status).toBe(404);
    expect((await app.request(url, { ...request, body: JSON.stringify({ shipEstimate }) }, LOCAL_ENV)).status).toBe(
      400,
    );
    expect(
      (await app.request(url.replace('http://127.0.0.1', 'https://ops.example'), request, HOSTED_ENV)).status,
    ).toBe(401);
  });
  it('saves the zero-stock state, returns it with the waiting count and rejects invalid or stale writes', async () => {
    const app = createHttpApp();
    const url = 'http://127.0.0.1/api/internal/variants/variant_test/stock/zero-stock-state';
    const body = { expectedRevision: 1, zeroStockState: 'coming_soon', expectedMonth: '2099-11' };
    const request = (payload: unknown) => ({
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    mockReadVariantStock.mockResolvedValueOnce({
      availabilityAlertCount: 3,
      sourceId: 'test',
      sourceKind: 'release',
      storeItemSlug: 'test',
      variantId: 'variant_test',
      stock: {
        revision: 2,
        quantity: 0,
        onlineQuantity: 0,
        zeroStockState: 'coming_soon',
        expectedMonth: '2099-11',
        showLowStock: false,
        preorder: null,
        updatedAt: new Date('2026-10-02T10:00:00Z'),
      },
    });

    const response = await app.request(url, request(body), LOCAL_ENV);

    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    expect(mockSetZeroStockState).toHaveBeenCalledWith({ ...body, variantId: 'variant_test' });
    const result = (await response.json()) as { availabilityAlertCount: number; stock: unknown; actions: unknown[] };
    expect(result.availabilityAlertCount).toBe(3);
    expect(result.stock).toMatchObject({ zeroStockState: 'coming_soon', expectedMonth: '2099-11' });
    expect(result.actions).toContainEqual(
      expect.objectContaining({
        rel: 'set-zero-stock-state',
        operationRef: 'setZeroStockState',
        method: 'PATCH',
        href: '/api/internal/variants/variant_test/stock/zero-stock-state',
        parameters: { path: { variantId: 'variant_test' }, body: { expectedRevision: 2 } },
      }),
    );
    expect(JSON.stringify(result)).not.toMatch(/restock/i);

    mockSetZeroStockState.mockRejectedValueOnce(new StockConflictError('Stock changed.'));
    expect((await app.request(url, request(body), LOCAL_ENV)).status).toBe(409);
    mockSetZeroStockState.mockRejectedValueOnce(new InvalidStockOperationError('Month has passed.'));
    expect((await app.request(url, request(body), LOCAL_ENV)).status).toBe(400);
    mockSetZeroStockState.mockRejectedValueOnce(new VariantNotFoundError());
    expect((await app.request(url, request(body), LOCAL_ENV)).status).toBe(404);
    mockSetZeroStockState.mockClear();
    for (const invalid of [
      { ...body, expectedMonth: '2099-13' },
      { ...body, zeroStockState: 'out_of_stock' },
      { expectedRevision: 1, zeroStockState: 'sold_out' },
      { expectedRevision: 1, restockPlanned: true },
    ]) {
      expect((await app.request(url, request(invalid), LOCAL_ENV)).status).toBe(400);
    }
    expect(mockSetZeroStockState).not.toHaveBeenCalled();
    expect(
      (await app.request(url.replace('stock/zero-stock-state', 'stock/restock-plan'), request(body), LOCAL_ENV)).status,
    ).toBe(404);
    expect(
      (await app.request(url.replace('http://127.0.0.1', 'https://ops.example'), request(body), HOSTED_ENV)).status,
    ).toBe(401);
  });

  it('derives the open flag from the Athens day on every stock read', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-31T22:30:00Z'));
    try {
      const app = createHttpApp();
      const detail = {
        sourceId: 'test',
        sourceKind: 'release',
        storeItemSlug: 'test',
        variantId: 'variant_test',
        stock: {
          revision: 1,
          quantity: 3,
          onlineQuantity: 3,
          zeroStockState: 'sold_out',
          expectedMonth: null,
          showLowStock: false,
          updatedAt: new Date(),
        },
      };
      for (const [shipEstimate, open] of [
        [{ kind: 'month', month: '2026-10', part: null }, true],
        [{ kind: 'date', date: '2026-11-01' }, false],
        [{ kind: 'date', date: '2026-11-02' }, true],
      ] as const) {
        const preorder = { shipEstimate, startedAt: '2026-09-01T10:00:00.000Z' };
        mockReadVariantStock.mockResolvedValueOnce({ ...detail, stock: { ...detail.stock, preorder } });
        const response = await app.request(
          'http://127.0.0.1/api/internal/variants/variant_test/stock',
          undefined,
          LOCAL_ENV,
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ stock: { preorder: { ...preorder, open } } });
      }
    } finally {
      vi.useRealTimers();
    }
  });
  it('protects inventory access and validates pagination before reading', async () => {
    const app = createHttpApp();
    expect((await app.request('https://ops.example/api/internal/inventory', undefined, HOSTED_ENV)).status).toBe(401);
    expect(
      (await app.request('http://127.0.0.1/api/internal/inventory?cursor=invalid', undefined, LOCAL_ENV)).status,
    ).toBe(400);
    expect(mockReadInventory).not.toHaveBeenCalled();
    mockReadInventory.mockResolvedValueOnce({ items: [], before: '2026-01-01T00:00:00Z' });
    const response = await app.request(
      'http://127.0.0.1/api/internal/inventory?area=merch&limit=25',
      undefined,
      LOCAL_ENV,
    );
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    expect(mockReadInventory).toHaveBeenCalledWith({ area: 'merch', limit: 25, q: '' });
  });
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([undefined, -1, 1.5, '0', {}, true])(
    'rejects malformed or omitted recount revision %j',
    async (expectedRevision) => {
      const response = await createHttpApp().request(
        'http://127.0.0.1/api/internal/variants/variant_test/stock/counts',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ countedQuantity: 1, onlineQuantity: 1, expectedRevision }),
        },
        LOCAL_ENV,
      );
      expect(response.status).toBe(400);
      expect(mockRecordStockCount).not.toHaveBeenCalled();
    },
  );

  it.each([null, 0, 7])('returns a safe 409 for a valid mismatched revision %j', async (expectedRevision) => {
    mockRecordStockCount.mockRejectedValueOnce(new StockConflictError('Stock changed. Reassess the count.'));
    const response = await createHttpApp().request(
      'http://127.0.0.1/api/internal/variants/variant_test/stock/counts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          countedQuantity: 1,
          onlineQuantity: 1,
          expectedRevision,
          actorEmail: 'attacker@example.com',
        }),
      },
      LOCAL_ENV,
    );
    expect(response.status).toBe(409);
    expectNoStoreCacheControl(response);
    expect(mockRecordStockCount).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedRevision,
        actorEmail: LOCAL_ENV.LOCAL_OPERATOR_EMAIL,
      }),
    );
    await expect(response.json()).resolves.toMatchObject({ code: 'stock_conflict' });
  });

  it('rejects a hosted request without an Access assertion before service construction', async () => {
    const app = createHttpApp();

    const response = await app.request('https://ops.example/api/internal/variants', undefined, HOSTED_ENV);

    expect(response.status).toBe(401);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toMatchObject({
      type: '/problems/unauthorized',
      title: 'Unauthorized.',
      status: 401,
      detail: 'Unauthorized.',
      code: 'unauthorized',
      error: 'Unauthorized.',
      requestId: expect.any(String),
    });
    expect(mockCreateInternalStockServices).not.toHaveBeenCalled();
    expect(mockSearchVariants).not.toHaveBeenCalled();
  });

  it('lists variants for operators on the protected internal surface', async () => {
    mockSearchVariants.mockResolvedValueOnce([
      {
        sourceId: 'disintegration',
        sourceKind: 'release',
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
    ]);

    const app = createHttpApp();
    const response = await app.request(
      'http://127.0.0.1/api/internal/variants?q=barren&limit=10',
      undefined,
      LOCAL_ENV,
    );

    expect(mockSearchVariants).toHaveBeenCalledWith('barren', 10);
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    expect(response.headers.get('Link')).toContain('</api/internal/openapi.json>');
    await expect(response.json()).resolves.toEqual([
      {
        sourceId: 'disintegration',
        sourceKind: 'release',
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
        links: [
          {
            href: '/api/internal/variants/variant_disintegration-black-vinyl-lp_standard/stock',
            rel: 'self',
            type: 'application/json',
          },
          {
            href: '/api/internal/variants/variant_disintegration-black-vinyl-lp_standard/stock/history',
            rel: 'history',
            type: 'application/json',
          },
          {
            href: '/api/internal/variants/variant_disintegration-black-vinyl-lp_standard/price',
            rel: 'price',
            type: 'application/json',
          },
          {
            href: '/api/internal/variants/variant_disintegration-black-vinyl-lp_standard/publication',
            rel: 'publication',
            type: 'application/json',
          },
        ],
      },
    ]);
  });

  it('returns current stock detail for a known variant', async () => {
    mockReadVariantStock.mockResolvedValueOnce({
      sourceId: 'disintegration',
      sourceKind: 'release',
      stock: {
        revision: 4,
        onlineQuantity: 2,
        quantity: 3,
        updatedAt: new Date('2026-04-24T12:00:00.000Z'),
      },
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });

    const app = createHttpApp();
    const response = await app.request(
      'http://127.0.0.1/api/internal/variants/variant_disintegration-black-vinyl-lp_standard/stock',
      undefined,
      LOCAL_ENV,
    );

    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toMatchObject({
      sourceId: 'disintegration',
      sourceKind: 'release',
      stock: {
        revision: 4,
        onlineQuantity: 2,
        quantity: 3,
        updatedAt: '2026-04-24T12:00:00.000Z',
      },
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
      links: expect.arrayContaining([
        expect.objectContaining({ rel: 'self' }),
        expect.objectContaining({ rel: 'history' }),
        expect.objectContaining({ rel: 'price' }),
        expect.objectContaining({ rel: 'publication' }),
      ]),
      actions: expect.arrayContaining([
        expect.objectContaining({ operationRef: 'recordStockChange', method: 'POST' }),
        expect.objectContaining({ operationRef: 'recordStockCount', method: 'POST' }),
      ]),
    });
  });

  it('protects operator discovery and publishes resolvable stock actions', async () => {
    const app = createHttpApp();
    expect((await app.request('https://ops.example/api/internal/', undefined, HOSTED_ENV)).status).toBe(401);

    const discovery = await app.request('http://127.0.0.1/api/internal/', undefined, LOCAL_ENV);
    expect(discovery.status).toBe(200);
    expectNoStoreCacheControl(discovery);
    expect(await discovery.json()).toMatchObject({
      links: expect.arrayContaining([
        expect.objectContaining({ href: '/api/internal/openapi.json', rel: 'service-desc' }),
        expect.objectContaining({ href: '/api/internal/variants', rel: 'variants' }),
      ]),
    });

    const description = await app.request('http://127.0.0.1/api/internal/openapi.json', undefined, LOCAL_ENV);
    expect(description.status).toBe(200);
    const document = (await description.json()) as { paths: Record<string, unknown> };
    expect(document.paths['/api/internal/variants/{variantId}/stock']).toBeDefined();
    expect(document.paths['/api/store/']).toBeUndefined();
  });

  it('attributes stock changes to the Access-authenticated operator email', async () => {
    mockRecordStockChange.mockResolvedValueOnce({
      entry: {
        actorEmail: 'operator@blackboxrecords.example',
        id: 'change_1',
        notes: 'Packed for table',
        quantityDelta: -1,
        reason: 'show_sale',
        recordedAt: new Date('2026-04-24T12:05:00.000Z'),
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
      stock: {
        revision: 5,
        createdAt: new Date('2026-04-24T10:00:00.000Z'),
        onlineQuantity: 1,
        quantity: 2,
        updatedAt: new Date('2026-04-24T12:05:00.000Z'),
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
    });

    const app = createHttpApp();
    const response = await app.request(
      'http://127.0.0.1/api/internal/variants/variant_disintegration-black-vinyl-lp_standard/stock/changes',
      {
        body: JSON.stringify({
          delta: -1,
          notes: 'Packed for table',
          reason: 'show_sale',
        }),
        headers: {
          [CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER]: 'attacker@blackboxrecords.example',
          'content-type': 'application/json',
        },
        method: 'POST',
      },
      LOCAL_ENV,
    );

    expect(mockRecordStockChange).toHaveBeenCalledWith({
      actorEmail: 'operator@blackboxrecords.example',
      idempotencyKey: undefined,
      notes: 'Packed for table',
      productEnvironment: 'LOCAL',
      quantityDelta: -1,
      reason: 'show_sale',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });
    expect(response.status).toBe(200);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      entry: {
        actorEmail: 'operator@blackboxrecords.example',
        id: 'change_1',
        notes: 'Packed for table',
        quantityDelta: -1,
        reason: 'show_sale',
        recordedAt: '2026-04-24T12:05:00.000Z',
        type: 'change',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
      stock: {
        revision: 5,
        onlineQuantity: 1,
        quantity: 2,
        preorder: null,
        updatedAt: '2026-04-24T12:05:00.000Z',
      },
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
      links: expect.arrayContaining([
        expect.objectContaining({ rel: 'self' }),
        expect.objectContaining({ rel: 'history' }),
        expect.objectContaining({ rel: 'price' }),
        expect.objectContaining({ rel: 'publication' }),
      ]),
    });
  });

  it('forwards the UUIDv4 Idempotency-Key for stock changes', async () => {
    mockRecordStockChange.mockResolvedValueOnce({
      entry: {
        actorEmail: LOCAL_ENV.LOCAL_OPERATOR_EMAIL,
        id: 'change_keyed',
        notes: null,
        quantityDelta: 1,
        reason: 'show_sale',
        recordedAt: new Date('2026-04-24T12:05:00.000Z'),
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
      stock: {
        revision: 5,
        createdAt: new Date('2026-04-24T10:00:00.000Z'),
        onlineQuantity: 3,
        quantity: 4,
        updatedAt: new Date('2026-04-24T12:05:00.000Z'),
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
    });

    const response = await createHttpApp().request(
      'http://127.0.0.1/api/internal/variants/variant_disintegration-black-vinyl-lp_standard/stock/changes',
      {
        body: JSON.stringify({ delta: 1, reason: 'show_sale' }),
        headers: {
          'content-type': 'application/json',
          'idempotency-key': '123e4567-e89b-42d3-a456-426614174001',
        },
        method: 'POST',
      },
      LOCAL_ENV,
    );

    expect(mockRecordStockChange).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: '123e4567-e89b-42d3-a456-426614174001' }),
    );
    expect(response.status).toBe(200);
  });

  it('requires a stock key when runtime enforcement is enabled', async () => {
    const response = await createHttpApp().request(
      'http://127.0.0.1/api/internal/variants/variant_test/stock/changes',
      {
        body: JSON.stringify({ delta: 1, reason: 'show_sale' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      },
      { ...LOCAL_ENV, COMMERCE_IDEMPOTENCY_KEYS_REQUIRED: 'true' },
    );

    expect(mockRecordStockChange).not.toHaveBeenCalled();
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'idempotency_key_required',
      status: 409,
    });
  });

  it('maps a stock payload conflict to a safe 409 response', async () => {
    mockRecordStockChange.mockRejectedValueOnce(
      new StockIdempotencyConflictError('The request key was already used for different input.'),
    );

    const response = await createHttpApp().request(
      'http://127.0.0.1/api/internal/variants/variant_test/stock/changes',
      {
        body: JSON.stringify({ delta: 1, reason: 'show_sale' }),
        headers: {
          'content-type': 'application/json',
          'idempotency-key': '123e4567-e89b-42d3-a456-426614174002',
        },
        method: 'POST',
      },
      LOCAL_ENV,
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'stock_idempotency_conflict',
      status: 409,
    });
  });

  it('attributes hosted stock changes to the signed Access identity', async () => {
    const issuer = 'https://blackbox-stock-test.cloudflareaccess.com';
    const { privateKey, publicKey } = await generateKeyPair('RS256');
    const jwk = await exportJWK(publicKey);
    Object.assign(jwk, { alg: 'RS256', kid: 'stock-test', use: 'sig' });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ keys: [jwk] }));
    const token = await new SignJWT({ email: 'verified@blackboxrecords.example' })
      .setProtectedHeader({ alg: 'RS256', kid: 'stock-test' })
      .setIssuer(issuer)
      .setAudience(HOSTED_ENV.CF_ACCESS_POLICY_AUD)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
    mockRecordStockChange.mockResolvedValueOnce({
      entry: {
        actorEmail: 'verified@blackboxrecords.example',
        id: 'change_hosted',
        notes: null,
        quantityDelta: -1,
        reason: 'show_sale',
        recordedAt: new Date('2026-04-24T12:05:00.000Z'),
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
      stock: {
        revision: 5,
        createdAt: new Date('2026-04-24T10:00:00.000Z'),
        onlineQuantity: 1,
        quantity: 2,
        updatedAt: new Date('2026-04-24T12:05:00.000Z'),
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
    });

    try {
      const response = await createHttpApp().request(
        'https://ops.example/api/internal/variants/variant_disintegration-black-vinyl-lp_standard/stock/changes',
        {
          body: JSON.stringify({ delta: -1, reason: 'show_sale' }),
          headers: {
            [CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER]: 'attacker@blackboxrecords.example',
            [CF_ACCESS_JWT_ASSERTION_HEADER]: token,
            'content-type': 'application/json',
          },
          method: 'POST',
        },
        { ...HOSTED_ENV, CF_ACCESS_TEAM_DOMAIN: issuer },
      );

      expect(response.status).toBe(200);
      expect(mockRecordStockChange).toHaveBeenCalledWith(
        expect.objectContaining({ actorEmail: 'verified@blackboxrecords.example' }),
      );
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('returns 400 for invalid stock operations from the application layer', async () => {
    mockRecordStockCount.mockRejectedValueOnce(
      new InvalidStockOperationError('Online stock cannot exceed counted stock.'),
    );

    const app = createHttpApp();
    const response = await app.request(
      'http://127.0.0.1/api/internal/variants/variant_disintegration-black-vinyl-lp_standard/stock/counts',
      {
        body: JSON.stringify({
          countedQuantity: 1,
          expectedRevision: 0,
          onlineQuantity: 2,
        }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      },
      LOCAL_ENV,
    );

    expect(response.status).toBe(400);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
      type: '/problems/invalid_request',
      title: 'Invalid request.',
      status: 400,
      detail: 'Online stock cannot exceed counted stock.',
      code: 'invalid_request',
      error: 'Online stock cannot exceed counted stock.',
      requestId: expect.any(String),
    });
  });

  it('returns 404 for missing variants without exposing internals', async () => {
    mockReadVariantStock.mockRejectedValueOnce(new VariantNotFoundError('Variant not found.'));

    const app = createHttpApp();
    const response = await app.request(
      'http://127.0.0.1/api/internal/variants/variant_missing/stock',
      undefined,
      LOCAL_ENV,
    );

    expect(response.status).toBe(404);
    expectNoStoreCacheControl(response);
    const body = await response.json();
    expect(body).toEqual({
      type: '/problems/not_found',
      title: 'Not Found',
      status: 404,
      detail: 'Variant not found.',
      code: 'not_found',
      error: 'Variant not found.',
      requestId: expect.any(String),
    });
    expect(JSON.stringify(body)).not.toContain(CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER);
    expect(JSON.stringify(body)).not.toContain('COMMERCE_DB');
  });
});
