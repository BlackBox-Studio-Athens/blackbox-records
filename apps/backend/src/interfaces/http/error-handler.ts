import type { ErrorHandler } from 'hono';

import type { AppEnv } from '../../env';

const jsonNoStore = <TResponse extends Response>(response: TResponse): TResponse => {
  response.headers.set('Cache-Control', 'no-store');

  return response;
};

export const errorHandler: ErrorHandler<AppEnv> = (error, context) => {
  console.error(error);

  return jsonNoStore(context.json({ error: 'Internal Server Error' }, 500));
};
