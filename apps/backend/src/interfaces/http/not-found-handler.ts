import type { NotFoundHandler } from 'hono';

import type { AppEnv } from '../../env';
import { jsonError } from './responses';

export const notFoundHandler: NotFoundHandler<AppEnv> = (context) => {
  return jsonError(context, {
    code: 'not_found',
    message: 'Not Found',
    status: 404,
  });
};
