import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    CheckoutConfigurationError,
    CheckoutUnavailableError,
    StoreItemNotFoundError,
    VariantMismatchError,
} from '../../src/application/commerce/checkout';
import { createHttpApp } from '../../src/interfaces/http/app';

const mockDisconnect = vi.fn(async () => {});
const mockReadStoreOffer = vi.fn();
const mockListVariantOffersForStoreItem = vi.fn();
const mockStartCheckout = vi.fn();
const mockReadCheckoutState = vi.fn();

vi.mock('../../src/interfaces/http/routes/public-commerce-services', () => ({
    createPublicCommerceServices: () => ({
        disconnect: mockDisconnect,
        errors: {
            CheckoutConfigurationError,
            CheckoutUnavailableError,
            StoreItemNotFoundError,
            VariantMismatchError,
        },
        listVariantOffersForStoreItem: mockListVariantOffersForStoreItem,
        readCheckoutState: mockReadCheckoutState,
        readStoreOffer: mockReadStoreOffer,
        startCheckout: mockStartCheckout,
    }),
}));

const testBindings = {
    APP_ENV: 'local' as const,
    CHECKOUT_RETURN_ORIGINS: 'https://blackbox.example,http://127.0.0.1:4321',
    COMMERCE_DB: {} as D1Database,
    STRIPE_SECRET_KEY: 'sk_test_123',
};

describe('public commerce routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns backend-known store item offer state', async () => {
        mockReadStoreOffer.mockResolvedValueOnce({
            availability: {
                label: 'Available',
                status: 'available',
            },
            canCheckout: true,
            storeItemSlug: 'barren-point',
            variantId: 'variant_barren-point_standard',
        });

        const app = createHttpApp();
        const response = await app.request('http://backend.test/api/store/items/barren-point', {}, testBindings);

        expect(mockReadStoreOffer).toHaveBeenCalledWith('barren-point');
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            availability: {
                label: 'Available',
                status: 'available',
            },
            canCheckout: true,
            storeItemSlug: 'barren-point',
            variantId: 'variant_barren-point_standard',
        });
    });

    it('returns variant offers as an array-shaped contract', async () => {
        mockListVariantOffersForStoreItem.mockResolvedValueOnce([
            {
                availability: {
                    label: 'Available',
                    status: 'available',
                },
                canCheckout: true,
                storeItemSlug: 'barren-point',
                variantId: 'variant_barren-point_standard',
            },
        ]);

        const app = createHttpApp();
        const response = await app.request('http://backend.test/api/store/items/barren-point/variants', {}, testBindings);

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual([
            {
                availability: {
                    label: 'Available',
                    status: 'available',
                },
                canCheckout: true,
                storeItemSlug: 'barren-point',
                variantId: 'variant_barren-point_standard',
            },
        ]);
    });

    it('returns 404 for unknown store items', async () => {
        mockReadStoreOffer.mockResolvedValueOnce(null);

        const app = createHttpApp();
        const response = await app.request('http://backend.test/api/store/items/unknown', {}, testBindings);

        expect(response.status).toBe(404);
        await expect(response.json()).resolves.toEqual({
            error: 'Store item not found.',
        });
    });

    it('starts embedded checkout without accepting actor identity or Stripe IDs from the browser', async () => {
        mockStartCheckout.mockResolvedValueOnce({
            checkoutSessionId: 'cs_test_123',
            clientSecret: 'cs_test_123_secret_abc',
        });

        const app = createHttpApp();
        const response = await app.request(
            'http://backend.test/api/checkout/sessions',
            {
                body: JSON.stringify({
                    storeItemSlug: 'barren-point',
                    variantId: 'variant_barren-point_standard',
                }),
                headers: {
                    origin: 'https://blackbox.example',
                    referer: 'https://blackbox.example/blackbox-records/store/barren-point/checkout/',
                    'content-type': 'application/json',
                },
                method: 'POST',
            },
            testBindings,
        );

        expect(mockStartCheckout).toHaveBeenCalledWith({
            returnUrl:
                'https://blackbox.example/blackbox-records/store/barren-point/checkout/return?session_id={CHECKOUT_SESSION_ID}',
            storeItemSlug: 'barren-point',
            variantId: 'variant_barren-point_standard',
        });
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            clientSecret: 'cs_test_123_secret_abc',
        });
    });

    it('rejects checkout return URLs from unapproved origins', async () => {
        const app = createHttpApp();
        const response = await app.request(
            'http://backend.test/api/checkout/sessions',
            {
                body: JSON.stringify({
                    storeItemSlug: 'barren-point',
                    variantId: 'variant_barren-point_standard',
                }),
                headers: {
                    origin: 'https://evil.example',
                    referer: 'https://evil.example/store/barren-point/checkout/',
                    'content-type': 'application/json',
                },
                method: 'POST',
            },
            testBindings,
        );

        expect(mockStartCheckout).not.toHaveBeenCalled();
        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toEqual({
            error: 'Checkout return URL is not allowed.',
        });
    });

    it('ignores malformed checkout referers instead of failing open', async () => {
        const app = createHttpApp();
        const response = await app.request(
            'http://backend.test/api/checkout/sessions',
            {
                body: JSON.stringify({
                    storeItemSlug: 'barren-point',
                    variantId: 'variant_barren-point_standard',
                }),
                headers: {
                    origin: 'https://evil.example',
                    referer: 'not-a-url',
                    'content-type': 'application/json',
                },
                method: 'POST',
            },
            testBindings,
        );

        expect(mockStartCheckout).not.toHaveBeenCalled();
        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toEqual({
            error: 'Checkout return URL is not allowed.',
        });
    });

    it('maps checkout validation failures to public non-500 responses', async () => {
        mockStartCheckout.mockRejectedValueOnce(new CheckoutConfigurationError());

        const app = createHttpApp();
        const response = await app.request(
            'http://backend.test/api/checkout/sessions',
            {
                body: JSON.stringify({
                    storeItemSlug: 'barren-point',
                    variantId: 'variant_barren-point_standard',
                }),
                headers: {
                    origin: 'https://blackbox.example',
                    referer: 'https://blackbox.example/store/barren-point/checkout/',
                    'content-type': 'application/json',
                },
                method: 'POST',
            },
            testBindings,
        );

        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toEqual({
            error: 'Checkout is not configured for this item.',
        });
    });

    it('returns app-owned checkout state for return and retry UI', async () => {
        mockReadCheckoutState.mockResolvedValueOnce({
            checkoutSessionId: 'cs_test_123',
            paymentStatus: 'paid',
            state: 'paid',
            status: 'complete',
        });

        const app = createHttpApp();
        const response = await app.request('http://backend.test/api/checkout/sessions/cs_test_123/state', {}, testBindings);

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            checkoutSessionId: 'cs_test_123',
            paymentStatus: 'paid',
            state: 'paid',
            status: 'complete',
        });
    });
});
