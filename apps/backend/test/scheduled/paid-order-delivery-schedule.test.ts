import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import worker from '../../src';
import { runPaidOrderDeliverySchedule } from '../../src/interfaces/scheduled/run-paid-order-delivery-schedule';

describe('paid order delivery schedule', () => {
  it('exports one scheduled handler and treats an empty delivery queue as a no-op', async () => {
    expect(worker.scheduled).toBeTypeOf('function');

    await expect(runPaidOrderDeliverySchedule(env, new Date('2026-09-01T10:30:00.000Z'))).resolves.toEqual([]);
  });
});
