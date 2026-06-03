import type { NotFoundHandler } from 'hono';

import type { AppEnv } from '../../env';

const jsonNoStore = <TResponse extends Response>(response: TResponse): TResponse => {
  response.headers.set('Cache-Control', 'no-store');

  return response;
};

export const notFoundHandler: NotFoundHandler<AppEnv> = (context) => {
  return jsonNoStore(context.json({ error: 'Not Found' }, 404));
};
