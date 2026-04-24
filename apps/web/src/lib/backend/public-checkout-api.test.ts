import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    createPublicCheckoutApi,
    PublicCheckoutApiError,
    resolvePublicCheckoutApiBaseUrl,
} from './public-checkout-api';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('resolvePublicCheckoutApiBaseUrl', () => {
    it('defaults to same-origin checkout calls when PUBLIC_BACKEND_BASE_URL is unset', () => {
        expect(resolvePublicCheckoutApiBaseUrl(undefined)).toBe('');
    });

    it('normalizes the configured backend base URL for local split-port development', () => {
        expect(resolvePublicCheckoutApiBaseUrl('http://127.0.0.1:8787/')).toBe('http://127.0.0.1:8787');
    });
});

describe('createPublicCheckoutApi', () => {
    it('reads store offers through same-origin checkout routes by default', async () => {
        const offer = {
            availability: {
                label: 'Available now',
                status: 'available',
            },
            canCheckout: true,
            storeItemSlug: 'barren-point',
            variantId: 'variant_barren-point_standard',
        };
        const fetchStub = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(offer), { status: 200 }));
        vi.stubGlobal('fetch', fetchStub);

        const api = createPublicCheckoutApi('');
        const result = await api.readStoreOffer('barren-point');

        expect(result).toEqual(offer);
        expect(fetchStub).toHaveBeenCalledWith(
            '/api/store/items/barren-point',
            expect.objectContaining({
                method: 'GET',
            }),
        );
    });

    it('uses the configured backend base URL for split-port development', async () => {
        const variants = [
            {
                availability: {
                    label: 'Available now',
                    status: 'available',
                },
                canCheckout: true,
                storeItemSlug: 'barren-point',
                variantId: 'variant_barren-point_standard',
            },
        ];
        const fetchStub = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(variants), { status: 200 }));
        vi.stubGlobal('fetch', fetchStub);

        const api = createPublicCheckoutApi('http://127.0.0.1:8787/');
        const result = await api.readStoreOfferVariants('barren-point');

        expect(result).toEqual(variants);
        expect(fetchStub).toHaveBeenCalledWith(
            'http://127.0.0.1:8787/api/store/items/barren-point/variants',
            expect.objectContaining({
                method: 'GET',
            }),
        );
    });

    it('posts checkout payloads as JSON and returns the embedded checkout secret', async () => {
        const fetchStub = vi.fn(
            async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({ clientSecret: 'seti_test_123' }), { status: 200 }),
        );
        vi.stubGlobal('fetch', fetchStub);

        const api = createPublicCheckoutApi('');
        const result = await api.startCheckout({
            storeItemSlug: 'barren-point',
            variantId: 'variant_barren-point_standard',
        });

        expect(result).toEqual({ clientSecret: 'seti_test_123' });
        expect(fetchStub).toHaveBeenCalledWith(
            '/api/checkout/sessions',
            expect.objectContaining({
                method: 'POST',
            }),
        );

        const firstCall = fetchStub.mock.calls[0] as [string, RequestInit?] | undefined;
        const requestInit = firstCall?.[1];
        expect(requestInit?.body).toBe(
            JSON.stringify({
                storeItemSlug: 'barren-point',
                variantId: 'variant_barren-point_standard',
            }),
        );
    });

    it('surfaces visible API error objects with status and response body', async () => {
        const fetchStub = vi.fn(
            async (_url: string, _init?: RequestInit) =>
                new Response(JSON.stringify({ error: 'Checkout unavailable or not configured.' }), {
                    status: 409,
                }),
        );
        vi.stubGlobal('fetch', fetchStub);

        const api = createPublicCheckoutApi('');

        await expect(
            api.startCheckout({
                storeItemSlug: 'barren-point',
                variantId: 'variant_barren-point_standard',
            }),
        ).rejects.toMatchObject({
            body: {
                error: 'Checkout unavailable or not configured.',
            },
            message: 'Checkout unavailable or not configured.',
            name: 'PublicCheckoutApiError',
            status: 409,
        } satisfies Partial<PublicCheckoutApiError>);
    });
});
