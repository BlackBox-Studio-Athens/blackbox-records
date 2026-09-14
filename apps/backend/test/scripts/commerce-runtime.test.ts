import { describe, expect, it, vi } from 'vitest';

const { handleRequest, deliver } = vi.hoisted(() => ({ handleRequest: vi.fn(), deliver: vi.fn() }));
vi.mock('../../src/interfaces/http/app', () => ({ createHttpApp: () => ({ fetch: handleRequest }) }));
vi.mock('../../src/interfaces/scheduled/run-paid-order-delivery-schedule', () => ({
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

import worker, { CommerceRuntime } from '../../src/index';
import type { AppBindings } from '../../src/env';

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
    expect(handleRequest).toHaveBeenCalledExactlyOnceWith(request, env, ctx);
    await worker.scheduled({ scheduledTime: 1234 } as ScheduledController, bindings);
    expect(deliver).toHaveBeenCalledExactlyOnceWith(env, new Date(1234));
    deliver.mockRejectedValueOnce(new Error('Retry later'));
    await expect(worker.scheduled({ scheduledTime: 5678 } as ScheduledController, bindings)).rejects.toThrow(
      'Retry later',
    );
  });
});
