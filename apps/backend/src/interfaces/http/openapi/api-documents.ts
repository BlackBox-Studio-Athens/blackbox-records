import { OpenAPIHono } from '@hono/zod-openapi';

import type { AppEnv, AppOpenApi } from '../../../env';
import { registerInternalRoutes } from '../routes/register-internal-routes';
import { registerPublicRoutes } from '../routes/register-public-routes';

function createPublicOpenApiApp(): AppOpenApi {
    const app = new OpenAPIHono<AppEnv>();

    registerPublicRoutes(app);

    return app;
}

function createInternalOpenApiApp(): AppOpenApi {
    const app = new OpenAPIHono<AppEnv>();

    registerInternalRoutes(app);

    return app;
}

export function getPublicOpenApiDocument() {
    return createPublicOpenApiApp().getOpenAPI31Document({
        openapi: '3.1.0',
        info: {
            title: 'BlackBox Records Public API',
            version: '1.0.0',
        },
    });
}

export function getInternalOpenApiDocument() {
    return createInternalOpenApiApp().getOpenAPI31Document({
        openapi: '3.1.0',
        info: {
            title: 'BlackBox Records Internal API',
            version: '1.0.0',
        },
    });
}
