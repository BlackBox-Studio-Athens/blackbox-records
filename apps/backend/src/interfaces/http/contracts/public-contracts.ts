import { createRoute, z } from '@hono/zod-openapi';

import { SERVICES_INQUIRY_FIELD_LIMITS, SERVICES_INQUIRY_SERVICES } from '../../../application/email';
import { backendErrorResponseSchema } from '../responses';

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

const fixedOfferPriceSchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currencyCode: z.string().trim().length(3),
  display: z.string(),
  kind: z.literal('fixed'),
});

const payWhatYouWantOfferPriceSchema = z.object({
  currencyCode: z.string().trim().length(3),
  display: z.string(),
  kind: z.literal('pay_what_you_want'),
  maximumAmountMinor: z.number().int().positive(),
  minimumAmountMinor: z.number().int().positive(),
  presetAmountMinor: z.number().int().positive(),
});

const offerPriceSchema = z
  .discriminatedUnion('kind', [fixedOfferPriceSchema, payWhatYouWantOfferPriceSchema])
  .openapi('PublicStoreOfferPrice');

const storeOfferIdentitySchema = z.object({
  storeItemSlug: z.string(),
  variantId: z.string(),
});

const storeOfferSchema = z
  .discriminatedUnion('catalogStatus', [
    storeOfferIdentitySchema.extend({
      availability: z.object({ label: z.string(), status: z.literal('available') }),
      canCheckout: z.literal(true),
      catalogStatus: z.literal('ready'),
      price: offerPriceSchema,
    }),
    storeOfferIdentitySchema.extend({
      availability: z.object({ label: z.string(), status: z.literal('sold_out') }),
      canCheckout: z.literal(false),
      catalogStatus: z.literal('sold_out'),
      price: z.null(),
    }),
    storeOfferIdentitySchema.extend({
      availability: z.object({ label: z.string(), status: z.literal('unavailable') }),
      canCheckout: z.literal(false),
      catalogStatus: z.literal('catalog_drift'),
      price: z.null(),
    }),
  ])
  .openapi('PublicStoreOffer');

const storeCapabilitiesSchema = z
  .object({
    nativeCheckout: z.object({
      enabled: z.boolean(),
      unavailableReason: z.union([z.string(), z.null()]),
    }),
  })
  .openapi('StoreCapabilities');

const storeListingPriceSchema = z
  .discriminatedUnion('presentationState', [
    z.object({
      displayPrice: z.string().trim().min(1),
      presentationState: z.literal('ready'),
      storeItemSlug: z.string().trim().min(1),
    }),
    z.object({
      presentationState: z.literal('unavailable'),
      storeItemSlug: z.string().trim().min(1),
    }),
  ])
  .openapi('PublicStoreListingPrice');

const checkoutStateShippingLockerSchema = z
  .object({
    country_code: z.enum(['GR']),
    locker_id: z.string().trim().min(1),
    locker_name_or_label: z.string().trim().min(1),
  })
  .openapi('CheckoutStateShippingLocker');

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
    newsletterOptIn: z.boolean().optional(),
    storeItemSlug: z.string().trim().min(1).optional(),
    variantId: z.string().trim().min(1).optional(),
  })
  .strict()
  .openapi('StartCheckoutBody');

const startCheckoutResponseSchema = z
  .object({
    checkoutUrl: z.url(),
  })
  .openapi('StartCheckoutResponse');

const checkoutStateSchema = z
  .object({
    checkoutSessionId: z.string(),
    orderStatus: z.enum(['pending_payment', 'paid', 'not_paid', 'needs_review']).nullable(),
    paymentStatus: z.enum(['paid', 'unpaid', 'no_payment_required']),
    shippingLocker: z.union([checkoutStateShippingLockerSchema, z.null()]),
    state: z.enum(['open', 'paid', 'processing', 'expired', 'unknown']),
    status: z.enum(['open', 'complete', 'expired']).nullable(),
  })
  .openapi('CheckoutState');

const newsletterRegistrationBodySchema = z
  .object({
    consentAccepted: z.literal(true),
    email: z.string().trim().email(),
  })
  .strict()
  .openapi('NewsletterRegistrationBody');

const newsletterRegistrationResponseSchema = z
  .object({
    status: z.literal('registered'),
  })
  .openapi('NewsletterRegistrationResponse');

export const servicesInquiryBodySchema = z
  .object({
    bandOrProject: z.string().trim().max(SERVICES_INQUIRY_FIELD_LIMITS.bandOrProject).optional(),
    email: z.string().trim().max(SERVICES_INQUIRY_FIELD_LIMITS.email).email(),
    message: z.string().trim().min(1).max(SERVICES_INQUIRY_FIELD_LIMITS.message),
    name: z.string().trim().min(1).max(SERVICES_INQUIRY_FIELD_LIMITS.name),
    service: z.enum(SERVICES_INQUIRY_SERVICES),
    serviceDetails: z.string().trim().max(SERVICES_INQUIRY_FIELD_LIMITS.serviceDetails).optional(),
  })
  .strict()
  .openapi('ServicesInquiryBody');

export const servicesInquiryResponseSchema = z
  .object({
    status: z.literal('submitted'),
  })
  .strict()
  .openapi('ServicesInquiryResponse');

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
          schema: backendErrorResponseSchema,
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

export const getStoreListingPricesRoute = createRoute({
  method: 'get',
  path: '/api/store/listing-prices',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(storeListingPriceSchema),
        },
      },
      description: 'Browser-safe current Store listing-price presentation.',
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
          schema: backendErrorResponseSchema,
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
      description: 'Created a hosted Stripe Checkout Session.',
    },
    400: {
      content: {
        'application/json': {
          schema: backendErrorResponseSchema,
        },
      },
      description: 'Invalid checkout request.',
    },
    404: {
      content: {
        'application/json': {
          schema: backendErrorResponseSchema,
        },
      },
      description: 'Store item not found.',
    },
    409: {
      content: {
        'application/json': {
          schema: backendErrorResponseSchema,
        },
      },
      description: 'Checkout unavailable or not configured.',
    },
    503: {
      content: {
        'application/json': {
          schema: backendErrorResponseSchema,
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
          schema: backendErrorResponseSchema,
        },
      },
      description: 'Checkout is not configured.',
    },
  },
  tags: ['Checkout'],
});

export const postNewsletterRegistrationRoute = createRoute({
  method: 'post',
  path: '/api/newsletter/registrations',
  request: {
    body: {
      content: {
        'application/json': {
          schema: newsletterRegistrationBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: newsletterRegistrationResponseSchema,
        },
      },
      description: 'Registered a public newsletter contact.',
    },
    400: {
      content: {
        'application/json': {
          schema: backendErrorResponseSchema,
        },
      },
      description: 'Invalid newsletter signup request.',
    },
    503: {
      content: {
        'application/json': {
          schema: backendErrorResponseSchema,
        },
      },
      description: 'Newsletter signup is temporarily unavailable.',
    },
  },
  tags: ['Newsletter'],
});

export const postServicesInquiryRoute = createRoute({
  method: 'post',
  path: '/api/services/inquiries',
  request: {
    body: {
      content: {
        'application/json': {
          schema: servicesInquiryBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: servicesInquiryResponseSchema,
        },
      },
      description: 'Submitted a Services inquiry for provider delivery.',
    },
    400: {
      content: {
        'application/json': {
          schema: backendErrorResponseSchema,
        },
      },
      description: 'Invalid Services inquiry request.',
    },
    503: {
      content: {
        'application/json': {
          schema: backendErrorResponseSchema,
        },
      },
      description: 'Services inquiry submission is temporarily unavailable.',
    },
  },
  tags: ['Services'],
});

const publicContractModules = [
  getStoreCapabilitiesRoute,
  getStoreListingPricesRoute,
  getStoreItemRoute,
  getStoreItemVariantsRoute,
  postCheckoutSessionRoute,
  getCheckoutStateRoute,
  postNewsletterRegistrationRoute,
] as const;

export const publicContractPaths = publicContractModules.map((route) => route.path);
