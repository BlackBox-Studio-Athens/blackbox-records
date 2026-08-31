import type { MiddlewareHandler } from 'hono';

import type { AppEnv } from '../../../env';
import { requestLogger } from '../../../observability';
import { jsonError } from '../responses';
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
