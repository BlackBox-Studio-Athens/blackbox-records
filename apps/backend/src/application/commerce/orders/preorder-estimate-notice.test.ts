import { describe, expect, it, vi } from 'vitest';

import { drainDuePreorderEstimateNotices } from './preorder-estimate-notice';
import { readEmailRuntimeConfig, type EmailProviderGateway } from '../../email';
import type {
  CheckoutOrderRecord,
  ClaimedPreorderEstimateDelivery,
  PreorderEstimateDeliveryRecord,
  PreorderEstimateDeliveryRepository,
} from '../../../domain/commerce/repositories/spi';
import { currentPaidCheckoutOrder } from '../../../../test/fixtures/current-paid-checkout-order';

const attemptedAt = new Date('2026-09-01T10:30:00.000Z');
const config = readEmailRuntimeConfig({
  EMAIL_BRAND_HOME_URL: 'https://blackbox-records-web-uat.pages.dev/',
  EMAIL_BRAND_LOGO_URL: 'https://blackbox-records-web-uat.pages.dev/assets/images/brand/logo-horizontal.png',
  PRODUCT_ENVIRONMENT: 'UAT',
  RESEND_API_KEY: 're_mock_blackbox_local',
  RESEND_FROM_EMAIL: 'orders@blackboxrecordsathens.com',
  RESEND_NEWSLETTER_TOPIC_ID: 'topic_mock_blackbox_newsletter',
  RESEND_OPS_TO_EMAIL: 'blackboxrecordsathens@gmail.com',
  RESEND_REPLY_TO_EMAIL: 'support@blackboxrecordsathens.com',
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: 'uat-sink@ambkime.resend.app',
});

function setup(overrides: Partial<ClaimedPreorderEstimateDelivery> = {}) {
  const order = currentPaidCheckoutOrder(false);
  order.lines[0].preorder = {
    startedAt: '2026-08-01T10:00:00.000Z',
    shipEstimate: { kind: 'month', month: '2026-10', part: null },
  };
  const delivery: ClaimedPreorderEstimateDelivery = {
    id: 'notice_1',
    orderId: order.id,
    variantId: order.lines[0].variantId,
    sequence: 2,
    shipEstimate: { kind: 'date', date: '2026-11-20' },
    attemptCount: 1,
    status: 'pending',
    createdAt: new Date('2026-09-01T10:00:00.000Z'),
    updatedAt: attemptedAt,
    nextAttemptAt: attemptedAt,
    leaseUntil: new Date('2026-09-01T10:40:00.000Z'),
    providerMessageId: null,
    safeReason: null,
    deliveredAt: null,
    needsReviewAt: null,
    ...overrides,
  };
  const repository = {
    claimDue: vi
      .fn<PreorderEstimateDeliveryRepository['claimDue']>()
      .mockResolvedValueOnce({ kind: 'claimed', delivery })
      .mockResolvedValue({ kind: 'not_claimed' }),
    findById: vi.fn<PreorderEstimateDeliveryRepository['findById']>().mockResolvedValue({ ...delivery }),
    markDelivered: vi.fn<PreorderEstimateDeliveryRepository['markDelivered']>().mockResolvedValue(true),
    markNeedsReview: vi.fn<PreorderEstimateDeliveryRepository['markNeedsReview']>().mockResolvedValue(true),
    reschedule: vi.fn<PreorderEstimateDeliveryRepository['reschedule']>().mockResolvedValue(true),
  };
  const provider = {
    registerNewsletterContact: vi.fn<EmailProviderGateway['registerNewsletterContact']>(),
    sendEmail: vi.fn<EmailProviderGateway['sendEmail']>().mockResolvedValue({ ok: true }),
  };
  const orders = { findById: vi.fn<(id: string) => Promise<CheckoutOrderRecord | null>>().mockResolvedValue(order) };
  return { attemptedAt, config, delivery, limit: 5, order, orders, provider, repository };
}

describe('preorder estimate notice drain', () => {
  it.each(['replaced', 'deleted'] as const)('skips a notice %s during the awaited order read', async (change) => {
    const input = setup();
    let current: PreorderEstimateDeliveryRecord | null = { ...input.delivery };
    input.repository.findById.mockImplementation(async () => current);
    input.orders.findById.mockImplementation(async () => {
      await Promise.resolve();
      current =
        change === 'deleted'
          ? null
          : {
              ...input.delivery,
              sequence: 3,
              attemptCount: 0,
              leaseUntil: null,
              shipEstimate: { kind: 'month', month: '2026-12', part: null },
            };
      return input.order;
    });
    await expect(drainDuePreorderEstimateNotices(input)).resolves.toEqual([
      { deliveryId: 'notice_1', kind: 'lease_lost' },
    ]);
    expect(input.repository.findById).toHaveBeenCalledWith('notice_1');
    expect(input.provider.sendEmail).not.toHaveBeenCalled();
    expect(input.repository.markDelivered).not.toHaveBeenCalled();
    expect(input.repository.markNeedsReview).not.toHaveBeenCalled();
    expect(input.repository.reschedule).not.toHaveBeenCalled();
    if (current) expect(current).toMatchObject({ sequence: 3, attemptCount: 0, status: 'pending', leaseUntil: null });
  });

  it.each([
    { sequence: 3 },
    { attemptCount: 2 },
    { leaseUntil: new Date('2026-09-01T10:41:00.000Z') },
    { leaseUntil: null },
    { status: 'delivered' },
    { status: 'needs_review' },
  ] satisfies Partial<PreorderEstimateDeliveryRecord>[])(
    'skips a claim whose persisted ownership changed: %j',
    async (change) => {
      const input = setup();
      input.orders.findById.mockImplementation(async () => {
        await Promise.resolve();
        input.repository.findById.mockResolvedValue({ ...input.delivery, ...change });
        return input.order;
      });
      await expect(drainDuePreorderEstimateNotices(input)).resolves.toEqual([
        { deliveryId: 'notice_1', kind: 'lease_lost' },
      ]);
      expect(input.provider.sendEmail).not.toHaveBeenCalled();
      expect(input.repository.markDelivered).not.toHaveBeenCalled();
      expect(input.repository.markNeedsReview).not.toHaveBeenCalled();
      expect(input.repository.reschedule).not.toHaveBeenCalled();
    },
  );

  it('skips a still-matching lease that expires during the awaited order read', async () => {
    const input = setup();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(0);
    try {
      input.orders.findById.mockImplementation(async () => {
        await Promise.resolve();
        clock.mockReturnValue(10 * 60 * 1000);
        return input.order;
      });
      await expect(drainDuePreorderEstimateNotices(input)).resolves.toEqual([
        { deliveryId: 'notice_1', kind: 'lease_lost' },
      ]);
      expect(input.provider.sendEmail).not.toHaveBeenCalled();
      expect(input.repository.markNeedsReview).not.toHaveBeenCalled();
    } finally {
      clock.mockRestore();
    }
  });

  it('reviews the current claim if its delivery window expires during the awaited order read', async () => {
    const input = setup({ createdAt: new Date('2026-08-31T10:30:01.000Z') });
    const clock = vi.spyOn(Date, 'now').mockReturnValue(0);
    try {
      input.orders.findById.mockImplementation(async () => {
        await Promise.resolve();
        clock.mockReturnValue(1000);
        return input.order;
      });
      await expect(drainDuePreorderEstimateNotices(input)).resolves.toEqual([
        { deliveryId: 'notice_1', kind: 'needs_review', safeReason: 'delivery_window_expired' },
      ]);
      expect(input.provider.sendEmail).not.toHaveBeenCalled();
    } finally {
      clock.mockRestore();
    }
  });

  it('sends the saved line and edited estimates through existing UAT routing', async () => {
    const input = setup();
    await expect(drainDuePreorderEstimateNotices(input)).resolves.toEqual([
      { deliveryId: 'notice_1', kind: 'delivered' },
    ]);
    expect(input.orders.findById).toHaveBeenCalledWith(input.order.id);
    expect(input.provider.sendEmail).toHaveBeenCalledOnce();
    const message = input.provider.sendEmail.mock.calls[0]![0];
    expect(message.to).toBe('uat-sink@ambkime.resend.app');
    expect(message.text).toContain(input.order.lines[0].displayName);
    expect(message.text).toContain('around October 2026');
    expect(message.text).toContain('on 20 November 2026');
    expect(input.repository.markDelivered).toHaveBeenCalledWith({
      delivery: input.delivery,
      deliveredAt: attemptedAt,
      providerMessageId: null,
    });
    expect(input.repository.claimDue).toHaveBeenCalledTimes(2);
    expect(input.order.lines[0].preorder?.shipEstimate).toEqual({ kind: 'month', month: '2026-10', part: null });
  });

  it('keeps the provider identity on retry and changes it for a newer sequence', async () => {
    const keys: string[] = [];
    for (const sequence of [2, 2, 3]) {
      const input = setup({ sequence });
      input.provider.sendEmail.mockResolvedValue({ ok: false, reason: 'rate_limited', retryable: true });
      await expect(drainDuePreorderEstimateNotices(input)).resolves.toEqual([
        {
          deliveryId: 'notice_1',
          kind: 'rescheduled',
          nextAttemptAt: new Date('2026-09-01T10:45:00.000Z'),
          safeReason: 'rate_limited',
        },
      ]);
      expect(input.repository.reschedule).toHaveBeenCalledWith({
        delivery: input.delivery,
        nextAttemptAt: new Date('2026-09-01T10:45:00.000Z'),
        safeReason: 'rate_limited',
        updatedAt: attemptedAt,
      });
      keys.push(input.provider.sendEmail.mock.calls[0]![0].idempotencyKey);
    }
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[0]);
  });

  it.each(['missing', 'not_paid', 'incomplete', 'missing_line', 'ordinary_line'] as const)(
    'reviews %s without sending',
    async (state) => {
      const input = setup();
      if (state === 'missing') input.orders.findById.mockResolvedValue(null);
      if (state === 'not_paid') input.orders.findById.mockResolvedValue({ ...input.order, status: 'not_paid' });
      if (state === 'incomplete') input.orders.findById.mockResolvedValue({ ...input.order, shopperEmail: null });
      if (state === 'missing_line') input.delivery.variantId = 'variant_other';
      if (state === 'ordinary_line') input.order.lines[0].preorder = null;
      await expect(drainDuePreorderEstimateNotices(input)).resolves.toEqual([
        {
          deliveryId: 'notice_1',
          kind: 'needs_review',
          safeReason: 'incomplete_paid_fulfillment',
        },
      ]);
      expect(input.provider.sendEmail).not.toHaveBeenCalled();
    },
  );

  it('reviews at the 24-hour boundary before loading or sending', async () => {
    const input = setup({ createdAt: new Date('2026-08-31T10:30:00.000Z') });
    await expect(drainDuePreorderEstimateNotices(input)).resolves.toEqual([
      {
        deliveryId: 'notice_1',
        kind: 'needs_review',
        safeReason: 'delivery_window_expired',
      },
    ]);
    expect(input.orders.findById).not.toHaveBeenCalled();
    expect(input.provider.sendEmail).not.toHaveBeenCalled();
  });

  it.each(['fifth_attempt', 'permanent', 'uncertain'] as const)('reviews %s instead of retrying', async (state) => {
    const input = setup({ attemptCount: state === 'fifth_attempt' ? 5 : 1 });
    if (state === 'uncertain') input.provider.sendEmail.mockRejectedValue(new Error('acceptance unknown'));
    else
      input.provider.sendEmail.mockResolvedValue({
        ok: false,
        reason: state === 'permanent' ? 'validation' : 'provider_unavailable',
        retryable: state !== 'permanent',
      });
    const safeReason =
      state === 'uncertain'
        ? 'provider_outcome_unknown'
        : state === 'permanent'
          ? 'validation'
          : 'provider_unavailable';
    await expect(drainDuePreorderEstimateNotices(input)).resolves.toEqual([
      {
        deliveryId: 'notice_1',
        kind: 'needs_review',
        safeReason,
      },
    ]);
    expect(input.repository.markNeedsReview).toHaveBeenCalledWith({
      delivery: input.delivery,
      needsReviewAt: attemptedAt,
      safeReason,
    });
    expect(input.repository.reschedule).not.toHaveBeenCalled();
  });

  it.each(['delivered', 'rescheduled', 'needs_review'] as const)('reports a lost lease during %s', async (outcome) => {
    const input = setup();
    input.repository.markDelivered.mockResolvedValue(false);
    input.repository.reschedule.mockResolvedValue(false);
    input.repository.markNeedsReview.mockResolvedValue(false);
    if (outcome !== 'delivered')
      input.provider.sendEmail.mockResolvedValue({
        ok: false,
        reason: 'validation',
        retryable: outcome === 'rescheduled',
      });
    await expect(drainDuePreorderEstimateNotices(input)).resolves.toEqual([
      { deliveryId: 'notice_1', kind: 'lease_lost' },
    ]);
  });

  it('never claims with no remaining budget or sends without a claim', async () => {
    const input = setup();
    await expect(drainDuePreorderEstimateNotices({ ...input, limit: 0 })).resolves.toEqual([]);
    expect(input.repository.claimDue).not.toHaveBeenCalled();
    input.repository.claimDue.mockReset().mockResolvedValue({ kind: 'not_claimed' });
    await expect(drainDuePreorderEstimateNotices(input)).resolves.toEqual([]);
    expect(input.provider.sendEmail).not.toHaveBeenCalled();
  });

  it('processes only the supplied budget sequentially', async () => {
    const input = setup();
    input.repository.claimDue.mockReset().mockResolvedValue({ kind: 'claimed', delivery: input.delivery });
    let active = false;
    input.provider.sendEmail.mockImplementation(async () => {
      expect(active).toBe(false);
      active = true;
      await Promise.resolve();
      active = false;
      return { ok: true };
    });
    expect(await drainDuePreorderEstimateNotices({ ...input, limit: 2 })).toHaveLength(2);
    expect(input.repository.claimDue).toHaveBeenCalledTimes(2);
    expect(input.provider.sendEmail).toHaveBeenCalledTimes(2);
  });
});
