import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';

import type { AppEnv, AppOpenApi } from '../../env';
import { errorHandler } from './error-handler';
import { notFoundHandler } from './not-found-handler';
import { registerInternalRoutes } from './routes/register-internal-routes';
import { registerPublicRoutes } from './routes/register-public-routes';

export function createHttpApp(): AppOpenApi {
  const app = new OpenAPIHono<AppEnv>();

  app.use(
    '/api/*',
    cors({
      allowHeaders: ['Content-Type'],
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      maxAge: 600,
      origin: (origin, context) => {
        if (!origin) {
          return null;
        }

        const allowedOrigins = parseAllowedOrigins(context.env.CHECKOUT_RETURN_ORIGINS);

        return allowedOrigins.has(origin) ? origin : null;
      },
    }),
  );

  registerPublicRoutes(app);
  registerInternalRoutes(app);

  app.notFound(notFoundHandler);
  app.onError(errorHandler);

  return app;
}

function parseAllowedOrigins(value: string | undefined) {
  return new Set(
    (value || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}
