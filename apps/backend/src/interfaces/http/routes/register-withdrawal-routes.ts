import { createRoute, z } from '@hono/zod-openapi';
import { bodyLimit } from 'hono/body-limit';
import { recordOrderWithdrawal, drainWithdrawalDeliveries } from '../../../application/commerce/orders';
import { D1OrderWithdrawalRepository } from '../../../infrastructure/persistence/d1-order-withdrawal-repository';
import { createEmailRuntimeServices } from '../../../infrastructure/resend';
import type { AppOpenApi } from '../../../platform/env';
import { requestLogger } from '../../../platform/observability';
import { jsonError, jsonNoStore, operatorAccessErrorResponses } from '../../../platform/interfaces/http/responses';
import { postWithdrawalRoute } from '../contracts/public-contracts';

export function registerPublicWithdrawalRoutes(app: AppOpenApi): void {
  // Reject oversized streams before JSON parsing; Content-Length alone is not sufficient.
  app.use(
    postWithdrawalRoute.path,
    bodyLimit({
      maxSize: 16_384,
      onError: (context) =>
        jsonError(context, {
          code: 'invalid_request',
          message: 'Declaration is too long. Email orders@blackboxrecordsathens.com instead.',
          status: 400,
        }),
    }),
  );
  app.openapi(postWithdrawalRoute, async (context) => {
    const body = context.req.valid('json');
    const repository = new D1OrderWithdrawalRepository(context.env.COMMERCE_DB);
    const logger = requestLogger(context);
    let result;
    try {
      result = await recordOrderWithdrawal({
        declaration: body,
        id: body.submissionId,
        requester: context.req.header('CF-Connecting-IP') ?? 'local',
        repository,
      });
    } catch {
      logger.warn({ event: 'withdrawal_record_failed' });
      return jsonError(context, {
        code: 'withdrawal_unavailable',
        message: 'Could not record your declaration. Email orders@blackboxrecordsathens.com instead.',
        status: 503,
      });
    }
    if (result.kind === 'conflict')
      return jsonError(context, {
        code: 'withdrawal_conflict',
        message: 'This submission identity was already used. Review and submit a new declaration.',
        status: 409,
      });
    if (result.kind === 'limited') {
      context.header('Retry-After', '3600');
      return jsonError(context, {
        code: 'withdrawal_limited',
        message: 'Too many submissions. Email orders@blackboxrecordsathens.com to withdraw now.',
        status: 429,
      });
    }
    // The committed outbox survives response loss, a failed provider, or a terminated background task.
    context.executionCtx.waitUntil(
      (async () => {
        try {
          const runtime = createEmailRuntimeServices(context.env);
          await drainWithdrawalDeliveries({
            ...runtime,
            repository,
            now: new Date(),
            limit: 2,
            id: body.submissionId,
            logger,
          });
        } catch {
          logger.warn({ event: 'withdrawal_delivery_deferred' });
        }
      })(),
    );
    return jsonNoStore(context.json(result.receipt, 200));
  });
}

const listWithdrawalsRoute = createRoute({
  method: 'get',
  path: '/api/internal/order-withdrawals',
  operationId: 'listInternalOrderWithdrawals',
  responses: {
    200: {
      description: 'Recent withdrawal support records and delivery state. No payment or stock mutation.',
      content: {
        'application/json': {
          schema: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              contract: z.string(),
              email: z.string(),
              submittedAt: z.string(),
              deliveries: z.array(
                z.object({
                  kind: z.string(),
                  status: z.string(),
                  attemptCount: z.number(),
                  safeReason: z.string().nullable(),
                }),
              ),
            }),
          ),
        },
      },
    },
    ...operatorAccessErrorResponses,
  },
  tags: ['Internal Orders'],
});

export function registerInternalWithdrawalRoutes(app: AppOpenApi): void {
  app.openapi(listWithdrawalsRoute, async (context) => {
    const records = await new D1OrderWithdrawalRepository(context.env.COMMERCE_DB).listRecent();
    return jsonNoStore(
      context.json(
        records.map(({ id, name, contract, email, submittedAt, deliveries }) => ({
          id,
          name,
          contract,
          email,
          submittedAt,
          deliveries,
        })),
        200,
      ),
    );
  });
}
