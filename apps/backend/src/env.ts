import type { OpenAPIHono } from '@hono/zod-openapi';

export type AppEnvironment = 'local' | 'sandbox' | 'production';

export type AppBindings = {
    APP_ENV: AppEnvironment;
    COMMERCE_DB: D1Database;
    STRIPE_SECRET_KEY: string;
};

export type AppEnv = {
    Bindings: AppBindings;
};

export type AppOpenApi = OpenAPIHono<AppEnv>;
