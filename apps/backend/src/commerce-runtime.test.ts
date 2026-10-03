import { describe, expect, it, vi } from 'vitest';

const { handleRequest, preflight, deliver, scope } = vi.hoisted(() => ({
  handleRequest: vi.fn(),
  preflight: vi.fn(),
  deliver: vi.fn(),
  scope: vi.fn((env) => ({ ...env })),
}));
vi.mock('./interfaces/http/app', () => ({
  createHttpApp: (options?: { preflightOnly?: boolean }) => ({
    fetch: options?.preflightOnly ? preflight : handleRequest,
  }),
}));
vi.mock('./infrastructure/persistence/prisma', () => ({ createPrismaClientScope: scope }));
vi.mock('./application/commerce/orders/run-paid-order-delivery-schedule', () => ({
  runPaidOrderDeliverySchedule: deliver,
}));
vi.mock('cloudflare:workers', () => ({
  DurableObject: class {
    constructor(
      public ctx: unknown,
      public env: unknown,
    ) {}
  },
}));

import worker, { CommerceRuntime } from './index';
import type { AppBindings } from './platform/env';

describe('free-tier commerce execution', () => {
  it('forwards HTTP and scheduled work through the object without changing their inputs', async () => {
    const ctx = {} as DurableObjectState;
    const env = {} as AppBindings;
    const runtime = new CommerceRuntime(ctx, env);
    const bindings = {
      COMMERCE_RUNTIME: { getByName: vi.fn().mockReturnValue(runtime) },
    } as unknown as Parameters<typeof worker.fetch>[1];
    const request = new Request('https://shop.example/api/stripe/webhooks', {
      method: 'POST',
      headers: { 'Stripe-Signature': 'unchanged' },
      body: 'original signed body',
    });
    const response = new Response('ok');
    handleRequest.mockResolvedValueOnce(response);
    expect(await worker.fetch(request as Parameters<typeof worker.fetch>[0], bindings)).toBe(response);
    const scopedBindings = scope.mock.results.at(-1)!.value;
    expect(scopedBindings).not.toBe(env);
    expect(handleRequest).toHaveBeenCalledExactlyOnceWith(request, scopedBindings, ctx);
    await worker.scheduled({ scheduledTime: 1234 } as ScheduledController, bindings);
    expect(deliver).toHaveBeenCalledExactlyOnceWith(scopedBindings, new Date(1234));
    deliver.mockRejectedValueOnce(new Error('Retry later'));
    await expect(worker.scheduled({ scheduledTime: 5678 } as ScheduledController, bindings)).rejects.toThrow(
      'Retry later',
    );
  });

  it('answers API preflights without resolving the Durable Object', async () => {
    const getByName = vi.fn();
    const bindings = { COMMERCE_RUNTIME: { getByName } } as unknown as Parameters<typeof worker.fetch>[1];
    const request = new Request('https://shop.example/api/store/items/record', { method: 'OPTIONS' });
    const response = new Response(null, { status: 204 });
    preflight.mockResolvedValueOnce(response);
    expect(await worker.fetch(request as Parameters<typeof worker.fetch>[0], bindings)).toBe(response);
    expect(preflight).toHaveBeenCalledExactlyOnceWith(request, bindings);
    expect(getByName).not.toHaveBeenCalled();
  });
});
