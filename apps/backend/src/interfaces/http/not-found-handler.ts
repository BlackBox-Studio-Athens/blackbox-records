import type { NotFoundHandler } from 'hono';

import type { AppEnv } from '../../env';

export const notFoundHandler: NotFoundHandler<AppEnv> = (context) => {
  return context.json(
    {
      error: 'Not Found',
    },
    404,
  );
};
