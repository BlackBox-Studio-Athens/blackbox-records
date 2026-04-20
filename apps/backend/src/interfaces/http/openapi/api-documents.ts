import { OpenAPIHono } from '@hono/zod-openapi';

import { registerInternalRoutes } from '../routes/register-internal-routes';
import { registerPublicRoutes } from '../routes/register-public-routes';

function createPublicOpenApiApp(): OpenAPIHono {
    const app = new OpenAPIHono();

    registerPublicRoutes(app);

    return app;
}

function createInternalOpenApiApp(): OpenAPIHono {
    const app = new OpenAPIHono();

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
