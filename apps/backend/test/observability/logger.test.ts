import { describe, expect, it, vi } from 'vitest';

import {
  cleanLogRecord,
  createWorkerLogger,
  normalizeTelemetryPath,
  normalizeUnknownError,
  runWithTraceSpan,
  safeCheckoutSessionId,
} from '../../src/observability';

describe('Worker observability logger', () => {
  it('emits structured logs at the requested console severity and omits undefined fields', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    try {
      createWorkerLogger({ productEnvironment: 'LOCAL' }).info({
        event: 'test_event',
        message: undefined,
        outcome: 'ok',
      });

      expect(info).toHaveBeenCalledWith({
        event: 'test_event',
        outcome: 'ok',
        productEnvironment: 'LOCAL',
      });
    } finally {
      info.mockRestore();
    }
  });

  it('redacts representative unsafe telemetry values', () => {
    const record = cleanLogRecord({
      address: 'Long Street 1',
      authorization: 'Bearer token123',
      checkoutSessionIdHash: safeCheckoutSessionId('cs_test_123_secret'),
      cookie: 'session=abc',
      event: 'unsafe_input',
      message: 'sk_test_secret whsec_secret buyer@example.com cs_test_123_secret',
      nested: {
        email: 'buyer@example.com',
        ok: 'variant_disintegration-black-vinyl-lp_standard',
      },
      phone: '+302100000000',
      rawPayload: {
        id: 'evt_123',
      },
    });
    const serialized = JSON.stringify(record);

    expect(serialized).not.toContain('Long Street 1');
    expect(serialized).not.toContain('Bearer token123');
    expect(serialized).not.toContain('buyer@example.com');
    expect(serialized).not.toContain('sk_test_secret');
    expect(serialized).not.toContain('whsec_secret');
    expect(serialized).not.toContain('cs_test_123_secret');
    expect(record.checkoutSessionIdHash).toMatch(/^checkout_session:[a-f0-9]{8}$/);
    expect(record.nested).toEqual({
      email: '[redacted]',
      ok: 'variant_disintegration-black-vinyl-lp_standard',
    });
  });

  it('normalizes request paths without query strings or high-cardinality ids', () => {
    expect(
      normalizeTelemetryPath(
        'https://backend.test/api/checkout/sessions/cs_test_123/state?signature=secret&email=buyer@example.com',
      ),
    ).toBe('/api/checkout/sessions/:checkoutSessionId/state');
    expect(normalizeTelemetryPath('/api/internal/variants/variant_123/stock/change?token=secret')).toBe(
      '/api/internal/variants/:variantId/stock/change',
    );
  });

  it('normalizes unknown errors without stack traces', () => {
    const normalized = normalizeUnknownError(new TypeError('sk_test_secret'));

    expect(normalized).toEqual({
      errorName: 'TypeError',
      safeReason: 'type_error',
    });
    expect(JSON.stringify(normalized)).not.toContain('sk_test_secret');
  });

  it('wraps trace spans without changing returned values or thrown errors', async () => {
    const span = { setAttribute: vi.fn() };
    const traceContext = {
      tracing: {
        enterSpan: vi.fn(async (_name: string, callback: (activeSpan: typeof span) => Promise<string> | string) =>
          callback(span),
        ),
      },
    } as unknown as Parameters<typeof runWithTraceSpan>[0];

    await expect(
      runWithTraceSpan(traceContext, 'checkout.start', { operation: 'checkout_start', unsafe: undefined }, () => 'ok'),
    ).resolves.toBe('ok');
    expect(traceContext?.tracing?.enterSpan).toHaveBeenCalledWith('checkout.start', expect.any(Function));
    expect(span.setAttribute).toHaveBeenCalledExactlyOnceWith('operation', 'checkout_start');

    const error = new Error('boom');
    await expect(runWithTraceSpan(traceContext, 'checkout.start', {}, () => Promise.reject(error))).rejects.toBe(error);
  });
});
