import { describe, expect, it, vi } from 'vitest';

import { drainDueAvailabilityAlerts } from './availability-alert-delivery';
import { readEmailRuntimeConfig, type EmailProviderGateway } from '../../email';
import type { AvailabilityAlertDelivery, AvailabilityAlertRepository } from '../../../domain/commerce/repositories/spi';
import { createStockQuantity, parseStoreItemSlug, parseVariantId } from '../../../domain/commerce';

// 22:30 UTC on 31 October is 1 November in Europe/Athens.
const attemptedAt = new Date('2026-10-31T22:30:00.000Z');
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

function delivery(overrides: Partial<AvailabilityAlertDelivery> = {}, attemptCount = 1): AvailabilityAlertDelivery {
  return {
    alert: {
      id: `alert_${attemptCount}`,
      variantId: parseVariantId('variant_anarchotribal'),
      email: 'waiting.shopper@example.com',
      attemptCount,
      leaseUntil: new Date('2026-10-31T22:40:00.000Z'),
      createdAt: new Date('2026-10-01T10:00:00.000Z'),
    },
    storeItemSlug: parseStoreItemSlug('anarchotribal-vinyl'),
    itemFormat: 'Vinyl',
    availability: { status: 'available', canBuy: true },
    stock: { onlineQuantity: createStockQuantity(3), zeroStockState: 'coming_soon', preorder: null },
    ...overrides,
  };
}

const publishedNames: Record<string, { title: string; artist: string | null }> = {
  'anarchotribal-vinyl': { title: 'Anarchotribal', artist: 'Ouranopithecus' },
};

function setup(claims: AvailabilityAlertDelivery[], options: { budgetLeft?: number } = {}) {
  let budgetLeft = options.budgetLeft ?? 40;
  const queue = [...claims];
  const repository = {
    request: vi.fn<AvailabilityAlertRepository['request']>(),
    countWaiting: vi.fn<AvailabilityAlertRepository['countWaiting']>(),
    deleteExpired: vi.fn<AvailabilityAlertRepository['deleteExpired']>().mockResolvedValue(2),
    reserveSend: vi.fn<AvailabilityAlertRepository['reserveSend']>(async () => budgetLeft-- > 0),
    claimDue: vi.fn<AvailabilityAlertRepository['claimDue']>(async () => queue.shift() ?? null),
    reschedule: vi.fn<AvailabilityAlertRepository['reschedule']>().mockResolvedValue(true),
    delete: vi.fn<AvailabilityAlertRepository['delete']>().mockResolvedValue(true),
  };
  const provider = {
    registerNewsletterContact: vi.fn<EmailProviderGateway['registerNewsletterContact']>(),
    sendEmail: vi.fn<EmailProviderGateway['sendEmail']>().mockResolvedValue({ ok: true }),
  };
  const logger = { info: vi.fn(), warn: vi.fn() };
  const itemNames = vi.fn(async (slug: string) => publishedNames[slug] ?? null);
  const run = (limit = 5) =>
    drainDueAvailabilityAlerts({ attemptedAt, config, itemNames, limit, logger, provider, repository });
  return { itemNames, logger, provider, repository, run };
}

describe('availability alert drain', () => {
  it('expires old alerts, sends one email per due alert through the UAT sink and deletes it', async () => {
    const { provider, repository, run } = setup([delivery()]);

    await expect(run()).resolves.toEqual({
      budgetExhausted: false,
      deliveredCount: 1,
      droppedCount: 0,
      expiredCount: 2,
      leaseLostCount: 0,
      rescheduledCount: 0,
      unnamedCount: 0,
    });
    expect(repository.deleteExpired).toHaveBeenCalledWith({
      now: attemptedAt,
      requestedBefore: new Date('2025-10-31T22:30:00.000Z'),
    });
    expect(repository.reserveSend).toHaveBeenCalledWith('2026-11-01', 40);
    const message = provider.sendEmail.mock.calls[0]![0];
    expect(message).toMatchObject({
      to: 'uat-sink@ambkime.resend.app',
      subject: 'Anarchotribal is available',
      idempotencyKey: expect.stringContaining('availability_alert:alert_1'),
      tags: expect.arrayContaining([
        { name: 'purpose', value: 'availability_alert' },
        { name: 'sink_routed', value: 'true' },
      ]),
    });
    expect(message.text).toContain('Anarchotribal by Ouranopithecus can now be bought on the BlackBox Records Store.');
    expect(message.text).not.toContain('BlackBox Records - ');
    expect(message.text).toContain('https://blackbox-records-web-uat.pages.dev/store/anarchotribal-vinyl/');
    expect(message.text).not.toMatch(/€|left|copies/);
    expect(repository.delete).toHaveBeenCalledWith(delivery().alert);
  });

  it('names an open pre-order with the shopper-visible ship estimate', async () => {
    const preorder = {
      startedAt: '2026-10-01T10:00:00.000Z',
      shipEstimate: { kind: 'month', month: '2026-11', part: null },
    } as const;
    const { provider, run } = setup([delivery({ stock: { ...delivery().stock!, preorder } })]);

    await run();

    const message = provider.sendEmail.mock.calls[0]![0];
    expect(message.subject).toBe('Anarchotribal is on pre-order');
    expect(message.text).toContain(
      'Anarchotribal by Ouranopithecus can now be pre-ordered. Expected to ship around November 2026.',
    );
  });

  it('stops at the daily budget, keeps the claimed alert in place and logs no address', async () => {
    const { logger, provider, repository, run } = setup([delivery(), delivery({}, 2), delivery({}, 3)], {
      budgetLeft: 1,
    });

    await expect(run()).resolves.toMatchObject({ deliveredCount: 1, budgetExhausted: true });
    expect(provider.sendEmail).toHaveBeenCalledTimes(1);
    expect(repository.claimDue).toHaveBeenCalledTimes(2);
    expect(repository.reschedule).toHaveBeenCalledWith({
      alert: delivery({}, 2).alert,
      nextAttemptAt: attemptedAt,
      updatedAt: attemptedAt,
      refundAttempt: true,
    });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'availability_alert_budget_exhausted', day: '2026-11-01' }),
    );
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain('@');
  });

  it('holds an alert back until the accepted publication names its item, and never uses the product name', async () => {
    const { itemNames, logger, provider, repository, run } = setup([
      delivery({ storeItemSlug: parseStoreItemSlug('unpublished-item') }),
    ]);
    itemNames.mockRejectedValueOnce(new Error('snapshot unavailable'));
    const failing = setup([delivery()]);
    failing.itemNames.mockRejectedValueOnce(new Error('snapshot unavailable'));

    await expect(run(1)).resolves.toMatchObject({ unnamedCount: 1, deliveredCount: 0 });
    await expect(failing.run(1)).resolves.toMatchObject({ unnamedCount: 1, deliveredCount: 0 });
    for (const target of [{ provider, repository }, failing]) {
      expect(target.provider.sendEmail).not.toHaveBeenCalled();
      expect(target.repository.reserveSend).not.toHaveBeenCalled();
      expect(target.repository.reschedule).toHaveBeenCalledWith(
        expect.objectContaining({ refundAttempt: true, nextAttemptAt: new Date('2026-10-31T22:40:00.000Z') }),
      );
    }
    expect(logger.warn).toHaveBeenCalledWith({
      event: 'availability_alert_item_unnamed',
      storeItemSlug: 'unpublished-item',
    });
  });

  it('omits the artist when the published item has none', async () => {
    publishedNames['untitled-tape'] = { title: 'Untitled Tape', artist: null };
    const { provider, run } = setup([delivery({ storeItemSlug: parseStoreItemSlug('untitled-tape') })]);
    await run();
    const message = provider.sendEmail.mock.calls[0]![0];
    expect(message.text).toContain('Untitled Tape can now be bought on the BlackBox Records Store.');
    expect(message.text).not.toContain('Artist:');
  });

  it('respects the rows left by order email', async () => {
    const { provider, repository, run } = setup([delivery()]);
    await expect(run(0)).resolves.toMatchObject({ deliveredCount: 0, expiredCount: 2 });
    expect(repository.claimDue).not.toHaveBeenCalled();
    expect(provider.sendEmail).not.toHaveBeenCalled();
  });

  it('releases an alert whose variant stopped being orderable before sending', async () => {
    const { provider, repository, run } = setup([
      delivery({ stock: { ...delivery().stock!, onlineQuantity: createStockQuantity(0) } }),
    ]);

    await run(1);

    expect(provider.sendEmail).not.toHaveBeenCalled();
    expect(repository.reserveSend).not.toHaveBeenCalled();
    expect(repository.reschedule).toHaveBeenCalledWith(expect.objectContaining({ refundAttempt: true }));
  });

  it('retries a provider failure with backoff and deletes after the fifth attempt', async () => {
    const { logger, provider, repository, run } = setup([delivery({}, 1), delivery({}, 5)]);
    provider.sendEmail.mockResolvedValue({ ok: false, reason: 'rate_limited', retryable: true });

    await expect(run()).resolves.toMatchObject({ rescheduledCount: 1, droppedCount: 1, deliveredCount: 0 });
    expect(repository.reschedule).toHaveBeenCalledWith({
      alert: delivery({}, 1).alert,
      nextAttemptAt: new Date('2026-10-31T22:45:00.000Z'),
      updatedAt: attemptedAt,
      refundAttempt: false,
    });
    expect(repository.delete).toHaveBeenCalledWith(delivery({}, 5).alert);
    expect(logger.warn.mock.calls.map(([record]) => record)).toEqual([
      {
        attemptCount: 1,
        event: 'availability_alert_delivery_failed',
        outcome: 'rescheduled',
        safeReason: 'rate_limited',
      },
      {
        attemptCount: 5,
        event: 'availability_alert_delivery_failed',
        outcome: 'deleted',
        safeReason: 'rate_limited',
      },
    ]);
  });

  it('deletes after a permanent failure and retries an unknown outcome under the same key', async () => {
    const { provider, repository, run } = setup([delivery({}, 1), delivery({}, 2)]);
    provider.sendEmail
      .mockResolvedValueOnce({ ok: false, reason: 'validation', retryable: false })
      .mockRejectedValueOnce(new Error('network'));

    await expect(run()).resolves.toMatchObject({ droppedCount: 1, rescheduledCount: 1 });
    expect(repository.delete).toHaveBeenCalledWith(delivery({}, 1).alert);
    expect(repository.reschedule).toHaveBeenCalledWith(
      expect.objectContaining({ alert: delivery({}, 2).alert, refundAttempt: false }),
    );
  });
});
