import type { OpenAPIHono } from '@hono/zod-openapi';
import type { FlagshipBinding } from '@cloudflare/flagship/server';

export type AppEnvironment = 'local' | 'sandbox' | 'production';

export type AppBindings = {
  APP_ENV: AppEnvironment;
  COMMERCE_DB: D1Database;
  CHECKOUT_RETURN_ORIGINS?: string;
  FLAGS?: FlagshipBinding;
  NATIVE_CHECKOUT_ENABLED?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  RESEND_NEWSLETTER_SEGMENT_ID?: string;
  RESEND_NEWSLETTER_TOPIC_ID?: string;
  RESEND_OPS_TO_EMAIL?: string;
  RESEND_REPLY_TO_EMAIL?: string;
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL?: string;
  STRIPE_API_BASE_URL?: string;
  STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET?: string;
};

export type AppEnv = {
  Bindings: AppBindings;
};

export type AppOpenApi = OpenAPIHono<AppEnv>;
