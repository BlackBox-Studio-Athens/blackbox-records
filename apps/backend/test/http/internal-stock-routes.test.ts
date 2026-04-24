import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER } from '../../src/interfaces/http/auth';
import { createHttpApp } from '../../src/interfaces/http/app';

const mockDisconnect = vi.fn(async () => {});
const mockSearchVariants = vi.fn();
const mockReadVariantStock = vi.fn();
const mockReadVariantStockHistory = vi.fn();
const mockRecordStockChange = vi.fn();
const mockRecordStockCount = vi.fn();
const VariantNotFoundError = class VariantNotFoundError extends Error {};
const InvalidStockOperationError = class InvalidStockOperationError extends Error {};

vi.mock('../../src/interfaces/http/routes/internal-stock-services', () => ({
    createInternalStockServices: () => ({
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
    }),
}));

describe('internal stock routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('requires an Access-authenticated operator identity header', async () => {
        const app = createHttpApp();

        const response = await app.request('http://backend.test/api/internal/variants');

        expect(response.status).toBe(401);
        await expect(response.json()).resolves.toEqual({
            error: 'Missing operator identity.',
        });
    });

    it('lists variants for operators on the protected internal surface', async () => {
        mockSearchVariants.mockResolvedValueOnce([
            {
                sourceId: 'barren-point',
                sourceKind: 'release',
                storeItemSlug: 'barren-point',
                variantId: 'variant_barren-point_standard',
            },
        ]);

        const app = createHttpApp();
        const response = await app.request(
            'http://backend.test/api/internal/variants?q=barren&limit=10',
            {
                headers: {
                    [CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER]: 'operator@blackboxrecords.example',
                },
            },
            {
                APP_ENV: 'local',
                COMMERCE_DB: {} as D1Database,
            },
        );

        expect(mockSearchVariants).toHaveBeenCalledWith('barren', 10);
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual([
            {
                sourceId: 'barren-point',
                sourceKind: 'release',
                storeItemSlug: 'barren-point',
                variantId: 'variant_barren-point_standard',
            },
        ]);
    });

    it('returns current stock detail for a known variant', async () => {
        mockReadVariantStock.mockResolvedValueOnce({
            sourceId: 'barren-point',
            sourceKind: 'release',
            stock: {
                onlineQuantity: 2,
                quantity: 3,
                updatedAt: new Date('2026-04-24T12:00:00.000Z'),
            },
            storeItemSlug: 'barren-point',
            variantId: 'variant_barren-point_standard',
        });

        const app = createHttpApp();
        const response = await app.request(
            'http://backend.test/api/internal/variants/variant_barren-point_standard/stock',
            {
                headers: {
                    [CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER]: 'operator@blackboxrecords.example',
                },
            },
            {
                APP_ENV: 'local',
                COMMERCE_DB: {} as D1Database,
            },
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            sourceId: 'barren-point',
            sourceKind: 'release',
            stock: {
                onlineQuantity: 2,
                quantity: 3,
                updatedAt: '2026-04-24T12:00:00.000Z',
            },
            storeItemSlug: 'barren-point',
            variantId: 'variant_barren-point_standard',
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
                variantId: 'variant_barren-point_standard',
            },
            stock: {
                createdAt: new Date('2026-04-24T10:00:00.000Z'),
                onlineQuantity: 1,
                quantity: 2,
                updatedAt: new Date('2026-04-24T12:05:00.000Z'),
                variantId: 'variant_barren-point_standard',
            },
        });

        const app = createHttpApp();
        const response = await app.request(
            'http://backend.test/api/internal/variants/variant_barren-point_standard/stock/changes',
            {
                body: JSON.stringify({
                    delta: -1,
                    notes: 'Packed for table',
                    reason: 'sale',
                }),
                headers: {
                    [CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER]: 'operator@blackboxrecords.example',
                    'content-type': 'application/json',
                },
                method: 'POST',
            },
            {
                APP_ENV: 'local',
                COMMERCE_DB: {} as D1Database,
            },
        );

        expect(mockRecordStockChange).toHaveBeenCalledWith({
            actorEmail: 'operator@blackboxrecords.example',
            notes: 'Packed for table',
            quantityDelta: -1,
            reason: 'sale',
            variantId: 'variant_barren-point_standard',
        });
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            entry: {
                actorEmail: 'operator@blackboxrecords.example',
                id: 'change_1',
                notes: 'Packed for table',
                quantityDelta: -1,
                reason: 'sale',
                recordedAt: '2026-04-24T12:05:00.000Z',
                type: 'change',
                variantId: 'variant_barren-point_standard',
            },
            stock: {
                onlineQuantity: 1,
                quantity: 2,
                updatedAt: '2026-04-24T12:05:00.000Z',
            },
            variantId: 'variant_barren-point_standard',
        });
    });

    it('returns 400 for invalid stock operations from the application layer', async () => {
        mockRecordStockCount.mockRejectedValueOnce(new InvalidStockOperationError('Online stock cannot exceed counted stock.'));

        const app = createHttpApp();
        const response = await app.request(
            'http://backend.test/api/internal/variants/variant_barren-point_standard/stock/counts',
            {
                body: JSON.stringify({
                    countedQuantity: 1,
                    onlineQuantity: 2,
                }),
                headers: {
                    [CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER]: 'operator@blackboxrecords.example',
                    'content-type': 'application/json',
                },
                method: 'POST',
            },
            {
                APP_ENV: 'local',
                COMMERCE_DB: {} as D1Database,
            },
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: 'Online stock cannot exceed counted stock.',
        });
    });
});
