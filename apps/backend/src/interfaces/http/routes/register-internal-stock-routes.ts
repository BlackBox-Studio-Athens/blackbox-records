import { createRoute, z } from '@hono/zod-openapi';

import type { AppOpenApi } from '../../../env';
import { readOperatorIdentityFromAccessHeaders } from '../auth';
import { createInternalStockServices } from './internal-stock-services';

const errorSchema = z
  .object({
    error: z.string(),
  })
  .openapi('InternalStockError');

const variantParamsSchema = z
  .object({
    variantId: z.string().min(1),
  })
  .openapi('InternalVariantParams');

const variantSearchQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    q: z.string().trim().min(1).optional(),
  })
  .openapi('InternalVariantSearchQuery');

const variantSummarySchema = z
  .object({
    sourceId: z.string(),
    sourceKind: z.enum(['release', 'distro']),
    storeItemSlug: z.string(),
    variantId: z.string(),
  })
  .openapi('InternalVariantSummary');

const stockStateSchema = z
  .object({
    onlineQuantity: z.number().int().min(0),
    quantity: z.number().int().min(0),
    updatedAt: z.string().datetime().nullable(),
  })
  .openapi('InternalStockState');

const stockDetailSchema = variantSummarySchema
  .extend({
    stock: stockStateSchema,
  })
  .openapi('InternalStockDetail');

const stockHistoryQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .openapi('InternalStockHistoryQuery');

const stockChangeEntrySchema = z
  .object({
    actorEmail: z.email(),
    id: z.string(),
    notes: z.string().nullable(),
    quantityDelta: z.number().int(),
    reason: z.string(),
    recordedAt: z.string().datetime(),
    type: z.literal('change'),
    variantId: z.string(),
  })
  .openapi('InternalStockChangeEntry');

const stockCountEntrySchema = z
  .object({
    actorEmail: z.email(),
    countedQuantity: z.number().int().min(0),
    id: z.string(),
    notes: z.string().nullable(),
    onlineQuantity: z.number().int().min(0),
    recordedAt: z.string().datetime(),
    type: z.literal('count'),
    variantId: z.string(),
  })
  .openapi('InternalStockCountEntry');

const stockHistoryResponseSchema = z
  .object({
    entries: z.array(z.union([stockChangeEntrySchema, stockCountEntrySchema])),
    variantId: z.string(),
  })
  .openapi('InternalStockHistoryResponse');

const stockChangeBodySchema = z
  .object({
    delta: z.number().int(),
    notes: z.string().trim().min(1).max(500).nullable().optional(),
    reason: z.string().trim().min(1).max(120),
  })
  .openapi('InternalStockChangeBody');

const stockCountBodySchema = z
  .object({
    countedQuantity: z.number().int().min(0),
    notes: z.string().trim().min(1).max(500).nullable().optional(),
    onlineQuantity: z.number().int().min(0),
  })
  .openapi('InternalStockCountBody');

const recordedStockChangeResponseSchema = z
  .object({
    entry: stockChangeEntrySchema,
    stock: stockStateSchema,
    variantId: z.string(),
  })
  .openapi('RecordedStockChangeResponse');

const recordedStockCountResponseSchema = z
  .object({
    entry: stockCountEntrySchema,
    stock: stockStateSchema,
    variantId: z.string(),
  })
  .openapi('RecordedStockCountResponse');

const searchVariantsRoute = createRoute({
  method: 'get',
  path: '/api/internal/variants',
  request: {
    query: variantSearchQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(variantSummarySchema),
        },
      },
      description: 'Search variants for internal stock operations.',
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
  tags: ['Internal Stock'],
});

const getVariantStockRoute = createRoute({
  method: 'get',
  path: '/api/internal/variants/{variantId}/stock',
  request: {
    params: variantParamsSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: stockDetailSchema,
        },
      },
      description: 'Current stock for a variant.',
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
      description: 'Variant not found.',
    },
  },
  tags: ['Internal Stock'],
});

const getVariantStockHistoryRoute = createRoute({
  method: 'get',
  path: '/api/internal/variants/{variantId}/stock/history',
  request: {
    params: variantParamsSchema,
    query: stockHistoryQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: stockHistoryResponseSchema,
        },
      },
      description: 'Recent stock history for a variant.',
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
      description: 'Variant not found.',
    },
  },
  tags: ['Internal Stock'],
});

const postStockChangeRoute = createRoute({
  method: 'post',
  path: '/api/internal/variants/{variantId}/stock/changes',
  request: {
    body: {
      content: {
        'application/json': {
          schema: stockChangeBodySchema,
        },
      },
    },
    params: variantParamsSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: recordedStockChangeResponseSchema,
        },
      },
      description: 'Recorded a stock change.',
    },
    400: {
      content: {
        'application/json': {
          schema: errorSchema,
        },
      },
      description: 'Invalid stock change.',
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
      description: 'Variant not found.',
    },
  },
  tags: ['Internal Stock'],
});

const postStockCountRoute = createRoute({
  method: 'post',
  path: '/api/internal/variants/{variantId}/stock/counts',
  request: {
    body: {
      content: {
        'application/json': {
          schema: stockCountBodySchema,
        },
      },
    },
    params: variantParamsSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: recordedStockCountResponseSchema,
        },
      },
      description: 'Recorded a stock count.',
    },
    400: {
      content: {
        'application/json': {
          schema: errorSchema,
        },
      },
      description: 'Invalid stock count.',
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
      description: 'Variant not found.',
    },
  },
  tags: ['Internal Stock'],
});

export function registerInternalStockRoutes(app: AppOpenApi): void {
  app.openapi(searchVariantsRoute, async (context) => {
    const operatorIdentity = readOperatorIdentityFromAccessHeaders(context.req.raw.headers);

    if (!operatorIdentity) {
      return context.json({ error: 'Missing operator identity.' }, 401);
    }

    const services = createInternalStockServices(context.env);

    try {
      const query = context.req.valid('query');
      const variants = await services.searchVariants(query.q ?? null, query.limit ?? 20);

      return context.json(variants, 200);
    } finally {
      await services.disconnect();
    }
  });

  app.openapi(getVariantStockRoute, async (context) => {
    const operatorIdentity = readOperatorIdentityFromAccessHeaders(context.req.raw.headers);

    if (!operatorIdentity) {
      return context.json({ error: 'Missing operator identity.' }, 401);
    }

    const services = createInternalStockServices(context.env);

    try {
      const { variantId } = context.req.valid('param');
      const detail = await services.readVariantStock(variantId);

      return context.json(toStockDetailResponse(detail), 200);
    } catch (error) {
      if (error instanceof services.errors.VariantNotFoundError) {
        return context.json({ error: error.message }, 404);
      }

      throw error;
    } finally {
      await services.disconnect();
    }
  });

  app.openapi(getVariantStockHistoryRoute, async (context) => {
    const operatorIdentity = readOperatorIdentityFromAccessHeaders(context.req.raw.headers);

    if (!operatorIdentity) {
      return context.json({ error: 'Missing operator identity.' }, 401);
    }

    const services = createInternalStockServices(context.env);

    try {
      const { variantId } = context.req.valid('param');
      const query = context.req.valid('query');
      const entries = await services.readVariantStockHistory(variantId, query.limit ?? 50);

      return context.json(
        {
          entries: entries.map(toHistoryEntryResponse),
          variantId,
        },
        200,
      );
    } catch (error) {
      if (error instanceof services.errors.VariantNotFoundError) {
        return context.json({ error: error.message }, 404);
      }

      throw error;
    } finally {
      await services.disconnect();
    }
  });

  app.openapi(postStockChangeRoute, async (context) => {
    const operatorIdentity = readOperatorIdentityFromAccessHeaders(context.req.raw.headers);

    if (!operatorIdentity) {
      return context.json({ error: 'Missing operator identity.' }, 401);
    }

    const services = createInternalStockServices(context.env);

    try {
      const { variantId } = context.req.valid('param');
      const body = context.req.valid('json');
      const result = await services.recordStockChange({
        actorEmail: operatorIdentity.email,
        notes: body.notes ?? null,
        quantityDelta: body.delta,
        reason: body.reason,
        variantId,
      });

      return context.json(
        {
          entry: toStockChangeEntryResponse(result.entry),
          stock: toStockStateResponse(result.stock),
          variantId,
        },
        200,
      );
    } catch (error) {
      if (error instanceof services.errors.VariantNotFoundError) {
        return context.json({ error: error.message }, 404);
      }

      if (error instanceof services.errors.InvalidStockOperationError) {
        return context.json({ error: error.message }, 400);
      }

      throw error;
    } finally {
      await services.disconnect();
    }
  });

  app.openapi(postStockCountRoute, async (context) => {
    const operatorIdentity = readOperatorIdentityFromAccessHeaders(context.req.raw.headers);

    if (!operatorIdentity) {
      return context.json({ error: 'Missing operator identity.' }, 401);
    }

    const services = createInternalStockServices(context.env);

    try {
      const { variantId } = context.req.valid('param');
      const body = context.req.valid('json');
      const result = await services.recordStockCount({
        actorEmail: operatorIdentity.email,
        countedQuantity: body.countedQuantity,
        notes: body.notes ?? null,
        onlineQuantity: body.onlineQuantity,
        variantId,
      });

      return context.json(
        {
          entry: toStockCountEntryResponse(result.entry),
          stock: toStockStateResponse(result.stock),
          variantId,
        },
        200,
      );
    } catch (error) {
      if (error instanceof services.errors.VariantNotFoundError) {
        return context.json({ error: error.message }, 404);
      }

      if (error instanceof services.errors.InvalidStockOperationError) {
        return context.json({ error: error.message }, 400);
      }

      throw error;
    } finally {
      await services.disconnect();
    }
  });
}

function toStockDetailResponse(detail: {
  sourceId: string;
  sourceKind: 'release' | 'distro';
  stock: { onlineQuantity: number; quantity: number; updatedAt: Date | null };
  storeItemSlug: string;
  variantId: string;
}) {
  return {
    sourceId: detail.sourceId,
    sourceKind: detail.sourceKind,
    stock: toStockStateResponse(detail.stock),
    storeItemSlug: detail.storeItemSlug,
    variantId: detail.variantId,
  };
}

function toStockStateResponse(stock: { onlineQuantity: number; quantity: number; updatedAt: Date | null }) {
  return {
    onlineQuantity: stock.onlineQuantity,
    quantity: stock.quantity,
    updatedAt: stock.updatedAt?.toISOString() ?? null,
  };
}

function toHistoryEntryResponse(
  entry:
    | {
        actorEmail: string;
        id: string;
        notes: string | null;
        quantityDelta: number;
        reason: string;
        recordedAt: Date;
        type: 'change';
        variantId: string;
      }
    | {
        actorEmail: string;
        countedQuantity: number;
        id: string;
        notes: string | null;
        onlineQuantity: number;
        recordedAt: Date;
        type: 'count';
        variantId: string;
      },
) {
  if (entry.type === 'change') {
    return {
      actorEmail: entry.actorEmail,
      id: entry.id,
      notes: entry.notes,
      quantityDelta: entry.quantityDelta,
      reason: entry.reason,
      recordedAt: entry.recordedAt.toISOString(),
      type: entry.type,
      variantId: entry.variantId,
    };
  }

  return {
    actorEmail: entry.actorEmail,
    countedQuantity: entry.countedQuantity,
    id: entry.id,
    notes: entry.notes,
    onlineQuantity: entry.onlineQuantity,
    recordedAt: entry.recordedAt.toISOString(),
    type: entry.type,
    variantId: entry.variantId,
  };
}

function toStockChangeEntryResponse(entry: {
  actorEmail: string;
  id: string;
  notes: string | null;
  quantityDelta: number;
  reason: string;
  recordedAt: Date;
  variantId: string;
}) {
  return {
    actorEmail: entry.actorEmail,
    id: entry.id,
    notes: entry.notes,
    quantityDelta: entry.quantityDelta,
    reason: entry.reason,
    recordedAt: entry.recordedAt.toISOString(),
    type: 'change' as const,
    variantId: entry.variantId,
  };
}

function toStockCountEntryResponse(entry: {
  actorEmail: string;
  countedQuantity: number;
  id: string;
  notes: string | null;
  onlineQuantity: number;
  recordedAt: Date;
  variantId: string;
}) {
  return {
    actorEmail: entry.actorEmail,
    countedQuantity: entry.countedQuantity,
    id: entry.id,
    notes: entry.notes,
    onlineQuantity: entry.onlineQuantity,
    recordedAt: entry.recordedAt.toISOString(),
    type: 'count' as const,
    variantId: entry.variantId,
  };
}
