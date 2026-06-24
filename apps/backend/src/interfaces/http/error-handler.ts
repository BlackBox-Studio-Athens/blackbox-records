import type { ErrorHandler } from 'hono';

import type { AppEnv } from '../../env';
import { normalizeTelemetryPath, normalizeUnknownError, requestLogger } from '../../observability';

const jsonNoStore = <TResponse extends Response>(response: TResponse): TResponse => {
  response.headers.set('Cache-Control', 'no-store');

  return response;
};

export const errorHandler: ErrorHandler<AppEnv> = (error, context) => {
  requestLogger(context).error({
    ...normalizeUnknownError(error),
    event: 'http_request_error',
    method: context.req.method,
    path: normalizeTelemetryPath(context.req.url),
    status: 500,
  });

  return jsonNoStore(context.json({ error: 'Internal Server Error' }, 500));
};
