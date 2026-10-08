import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  beforeEach(() => {
    handleRequest.mockReset();
    preflight.mockReset();
    deliver.mockReset();
    scope.mockClear();
  });

  it('uses current scalar bindings for A → B → A without retaining removed options or changing resources', async () => {
    const a = {
      PRODUCT_ENVIRONMENT: 'PRD',
      NATIVE_CHECKOUT_ENABLED: 'true',
      PRD_LAUNCH_APPROVED: 'true',
      PRD_AVAILABILITY_ALERTS_APPROVED: 'true',
      STRIPE_SECRET_KEY: 'sk_test_A',
      STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_A',
      STRIPE_WEBHOOK_SECRET: 'whsec_A',
      STRIPE_API_BASE_URL: 'https://stripe-A.example',
      CHECKOUT_RETURN_ORIGINS: 'https://shop-A.example',
      RESEND_API_KEY: 're_A',
    } as const;
    const b = {
      PRODUCT_ENVIRONMENT: 'PRD',
      NATIVE_CHECKOUT_ENABLED: 'false',
      STRIPE_SECRET_KEY: 'sk_test_B',
      STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_B',
    } as const;
    const env = { ...a, COMMERCE_DB: {}, FLAGS: {} } as AppBindings;
    const runtime = new CommerceRuntime({} as DurableObjectState, env);
    const namespace = { getByName: () => runtime };
    handleRequest.mockImplementation(async () => new Response('ok'));
    for (const config of [a, b, a]) {
      const bindings = { ...config, COMMERCE_RUNTIME: namespace } as unknown as Parameters<typeof worker.fetch>[1];
      await worker.fetch(
        new Request('https://shop.example/api/store/capabilities') as Parameters<typeof worker.fetch>[0],
        bindings,
      );
      const received = handleRequest.mock.calls.at(-1)![1] as AppBindings;
      expect(received).toMatchObject({
        ...config,
        PRD_LAUNCH_APPROVED: 'PRD_LAUNCH_APPROVED' in config ? config.PRD_LAUNCH_APPROVED : undefined,
        PRD_AVAILABILITY_ALERTS_APPROVED:
          'PRD_AVAILABILITY_ALERTS_APPROVED' in config ? config.PRD_AVAILABILITY_ALERTS_APPROVED : undefined,
        STRIPE_WEBHOOK_SECRET: 'STRIPE_WEBHOOK_SECRET' in config ? config.STRIPE_WEBHOOK_SECRET : undefined,
        STRIPE_API_BASE_URL: 'STRIPE_API_BASE_URL' in config ? config.STRIPE_API_BASE_URL : undefined,
        CHECKOUT_RETURN_ORIGINS: 'CHECKOUT_RETURN_ORIGINS' in config ? config.CHECKOUT_RETURN_ORIGINS : undefined,
        RESEND_API_KEY: 'RESEND_API_KEY' in config ? config.RESEND_API_KEY : undefined,
      });
      expect(received.COMMERCE_DB).toBe(env.COMMERCE_DB);
      expect(received.FLAGS).toBe(env.FLAGS);
      await worker.scheduled({ scheduledTime: 1234 } as ScheduledController, bindings);
      expect(deliver.mock.calls.at(-1)![0]).toMatchObject(received);
    }
    expect(env).toMatchObject(a);
  });

  it('isolates overlapping calls to the same object', async () => {
    let started!: () => void;
    let resume!: () => void;
    const firstStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    const paused = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const env = { PRODUCT_ENVIRONMENT: 'PRD', STRIPE_SECRET_KEY: 'old', COMMERCE_DB: {} } as AppBindings;
    const runtime = new CommerceRuntime({} as DurableObjectState, env);
    handleRequest.mockImplementation(async (request, bindings) => {
      if (new URL(request.url).pathname.endsWith('/A')) {
        started();
        await paused;
      }
      return new Response(bindings.STRIPE_SECRET_KEY);
    });
    const send = (key: string) =>
      worker.fetch(
        new Request(`https://shop.example/api/${key}`) as Parameters<typeof worker.fetch>[0],
        {
          PRODUCT_ENVIRONMENT: 'PRD',
          STRIPE_SECRET_KEY: key,
          STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: `pmc_${key}`,
          COMMERCE_RUNTIME: { getByName: () => runtime },
        } as unknown as Parameters<typeof worker.fetch>[1],
      );
    const first = send('A');
    await firstStarted;
    try {
      expect(await (await send('B')).text()).toBe('B');
    } finally {
      resume();
    }
    expect(await (await first).text()).toBe('A');
    expect(env.STRIPE_SECRET_KEY).toBe('old');
  });

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
    expect(deliver).toHaveBeenCalledExactlyOnceWith(expect.objectContaining(scopedBindings), new Date(1234), {});
    deliver.mockRejectedValueOnce(new Error('Retry later'));
    await expect(worker.scheduled({ scheduledTime: 5678 } as ScheduledController, bindings)).rejects.toThrow(
      'Retry later',
    );
  });

  it('names alert items from published content when the combined Worker binds it', async () => {
    const env = { PRODUCT_ENVIRONMENT: 'UAT', MEDIA: { get: vi.fn() } } as unknown as AppBindings;
    deliver.mockClear();
    await new CommerceRuntime({} as DurableObjectState, env).runPaidOrderDelivery(1234, env);
    expect(deliver).toHaveBeenCalledExactlyOnceWith(expect.any(Object), new Date(1234), {
      itemNames: expect.any(Function),
    });
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
