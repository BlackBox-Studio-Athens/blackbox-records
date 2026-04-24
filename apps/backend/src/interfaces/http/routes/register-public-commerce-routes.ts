import { createRoute, z } from '@hono/zod-openapi';

import type { AppOpenApi } from '../../../env';
import { createPublicCommerceServices } from './public-commerce-services';

const errorSchema = z
    .object({
        error: z.string(),
    })
    .openapi('PublicCommerceError');

const storeItemParamsSchema = z
    .object({
        storeItemSlug: z.string().trim().min(1),
    })
    .openapi('PublicStoreItemParams');

const checkoutSessionParamsSchema = z
    .object({
        checkoutSessionId: z.string().trim().min(1),
    })
    .openapi('PublicCheckoutSessionParams');

const offerAvailabilitySchema = z
    .object({
        label: z.string(),
        status: z.enum(['available', 'sold_out']),
    })
    .openapi('PublicStoreOfferAvailability');

const storeOfferSchema = z
    .object({
        availability: offerAvailabilitySchema,
        canCheckout: z.boolean(),
        storeItemSlug: z.string(),
        variantId: z.string(),
    })
    .openapi('PublicStoreOffer');

const startCheckoutBodySchema = z
    .object({
        storeItemSlug: z.string().trim().min(1),
        variantId: z.string().trim().min(1),
    })
    .openapi('StartCheckoutBody');

const startCheckoutResponseSchema = z
    .object({
        clientSecret: z.string(),
    })
    .openapi('StartCheckoutResponse');

const checkoutStateSchema = z
    .object({
        checkoutSessionId: z.string(),
        paymentStatus: z.enum(['paid', 'unpaid', 'no_payment_required']),
        state: z.enum(['open', 'paid', 'processing', 'expired', 'unknown']),
        status: z.enum(['open', 'complete', 'expired']).nullable(),
    })
    .openapi('CheckoutState');

const getStoreItemRoute = createRoute({
    method: 'get',
    path: '/api/store/items/{storeItemSlug}',
    request: {
        params: storeItemParamsSchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: storeOfferSchema,
                },
            },
            description: 'Backend-known checkout eligibility for one store item.',
        },
        404: {
            content: {
                'application/json': {
                    schema: errorSchema,
                },
            },
            description: 'Store item not found.',
        },
    },
    tags: ['Store'],
});

const getStoreItemVariantsRoute = createRoute({
    method: 'get',
    path: '/api/store/items/{storeItemSlug}/variants',
    request: {
        params: storeItemParamsSchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(storeOfferSchema),
                },
            },
            description: 'Checkout-eligible variants for one store item.',
        },
        404: {
            content: {
                'application/json': {
                    schema: errorSchema,
                },
            },
            description: 'Store item not found.',
        },
    },
    tags: ['Store'],
});

const postCheckoutSessionRoute = createRoute({
    method: 'post',
    path: '/api/checkout/sessions',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: startCheckoutBodySchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: startCheckoutResponseSchema,
                },
            },
            description: 'Created an embedded Stripe Checkout Session.',
        },
        400: {
            content: {
                'application/json': {
                    schema: errorSchema,
                },
            },
            description: 'Invalid checkout request.',
        },
        404: {
            content: {
                'application/json': {
                    schema: errorSchema,
                },
            },
            description: 'Store item not found.',
        },
        409: {
            content: {
                'application/json': {
                    schema: errorSchema,
                },
            },
            description: 'Checkout unavailable or not configured.',
        },
    },
    tags: ['Checkout'],
});

const getCheckoutStateRoute = createRoute({
    method: 'get',
    path: '/api/checkout/sessions/{checkoutSessionId}/state',
    request: {
        params: checkoutSessionParamsSchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: checkoutStateSchema,
                },
            },
            description: 'Sanitized Checkout Session state for shopper return UI.',
        },
        409: {
            content: {
                'application/json': {
                    schema: errorSchema,
                },
            },
            description: 'Checkout is not configured.',
        },
    },
    tags: ['Checkout'],
});

export function registerPublicCommerceRoutes(app: AppOpenApi): void {
    app.openapi(getStoreItemRoute, async (context) => {
        const services = createPublicCommerceServices(context.env);

        try {
            const { storeItemSlug } = context.req.valid('param');
            const offer = await services.readStoreOffer(storeItemSlug);

            if (!offer) {
                return context.json({ error: 'Store item not found.' }, 404);
            }

            return context.json(offer, 200);
        } finally {
            await services.disconnect();
        }
    });

    app.openapi(getStoreItemVariantsRoute, async (context) => {
        const services = createPublicCommerceServices(context.env);

        try {
            const { storeItemSlug } = context.req.valid('param');
            const variants = await services.listVariantOffersForStoreItem(storeItemSlug);

            if (!variants) {
                return context.json({ error: 'Store item not found.' }, 404);
            }

            return context.json(variants, 200);
        } finally {
            await services.disconnect();
        }
    });

    app.openapi(postCheckoutSessionRoute, async (context) => {
        const services = createPublicCommerceServices(context.env);

        try {
            const body = context.req.valid('json');
            const checkoutSession = await services.startCheckout({
                returnUrl: createCheckoutReturnUrl(context.req.raw.headers, context.req.url, body.storeItemSlug),
                storeItemSlug: body.storeItemSlug,
                variantId: body.variantId,
            });

            return context.json(
                {
                    clientSecret: checkoutSession.clientSecret,
                },
                200,
            );
        } catch (error) {
            if (error instanceof services.errors.StoreItemNotFoundError) {
                return context.json({ error: error.message }, 404);
            }

            if (error instanceof services.errors.VariantMismatchError) {
                return context.json({ error: error.message }, 400);
            }

            if (
                error instanceof services.errors.CheckoutUnavailableError ||
                error instanceof services.errors.CheckoutConfigurationError
            ) {
                return context.json({ error: error.message }, 409);
            }

            throw error;
        } finally {
            await services.disconnect();
        }
    });

    app.openapi(getCheckoutStateRoute, async (context) => {
        const services = createPublicCommerceServices(context.env);

        try {
            const { checkoutSessionId } = context.req.valid('param');
            const checkoutState = await services.readCheckoutState(checkoutSessionId);

            return context.json(checkoutState, 200);
        } catch (error) {
            if (error instanceof services.errors.CheckoutConfigurationError) {
                return context.json({ error: error.message }, 409);
            }

            throw error;
        } finally {
            await services.disconnect();
        }
    });
}

function createCheckoutReturnUrl(headers: Headers, requestUrl: string, storeItemSlug: string): string {
    const referer = headers.get('referer');

    if (referer) {
        const refererUrl = new URL(referer);
        const checkoutPath = refererUrl.pathname.endsWith('/') ? refererUrl.pathname : `${refererUrl.pathname}/`;

        return `${refererUrl.origin}${checkoutPath}return?session_id={CHECKOUT_SESSION_ID}`;
    }

    const origin = headers.get('origin') ?? new URL(requestUrl).origin;

    return `${origin}/store/${encodeURIComponent(storeItemSlug)}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;
}
