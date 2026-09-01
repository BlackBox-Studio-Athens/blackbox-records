import { describe, expect, it, vi } from 'vitest';

import {
  drainDuePaidOrderDeliveries,
  processPaidOrderDelivery,
  type ClaimedPaidOrderDelivery,
  type PaidOrderDeliveryRepository,
} from '../../../../src/application/commerce/orders';
import { readEmailRuntimeConfig, type EmailProviderGateway } from '../../../../src/application/email';
import { currentPaidCheckoutOrder } from '../../../fixtures/current-paid-checkout-order';

const config = readEmailRuntimeConfig({
  EMAIL_BRAND_HOME_URL: 'https://blackbox-studio-athens.github.io/blackbox-records/',
  EMAIL_BRAND_LOGO_URL:
    'https://blackbox-studio-athens.github.io/blackbox-records/assets/images/brand/logo-horizontal.png',
  PRODUCT_ENVIRONMENT: 'UAT',
  RESEND_API_KEY: 're_mock_blackbox_local',
  RESEND_FROM_EMAIL: 'orders@blackboxrecordsathens.com',
  RESEND_NEWSLETTER_TOPIC_ID: 'topic_mock_blackbox_newsletter',
  RESEND_OPS_TO_EMAIL: 'blackboxrecordsathens@gmail.com',
  RESEND_REPLY_TO_EMAIL: 'support@blackboxrecordsathens.com',
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: 'uat-sink@ambkime.resend.app',
});

const attemptedAt = new Date('2026-09-01T10:30:00.000Z');

describe('paid order delivery processing', () => {
  it('reschedules a safe transient failure fifteen minutes later', async () => {
    const repository = new InMemoryPaidOrderDeliveryRepository([claimedDelivery()]);
    const provider = emailProvider({ ok: false, reason: 'rate_limited', retryable: true });

    const result = await processPaidOrderDelivery({
      attemptedAt,
      config,
      deliveryId: 'delivery_1',
      logger: silentLogger(),
      order: currentPaidCheckoutOrder(false),
      provider,
      repository,
    });

    expect(result).toEqual({
      deliveryId: 'delivery_1',
      kind: 'rescheduled',
      nextAttemptAt: new Date('2026-09-01T10:45:00.000Z'),
      safeReason: 'rate_limited',
    });
    expect(repository.rescheduled).toHaveLength(1);
  });

  it('moves a fifth failed attempt to needs review', async () => {
    const repository = new InMemoryPaidOrderDeliveryRepository([claimedDelivery({ attemptCount: 5 })]);

    const result = await processPaidOrderDelivery({
      attemptedAt,
      config,
      deliveryId: 'delivery_1',
      logger: silentLogger(),
      order: currentPaidCheckoutOrder(false),
      provider: emailProvider({ ok: false, reason: 'provider_unavailable', retryable: true }),
      repository,
    });

    expect(result).toEqual({
      deliveryId: 'delivery_1',
      kind: 'needs_review',
      safeReason: 'provider_unavailable',
    });
    expect(repository.needsReview).toHaveLength(1);
    expect(repository.rescheduled).toHaveLength(0);
  });

  it('expires a 24-hour-old delivery without another provider request', async () => {
    const repository = new InMemoryPaidOrderDeliveryRepository([
      claimedDelivery({ createdAt: new Date('2026-08-31T10:30:00.000Z') }),
    ]);
    const provider = emailProvider({ ok: true });

    const result = await processPaidOrderDelivery({
      attemptedAt,
      config,
      deliveryId: 'delivery_1',
      logger: silentLogger(),
      order: currentPaidCheckoutOrder(false),
      provider,
      repository,
    });

    expect(result).toEqual({
      deliveryId: 'delivery_1',
      kind: 'needs_review',
      safeReason: 'delivery_window_expired',
    });
    expect(provider.sendEmail).not.toHaveBeenCalled();
  });

  it('drains at most five rows sequentially and treats an empty drain as a no-op', async () => {
    const repository = new InMemoryPaidOrderDeliveryRepository(
      Array.from({ length: 6 }, (_, index) => claimedDelivery({ id: `delivery_${index + 1}` })),
    );
    const provider = emailProvider({ ok: true });
    const orders = { findById: vi.fn(async () => currentPaidCheckoutOrder(false)) };

    const results = await drainDuePaidOrderDeliveries({
      attemptedAt,
      config,
      logger: silentLogger(),
      orders,
      provider,
      repository,
    });

    expect(results).toHaveLength(5);
    expect(results.every((result) => result.kind === 'delivered')).toBe(true);
    expect(repository.deliveries).toHaveLength(1);
    expect(provider.sendEmail).toHaveBeenCalledTimes(5);

    const emptyResults = await drainDuePaidOrderDeliveries({
      attemptedAt,
      config,
      logger: silentLogger(),
      orders,
      provider,
      repository: new InMemoryPaidOrderDeliveryRepository([]),
    });

    expect(emptyResults).toEqual([]);
  });
});

class InMemoryPaidOrderDeliveryRepository implements PaidOrderDeliveryRepository {
  public readonly delivered: ClaimedPaidOrderDelivery[] = [];
  public readonly needsReview: ClaimedPaidOrderDelivery[] = [];
  public readonly rescheduled: ClaimedPaidOrderDelivery[] = [];

  public constructor(public readonly deliveries: ClaimedPaidOrderDelivery[]) {}

  public async claimDue(input: { deliveryId: string | null }) {
    const index = input.deliveryId ? this.deliveries.findIndex(({ id }) => id === input.deliveryId) : 0;
    if (index < 0 || this.deliveries.length === 0) return { kind: 'not_claimed' } as const;

    return { delivery: this.deliveries.splice(index, 1)[0]!, kind: 'claimed' } as const;
  }

  public async listSummaries() {
    return [];
  }

  public async markDelivered(input: { delivery: ClaimedPaidOrderDelivery }): Promise<boolean> {
    this.delivered.push(input.delivery);
    return true;
  }

  public async markNeedsReview(input: { delivery: ClaimedPaidOrderDelivery }): Promise<boolean> {
    this.needsReview.push(input.delivery);
    return true;
  }

  public async reschedule(input: { delivery: ClaimedPaidOrderDelivery }): Promise<boolean> {
    this.rescheduled.push(input.delivery);
    return true;
  }
}

function claimedDelivery(overrides: Partial<ClaimedPaidOrderDelivery> = {}): ClaimedPaidOrderDelivery {
  return {
    attemptCount: 1,
    createdAt: new Date('2026-09-01T10:00:00.000Z'),
    id: 'delivery_1',
    kind: 'shopper_confirmation',
    leaseUntil: new Date('2026-09-01T10:40:00.000Z'),
    nextAttemptAt: new Date('2026-09-01T10:30:00.000Z'),
    orderId: 'order_paid',
    status: 'pending',
    updatedAt: new Date('2026-09-01T10:30:00.000Z'),
    ...overrides,
  };
}

function emailProvider(result: Awaited<ReturnType<EmailProviderGateway['sendEmail']>>): EmailProviderGateway {
  return {
    registerNewsletterContact: vi.fn(async () => result),
    sendEmail: vi.fn(async () => result),
  };
}

function silentLogger() {
  return { info: vi.fn(), warn: vi.fn() };
}
