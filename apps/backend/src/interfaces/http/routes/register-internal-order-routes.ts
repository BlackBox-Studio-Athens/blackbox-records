import { createRoute, z } from '@hono/zod-openapi';

import type { CheckoutOrderRecord, OrderStatus } from '../../../domain/commerce/repositories';
import type { AppOpenApi } from '../../../env';
import { readOperatorIdentityFromAccessHeaders } from '../auth';
import { createInternalOrderServices } from './internal-order-services';

const errorSchema = z
  .object({
    error: z.string(),
  })
  .openapi('InternalOrderError');

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

const checkoutOrderSchema = z
  .object({
    checkoutSessionId: z.string(),
    createdAt: z.string().datetime(),
    needsReviewAt: z.string().datetime().nullable(),
    notPaidAt: z.string().datetime().nullable(),
    paidAt: z.string().datetime().nullable(),
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
    401: {
      content: {
        'application/json': {
          schema: errorSchema,
        },
      },
      description: 'Missing operator identity.',
    },
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
    401: {
      content: {
        'application/json': {
          schema: errorSchema,
        },
      },
      description: 'Missing operator identity.',
    },
    404: {
      content: {
        'application/json': {
          schema: errorSchema,
        },
      },
      description: 'Checkout order not found.',
    },
  },
  tags: ['Internal Orders'],
});

export function registerInternalOrderRoutes(app: AppOpenApi): void {
  app.openapi(listOrdersRoute, async (context) => {
    const operatorIdentity = readOperatorIdentityFromAccessHeaders(context.req.raw.headers);

    if (!operatorIdentity) {
      return context.json({ error: 'Missing operator identity.' }, 401);
    }

    const services = createInternalOrderServices(context.env);

    try {
      const query = context.req.valid('query');
      const orders = await services.readRecentCheckoutOrders({
        limit: query.limit ?? 20,
        status: (query.status as OrderStatus | undefined) ?? null,
      });

      return context.json(orders.map(toCheckoutOrderResponse), 200);
    } finally {
      await services.disconnect();
    }
  });

  app.openapi(getOrderByCheckoutSessionRoute, async (context) => {
    const operatorIdentity = readOperatorIdentityFromAccessHeaders(context.req.raw.headers);

    if (!operatorIdentity) {
      return context.json({ error: 'Missing operator identity.' }, 401);
    }

    const services = createInternalOrderServices(context.env);

    try {
      const { checkoutSessionId } = context.req.valid('param');
      const order = await services.readCheckoutOrder(checkoutSessionId);

      if (!order) {
        return context.json({ error: 'Checkout order not found.' }, 404);
      }

      return context.json(toCheckoutOrderResponse(order), 200);
    } finally {
      await services.disconnect();
    }
  });
}

function toCheckoutOrderResponse(order: CheckoutOrderRecord) {
  return {
    checkoutSessionId: order.checkoutSessionId,
    createdAt: order.createdAt.toISOString(),
    needsReviewAt: order.needsReviewAt?.toISOString() ?? null,
    notPaidAt: order.notPaidAt?.toISOString() ?? null,
    paidAt: order.paidAt?.toISOString() ?? null,
    status: order.status,
    statusUpdatedAt: order.statusUpdatedAt.toISOString(),
    storeItemSlug: order.storeItemSlug,
    stripePaymentIntentId: order.stripePaymentIntentId,
    updatedAt: order.updatedAt.toISOString(),
    variantId: order.variantId,
  };
}
