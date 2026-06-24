import type { Context, MiddlewareHandler } from 'hono';

import {
  productEnvironmentProfileFromBindings,
  type AppBindings,
  type AppEnv,
  type ProductEnvironment,
  type WorkerRuntimeTarget,
} from '../env';

type LogPrimitive = string | number | boolean | null;
type LogValue = LogPrimitive | LogValue[] | { readonly [key: string]: LogValue | undefined };

export type StructuredLogRecord = {
  readonly durationMs?: number;
  readonly event: string;
  readonly message?: string;
  readonly method?: string;
  readonly outcome?: string;
  readonly path?: string;
  readonly productEnvironment?: ProductEnvironment;
  readonly requestId?: string;
  readonly retryable?: boolean;
  readonly safeReason?: string;
  readonly status?: number | string;
  readonly workerDeploymentTarget?: WorkerRuntimeTarget;
  readonly [key: string]: LogValue | undefined;
};

export type AppLogger = {
  info(record: StructuredLogRecord): void;
  warn(record: StructuredLogRecord): void;
  error(record: StructuredLogRecord): void;
};

type TraceSpan = {
  isTraced?: boolean;
  setAttribute(key: string, value: boolean | number | string): void;
};

type TraceContext = {
  tracing?: {
    enterSpan<T>(name: string, callback: (span: TraceSpan) => T | Promise<T>): T | Promise<T>;
  };
};

const unsafeKeyPattern =
  /(?:authorization|cookie|token|secret|signature|payload|raw|html|email|phone|address|line1|line2|postal|customer|shopper|apiKey)/i;
const checkoutSessionPattern = /\bcs_(?:test|live|mock)_[A-Za-z0-9_]+/g;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const bearerPattern = /\bBearer\s+[A-Za-z0-9._~+/=-]+/g;
const secretPattern = /\b(?:sk_(?:test|live)|whsec)_[A-Za-z0-9_]+\b/g;

const noopLogger: AppLogger = {
  error() {},
  info() {},
  warn() {},
};

export function createWorkerLogger(base: Partial<StructuredLogRecord> = {}): AppLogger {
  return {
    error: (record) => console.error(cleanLogRecord({ ...base, ...record })),
    info: (record) => console.info(cleanLogRecord({ ...base, ...record })),
    warn: (record) => console.warn(cleanLogRecord({ ...base, ...record })),
  };
}

export function createBindingLogger(
  bindings: Pick<AppBindings, 'PRODUCT_ENVIRONMENT'> | undefined,
  extra: Partial<StructuredLogRecord> = {},
): AppLogger {
  const profile = bindings
    ? productEnvironmentProfileFromBindings(bindings)
    : {
        productEnvironment: 'LOCAL' as const,
        workerDeploymentTarget: 'local' as const,
      };

  return createWorkerLogger({
    productEnvironment: profile.productEnvironment,
    workerDeploymentTarget: profile.workerDeploymentTarget,
    ...extra,
  });
}

export function createNoopLogger(): AppLogger {
  return noopLogger;
}

export function cleanLogRecord(record: StructuredLogRecord): Record<string, LogValue> {
  return sanitizeRecord(record);
}

export function normalizeUnknownError(error: unknown): Pick<StructuredLogRecord, 'safeReason'> & { errorName: string } {
  if (error instanceof Error) {
    return {
      errorName: error.name || 'Error',
      safeReason: toSafeReason(error.name || 'error'),
    };
  }

  return {
    errorName: typeof error,
    safeReason: 'unknown',
  };
}

export function safeCheckoutSessionId(checkoutSessionId: string): string {
  return `checkout_session:${fingerprint(checkoutSessionId)}`;
}

export function normalizeTelemetryPath(urlOrPath: string): string {
  const pathname = parsePathname(urlOrPath);

  return pathname
    .replace(/^\/api\/store\/items\/[^/]+\/variants$/, '/api/store/items/:storeItemSlug/variants')
    .replace(/^\/api\/store\/items\/[^/]+$/, '/api/store/items/:storeItemSlug')
    .replace(/^\/api\/checkout\/sessions\/[^/]+\/state$/, '/api/checkout/sessions/:checkoutSessionId/state')
    .replace(
      /^\/api\/internal\/orders\/checkout-sessions\/[^/]+$/,
      '/api/internal/orders/checkout-sessions/:checkoutSessionId',
    )
    .replace(/^\/api\/internal\/variants\/[^/]+\/stock\/history$/, '/api/internal/variants/:variantId/stock/history')
    .replace(/^\/api\/internal\/variants\/[^/]+\/stock\/change$/, '/api/internal/variants/:variantId/stock/change')
    .replace(/^\/api\/internal\/variants\/[^/]+\/stock\/count$/, '/api/internal/variants/:variantId/stock/count')
    .replace(/^\/api\/internal\/variants\/[^/]+\/stock$/, '/api/internal/variants/:variantId/stock');
}

export function requestObservabilityMiddleware(): MiddlewareHandler<AppEnv> {
  return async (context, next) => {
    const startedAt = performance.now();
    let thrown: unknown;

    try {
      await next();
    } catch (error) {
      thrown = error;
      throw error;
    } finally {
      const status = thrown ? 500 : context.res.status;
      const logger = createBindingLogger(context.env, { requestId: context.get('requestId') });
      const record: StructuredLogRecord = {
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        event: 'http_request_completed',
        method: context.req.method,
        outcome: status >= 500 ? 'error' : status >= 400 ? 'client_error' : 'ok',
        path: normalizeTelemetryPath(context.req.url),
        status,
      };

      if (status >= 500) {
        logger.error(record);
      } else if (status >= 400) {
        logger.warn(record);
      } else {
        logger.info(record);
      }
    }
  };
}

export function requestLogger(context: Context<AppEnv>): AppLogger {
  return createBindingLogger(context.env, { requestId: context.get('requestId') });
}

export function traceContextFromHono(context: Context<AppEnv>): TraceContext | undefined {
  try {
    return context.executionCtx as TraceContext;
  } catch {
    return undefined;
  }
}

export async function runWithTraceSpan<T>(
  traceContext: TraceContext | undefined,
  name: string,
  attributes: Record<string, boolean | number | string | undefined>,
  action: () => T | Promise<T>,
): Promise<T> {
  const tracing = traceContext?.tracing;

  if (!tracing) {
    return action();
  }

  return tracing.enterSpan(name, (span) => {
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined) {
        span.setAttribute(key, value);
      }
    }

    return action();
  });
}

function sanitizeRecord(record: Record<string, unknown>): Record<string, LogValue> {
  return Object.fromEntries(
    Object.entries(record).flatMap(([key, value]) => {
      const sanitized = sanitizeValue(key, value);

      return sanitized === undefined ? [] : [[key, sanitized]];
    }),
  );
}

function sanitizeValue(key: string, value: unknown): LogValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (unsafeKeyPattern.test(key)) {
    return '[redacted]';
  }

  if (value === null || typeof value === 'boolean' || typeof value === 'number') {
    return typeof value === 'number' && !Number.isFinite(value) ? String(value) : value;
  }

  if (typeof value === 'string') {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(key, item)).filter((item): item is LogValue => item !== undefined);
  }

  if (value instanceof Error) {
    return normalizeUnknownError(value);
  }

  if (typeof value === 'object') {
    return sanitizeRecord(value as Record<string, unknown>);
  }

  return String(value);
}

function redactString(value: string): string {
  return value
    .replace(secretPattern, '[redacted_secret]')
    .replace(bearerPattern, '[redacted_token]')
    .replace(emailPattern, '[redacted_email]')
    .replace(checkoutSessionPattern, (match) => safeCheckoutSessionId(match));
}

function parsePathname(urlOrPath: string): string {
  try {
    return new URL(urlOrPath).pathname;
  } catch {
    return urlOrPath.split('?')[0] || '/';
  }
}

function toSafeReason(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function fingerprint(value: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}
