import type { ErrorHandler } from 'hono';

import type { AppEnv } from '../../env';

export const errorHandler: ErrorHandler<AppEnv> = (error, context) => {
  console.error(error);

  return context.json(
    {
      error: 'Internal Server Error',
    },
    500,
  );
};
