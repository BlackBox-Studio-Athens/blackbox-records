import { createRoute, z } from '@hono/zod-openapi';

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

const storeCapabilitiesSchema = z
  .object({
    nativeCheckout: z.object({
      enabled: z.boolean(),
      unavailableReason: z.union([z.string(), z.null()]),
    }),
  })
  .openapi('StoreCapabilities');

function createCheckoutShippingLockerSchema() {
  return z.object({
    country_code: z.enum(['GR']),
    locker_id: z.string().trim().min(1),
    locker_name_or_label: z.string().trim().min(1),
  });
}

const checkoutShippingLockerSchema = createCheckoutShippingLockerSchema().strict().openapi('CheckoutShippingLocker');

const checkoutStateShippingLockerSchema = createCheckoutShippingLockerSchema().openapi('CheckoutStateShippingLocker');

const startCheckoutLineSchema = z
  .object({
    quantity: z.number().int().min(1).max(9),
    storeItemSlug: z.string().trim().min(1),
    variantId: z.string().trim().min(1),
  })
  .strict()
  .openapi('StartCheckoutLine');

const startCheckoutBodySchema = z
  .object({
    lines: z.array(startCheckoutLineSchema).min(1).optional(),
    shippingLocker: checkoutShippingLockerSchema,
    storeItemSlug: z.string().trim().min(1).optional(),
    variantId: z.string().trim().min(1).optional(),
  })
  .strict()
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
    shippingLocker: z.union([checkoutStateShippingLockerSchema, z.null()]),
    state: z.enum(['open', 'paid', 'processing', 'expired', 'unknown']),
    status: z.enum(['open', 'complete', 'expired']).nullable(),
  })
  .openapi('CheckoutState');

export const getStoreItemRoute = createRoute({
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

export const getStoreCapabilitiesRoute = createRoute({
  method: 'get',
  path: '/api/store/capabilities',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: storeCapabilitiesSchema,
        },
      },
      description: 'Browser-safe public store capability state.',
    },
  },
  tags: ['Store'],
});

export const getStoreItemVariantsRoute = createRoute({
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

export const postCheckoutSessionRoute = createRoute({
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
    503: {
      content: {
        'application/json': {
          schema: errorSchema,
        },
      },
      description: 'Native checkout is temporarily unavailable.',
    },
  },
  tags: ['Checkout'],
});

export const getCheckoutStateRoute = createRoute({
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

export const publicContractModules = [
  getStoreCapabilitiesRoute,
  getStoreItemRoute,
  getStoreItemVariantsRoute,
  postCheckoutSessionRoute,
  getCheckoutStateRoute,
] as const;

export const publicContractPaths = publicContractModules.map((route) => route.path);
