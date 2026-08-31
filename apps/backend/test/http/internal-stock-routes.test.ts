import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER,
  CF_ACCESS_JWT_ASSERTION_HEADER,
} from '../../src/interfaces/http/auth';
import { createHttpApp } from '../../src/interfaces/http/app';

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
const mockReadVariantStock = vi.fn();
const mockReadVariantStockHistory = vi.fn();
const mockRecordStockChange = vi.fn();
const mockRecordStockCount = vi.fn();
const VariantNotFoundError = class VariantNotFoundError extends Error {};
const InvalidStockOperationError = class InvalidStockOperationError extends Error {};
const mockCreateInternalStockServices = vi.fn();

function expectNoStoreCacheControl(response: Response): void {
  expect(response.headers.get('Cache-Control')).toBe('no-store');
}

vi.mock('../../src/interfaces/http/routes/internal-stock-services', () => ({
  createInternalStockServices: (...args: unknown[]) => {
    mockCreateInternalStockServices(...args);

    return {
      disconnect: mockDisconnect,
      errors: {
        InvalidStockOperationError,
        VariantNotFoundError,
      },
      readVariantStock: mockReadVariantStock,
      readVariantStockHistory: mockReadVariantStockHistory,
      recordStockChange: mockRecordStockChange,
      recordStockCount: mockRecordStockCount,
      searchVariants: mockSearchVariants,
    };
  },
}));

describe('internal stock routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a hosted request without an Access assertion before service construction', async () => {
    const app = createHttpApp();

    const response = await app.request('https://ops.example/api/internal/variants', undefined, HOSTED_ENV);

    expect(response.status).toBe(401);
    expectNoStoreCacheControl(response);
    await expect(response.json()).resolves.toEqual({
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
    await expect(response.json()).resolves.toEqual([
      {
        sourceId: 'disintegration',
        sourceKind: 'release',
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
    ]);
  });

  it('returns current stock detail for a known variant', async () => {
    mockReadVariantStock.mockResolvedValueOnce({
      sourceId: 'disintegration',
      sourceKind: 'release',
      stock: {
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
    await expect(response.json()).resolves.toEqual({
      sourceId: 'disintegration',
      sourceKind: 'release',
      stock: {
        onlineQuantity: 2,
        quantity: 3,
        updatedAt: '2026-04-24T12:00:00.000Z',
      },
      storeItemSlug: 'disintegration-black-vinyl-lp',
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
    });
  });

  it('attributes stock changes to the Access-authenticated operator email', async () => {
    mockRecordStockChange.mockResolvedValueOnce({
      entry: {
        actorEmail: 'operator@blackboxrecords.example',
        id: 'change_1',
        notes: 'Packed for table',
        quantityDelta: -1,
        reason: 'sale',
        recordedAt: new Date('2026-04-24T12:05:00.000Z'),
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
      stock: {
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
          reason: 'sale',
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
      notes: 'Packed for table',
      quantityDelta: -1,
      reason: 'sale',
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
        reason: 'sale',
        recordedAt: '2026-04-24T12:05:00.000Z',
        type: 'change',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
      stock: {
        onlineQuantity: 1,
        quantity: 2,
        updatedAt: '2026-04-24T12:05:00.000Z',
      },
      variantId: 'variant_disintegration-black-vinyl-lp_standard',
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
        reason: 'sale',
        recordedAt: new Date('2026-04-24T12:05:00.000Z'),
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
      stock: {
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
          body: JSON.stringify({ delta: -1, reason: 'sale' }),
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
      code: 'not_found',
      error: 'Variant not found.',
      requestId: expect.any(String),
    });
    expect(JSON.stringify(body)).not.toContain(CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER);
    expect(JSON.stringify(body)).not.toContain('COMMERCE_DB');
  });
});
