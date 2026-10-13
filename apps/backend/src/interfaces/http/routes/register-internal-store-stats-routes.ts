import { createRoute, z } from '@hono/zod-openapi';

import { readStoreStats } from '../../../application/commerce/orders';
import type { AppOpenApi } from '../../../platform/env';
import {
  jsonError,
  jsonNoStore,
  operatorAccessErrorResponses,
  problemContent,
} from '../../../platform/interfaces/http/responses';
import { requestLogger } from '../../../platform/observability';

const rangeSchema = z.enum(['7d', '30d']);
const countSchema = z.number().int().nonnegative();
const figuresSchema = z.object({
  checkoutsStarted: countSchema,
  paidOrders: countSchema,
  itemsSold: countSchema,
  paidTotalMinor: countSchema,
  deliveryMinor: countSchema,
});
const responseSchema = z
  .object({
    range: rangeSchema,
    generatedAt: z.string().datetime(),
    currencyCode: z.literal('EUR'),
    current: figuresSchema,
    previous: figuresSchema,
  })
  .openapi('StoreStats');

export function registerInternalStoreStatsRoutes(app: AppOpenApi): void {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/internal/store-stats',
      operationId: 'readStoreStats',
      tags: ['Internal analytics'],
      summary: 'Read started checkouts and paid order figures for two UTC periods.',
      request: { query: z.object({ range: rangeSchema }) },
      responses: {
        200: {
          description: 'Authoritative store figures.',
          content: { 'application/json': { schema: responseSchema } },
        },
        400: { description: 'Range must be 7d or 30d.', content: problemContent },
        ...operatorAccessErrorResponses,
        503: {
          description: 'Store figures or operator authentication are temporarily unavailable.',
          content: problemContent,
        },
      },
    }),
    async (context) => {
      const { range } = context.req.valid('query');
      try {
        const result = responseSchema.parse(await readStoreStats(context.env, range, new Date()));
        return jsonNoStore(context.json(result, 200));
      } catch {
        requestLogger(context).warn({ event: 'store_stats_read_failed', safeReason: 'database_read_failed' });
        return jsonError(context, {
          code: 'service_unavailable',
          message: 'Store figures are temporarily unavailable. Try again.',
          status: 503,
        });
      }
    },
  );
}
