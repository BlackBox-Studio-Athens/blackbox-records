import { Hono } from 'hono';

import { errorHandler } from './error-handler';
import { notFoundHandler } from './not-found-handler';

export function createHttpApp(): Hono {
    const app = new Hono();

    app.notFound(notFoundHandler);
    app.onError(errorHandler);

    return app;
}
