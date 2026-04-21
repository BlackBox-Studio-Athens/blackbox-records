import { OpenAPIHono } from '@hono/zod-openapi';

import type { AppEnv, AppOpenApi } from '../../env';
import { errorHandler } from './error-handler';
import { notFoundHandler } from './not-found-handler';
import { registerInternalRoutes } from './routes/register-internal-routes';
import { registerPublicRoutes } from './routes/register-public-routes';

export function createHttpApp(): AppOpenApi {
    const app = new OpenAPIHono<AppEnv>();

    registerPublicRoutes(app);
    registerInternalRoutes(app);

    app.notFound(notFoundHandler);
    app.onError(errorHandler);

    return app;
}
