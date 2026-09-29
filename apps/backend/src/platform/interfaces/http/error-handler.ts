import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { AppEnv } from '../../env';
import { normalizeTelemetryPath, normalizeUnknownError, requestLogger } from '../../observability';
import { jsonError } from './responses';

export const errorHandler: ErrorHandler<AppEnv> = (error, context) => {
  if (error instanceof HTTPException) {
    const status = error.status;
    const logger = requestLogger(context);

    logger[status >= 500 ? 'error' : 'warn']({
      event: 'http_request_error',
      method: context.req.method,
      path: normalizeTelemetryPath(context.req.url),
      safeReason: errorCodeForHttpStatus(status),
      status,
    });

    return jsonError(context, {
      code: errorCodeForHttpStatus(status),
      message: status >= 500 ? 'Internal Server Error' : error.message || 'Request failed.',
      status,
    });
  }

  requestLogger(context).error({
    ...normalizeUnknownError(error),
    event: 'http_request_error',
    method: context.req.method,
    path: normalizeTelemetryPath(context.req.url),
    status: 500,
  });

  return jsonError(context, {
    code: 'internal_server_error',
    message: 'Internal Server Error',
    status: 500,
  });
};

function errorCodeForHttpStatus(status: number): string {
  if (status === 400) return 'invalid_request';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status >= 500) return 'internal_server_error';

  return 'http_error';
}
