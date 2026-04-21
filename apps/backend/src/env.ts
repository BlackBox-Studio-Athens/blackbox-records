import type { OpenAPIHono } from '@hono/zod-openapi';

export type AppEnvironment = 'local' | 'sandbox' | 'production';

export type AppBindings = {
    APP_ENV: AppEnvironment;
    COMMERCE_DB: D1Database;
};

export type AppEnv = {
    Bindings: AppBindings;
};

export type AppOpenApi = OpenAPIHono<AppEnv>;
