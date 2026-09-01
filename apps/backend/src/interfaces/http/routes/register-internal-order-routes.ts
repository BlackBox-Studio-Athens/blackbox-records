import { createRoute, z } from '@hono/zod-openapi';

import {
  readPaidCheckoutFulfillment,
  type CurrentPaidCheckoutOrder,
  type OrderStatus,
} from '../../../domain/commerce/repositories/spi';
import type { AppOpenApi } from '../../../env';
import { backendErrorResponseSchema, jsonError, jsonNoStore, operatorAccessErrorResponses } from '../responses';
import { createInternalOrderServices, type InternalOrderRead } from './internal-order-services';

const orderStatusSchema = z
  .enum(['pending_payment', 'paid', 'not_paid', 'needs_review'])
  .openapi('InternalOrderStatus');

const orderListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: orderStatusSchema.optional(),
  })
  .openapi('InternalOrderListQuery');

const checkoutSessionParamsSchema = z
  .object({
    checkoutSessionId: z.string().min(1),
  })
  .openapi('InternalCheckoutSessionParams');

const paidOrderDeliverySchema = z.object({
  attemptCount: z.number().int().min(0).max(5),
  createdAt: z.string().datetime(),
  deliveredAt: z.string().datetime().nullable(),
  kind: z.enum(['shopper_confirmation', 'ops_fulfillment', 'newsletter_registration']),
  needsReviewAt: z.string().datetime().nullable(),
  nextAttemptAt: z.string().datetime().nullable(),
  safeReason: z.string().nullable(),
  status: z.enum(['pending', 'delivered', 'needs_review']),
  updatedAt: z.string().datetime(),
});

const paidOrderFulfillmentSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('unavailable') }),
  z.object({
    kind: z.literal('incomplete'),
    reason: z.literal('incomplete_paid_fulfillment'),
  }),
  z.object({
    amountTotalMinor: z.number().int().positive(),
    currencyCode: z.literal('EUR'),
    kind: z.literal('current'),
    lines: z.array(
      z.object({
        displayName: z.string().min(1),
        lineAmountMinor: z.number().int().positive(),
        optionLabel: z.string().nullable(),
        quantity: z.number().int().positive(),
        storeItemSlug: z.string().min(1),
        unitAmountMinor: z.number().int().positive(),
        variantId: z.string().min(1),
      }),
    ),
    newsletterConsent: z.discriminatedUnion('optedIn', [
      z.object({ optedIn: z.literal(false) }),
      z.object({
        consentedAt: z.string().datetime(),
        copyVersion: z.string().min(1),
        optedIn: z.literal(true),
      }),
    ]),
    paidAt: z.string().datetime(),
    recipientName: z.string().min(1),
    shippingAddress: z.object({
      city: z.string().min(1),
      country: z.literal('GR'),
      line1: z.string().min(1),
      line2: z.string().nullable(),
      postalCode: z.string().min(1),
      state: z.string().nullable(),
    }),
    shopperContact: z.object({
      email: z.string().email(),
      phone: z.string().nullable(),
    }),
  }),
]);

const checkoutOrderSchema = z
  .object({
    checkoutExpiresAt: z.string().datetime(),
    checkoutSessionId: z.string().nullable(),
    createdAt: z.string().datetime(),
    deliveries: z.array(paidOrderDeliverySchema),
    fulfillment: paidOrderFulfillmentSchema,
    needsReviewAt: z.string().datetime().nullable(),
    notPaidAt: z.string().datetime().nullable(),
    paidAt: z.string().datetime().nullable(),
    shippingLocker: z
      .object({
        country_code: z.literal('GR'),
        locker_id: z.string(),
        locker_name_or_label: z.string(),
      })
      .nullable(),
    status: orderStatusSchema,
    statusUpdatedAt: z.string().datetime(),
    storeItemSlug: z.string(),
    stripePaymentIntentId: z.string().nullable(),
    updatedAt: z.string().datetime(),
    variantId: z.string(),
  })
  .openapi('InternalCheckoutOrder');

const listOrdersRoute = createRoute({
  method: 'get',
  path: '/api/internal/orders',
  request: {
    query: orderListQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(checkoutOrderSchema),
        },
      },
      description: 'Recent checkout orders for protected operator reconciliation.',
    },
    ...operatorAccessErrorResponses,
  },
  tags: ['Internal Orders'],
});

const getOrderByCheckoutSessionRoute = createRoute({
  method: 'get',
  path: '/api/internal/orders/checkout-sessions/{checkoutSessionId}',
  request: {
    params: checkoutSessionParamsSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: checkoutOrderSchema,
        },
      },
      description: 'Checkout order state for one checkout session.',
    },
    ...operatorAccessErrorResponses,
    404: {
      content: {
        'application/json': {
          schema: backendErrorResponseSchema,
        },
      },
      description: 'Checkout order not found.',
    },
  },
  tags: ['Internal Orders'],
});

export function registerInternalOrderRoutes(app: AppOpenApi): void {
  app.openapi(listOrdersRoute, async (context) => {
    const services = createInternalOrderServices(context.env);

    try {
      const query = context.req.valid('query');
      const orders = await services.readRecentCheckoutOrders({
        limit: query.limit ?? 20,
        status: (query.status as OrderStatus | undefined) ?? null,
      });

      return jsonNoStore(context.json(orders.map(toCheckoutOrderResponse), 200));
    } finally {
      await services.disconnect();
    }
  });

  app.openapi(getOrderByCheckoutSessionRoute, async (context) => {
    const services = createInternalOrderServices(context.env);

    try {
      const { checkoutSessionId } = context.req.valid('param');
      const order = await services.readCheckoutOrder(checkoutSessionId);

      if (!order) {
        return jsonError(context, {
          code: 'not_found',
          message: 'Checkout order not found.',
          status: 404,
        });
      }

      return jsonNoStore(context.json(toCheckoutOrderResponse(order), 200));
    } finally {
      await services.disconnect();
    }
  });
}

function toCheckoutOrderResponse(read: InternalOrderRead) {
  const { deliveries, order } = read;

  return {
    checkoutExpiresAt: order.checkoutExpiresAt.toISOString(),
    checkoutSessionId: order.checkoutSessionId,
    createdAt: order.createdAt.toISOString(),
    deliveries: deliveries.map((delivery) => ({
      attemptCount: delivery.attemptCount,
      createdAt: delivery.createdAt.toISOString(),
      deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
      kind: delivery.kind,
      needsReviewAt: delivery.needsReviewAt?.toISOString() ?? null,
      nextAttemptAt: delivery.nextAttemptAt?.toISOString() ?? null,
      safeReason: delivery.safeReason,
      status: delivery.status,
      updatedAt: delivery.updatedAt.toISOString(),
    })),
    fulfillment: toPaidFulfillmentResponse(order),
    needsReviewAt: order.needsReviewAt?.toISOString() ?? null,
    notPaidAt: order.notPaidAt?.toISOString() ?? null,
    paidAt: order.paidAt?.toISOString() ?? null,
    shippingLocker: order.shippingLocker,
    status: order.status,
    statusUpdatedAt: order.statusUpdatedAt.toISOString(),
    storeItemSlug: order.storeItemSlug,
    stripePaymentIntentId: order.stripePaymentIntentId,
    updatedAt: order.updatedAt.toISOString(),
    variantId: order.variantId,
  };
}

function toPaidFulfillmentResponse(order: InternalOrderRead['order']) {
  const fulfillment = readPaidCheckoutFulfillment(order);

  if (fulfillment.kind === 'not_paid') return { kind: 'unavailable' as const };
  if (fulfillment.kind === 'incomplete') {
    return { kind: 'incomplete' as const, reason: fulfillment.reason };
  }

  return toCurrentPaidFulfillmentResponse(fulfillment.order);
}

function toCurrentPaidFulfillmentResponse(order: CurrentPaidCheckoutOrder) {
  return {
    amountTotalMinor: order.amountTotalMinor,
    currencyCode: order.currencyCode,
    kind: 'current' as const,
    lines: order.lines.map((line) => ({
      displayName: line.displayName,
      lineAmountMinor: line.lineAmountMinor,
      optionLabel: line.optionLabel,
      quantity: line.quantity,
      storeItemSlug: line.storeItemSlug,
      unitAmountMinor: line.unitAmountMinor,
      variantId: line.variantId,
    })),
    newsletterConsent: order.newsletterOptIn
      ? {
          consentedAt: order.newsletterConsentAt.toISOString(),
          copyVersion: order.newsletterConsentCopyVersion,
          optedIn: true as const,
        }
      : { optedIn: false as const },
    paidAt: order.paidAt.toISOString(),
    recipientName: order.recipientName,
    shippingAddress: {
      city: order.shippingAddressCity,
      country: order.shippingAddressCountryCode,
      line1: order.shippingAddressLine1,
      line2: order.shippingAddressLine2,
      postalCode: order.shippingAddressPostalCode,
      state: order.shippingAddressState,
    },
    shopperContact: {
      email: order.shopperEmail,
      phone: order.shopperPhone,
    },
  };
}
