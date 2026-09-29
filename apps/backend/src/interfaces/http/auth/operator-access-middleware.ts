import type { MiddlewareHandler } from 'hono';

import type { AppEnv } from '../../../platform/env';
import { requestLogger } from '../../../platform/observability';
import { jsonError } from '../../../platform/interfaces/http/responses';
import { verifyOperatorAccess } from './operator-identity';

export function operatorAccessMiddleware(): MiddlewareHandler<AppEnv> {
  return async (context, next) => {
    const result = await verifyOperatorAccess(context.req.raw, context.env);

    if (result.status === 'verified') {
      context.set('operatorIdentity', result.identity);
      await next();
      return;
    }

    requestLogger(context).warn({
      event: 'operator_access_rejected',
      outcome: result.status,
      routeFamily: 'internal',
      safeReason: result.reason,
    });

    return result.status === 'unauthorized'
      ? jsonError(context, { code: 'unauthorized', message: 'Unauthorized.', status: 401 })
      : jsonError(context, {
          code: 'operator_access_unavailable',
          message: 'Operator access temporarily unavailable.',
          status: 503,
        });
  };
}
