import { describe, expect, it, vi } from 'vitest';
import { drainWithdrawalDeliveries, recordOrderWithdrawal } from './order-withdrawal';
import type { OrderWithdrawalRepository, WithdrawalDelivery } from '../../../domain/commerce/repositories/spi';
import { readEmailRuntimeConfig, type EmailProviderGateway } from '../../email';

const config = readEmailRuntimeConfig({
  PRODUCT_ENVIRONMENT: 'UAT',
  RESEND_API_KEY: 're_mock_test',
  RESEND_FROM_EMAIL: 'orders@blackboxrecordsathens.com',
  RESEND_OPS_TO_EMAIL: 'blackboxrecordsathens@gmail.com',
  RESEND_REPLY_TO_EMAIL: 'support@blackboxrecordsathens.com',
  RESEND_NEWSLETTER_TOPIC_ID: 'topic_mock',
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: 'uat-sink@ambkime.resend.app',
  EMAIL_BRAND_HOME_URL: 'https://blackbox-records-web-uat.pages.dev/',
  EMAIL_BRAND_LOGO_URL: 'https://blackbox-records-web-uat.pages.dev/assets/images/brand/logo-horizontal.png',
});
const now = new Date('2026-10-09T10:00:00.000Z');
const delivery: WithdrawalDelivery = {
  id: 'notice-1',
  name: '<script>Buyer</script>',
  contract: '<a href="https://example.com">Record</a>',
  email: 'buyer@example.com',
  submittedAt: now.toISOString(),
  fingerprint: 'f',
  deliveryId: 'notice-1:acknowledgement',
  kind: 'acknowledgement',
  attemptCount: 1,
  leaseUntil: '2026-10-09T10:05:00.000Z',
};
function fixture(claim = delivery) {
  const repository: OrderWithdrawalRepository = {
    record: vi.fn(),
    listRecent: vi.fn(),
    claim: vi.fn().mockResolvedValueOnce(claim).mockResolvedValue(null),
    finish: vi.fn().mockResolvedValue(true),
  };
  const provider: EmailProviderGateway = {
    sendEmail: vi.fn().mockResolvedValue({ ok: true }),
    registerNewsletterContact: vi.fn(),
  };
  const logger = { info: vi.fn(), warn: vi.fn() };
  return { repository, provider, logger, config, now, limit: 2 };
}

describe('withdrawal application', () => {
  it('uses a fixed confirmation statement, escaped content and UAT sink without order/stock authority', async () => {
    const input = fixture();
    expect(await drainWithdrawalDeliveries(input)).toBe(1);
    expect(input.provider.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'uat-sink@ambkime.resend.app',
        replyTo: 'orders@blackboxrecordsathens.com',
        text: expect.stringContaining(delivery.submittedAt),
      }),
    );
    const message = vi.mocked(input.provider.sendEmail).mock.calls[0]![0];
    expect(message.html).not.toContain('<script>');
    expect(message.html).not.toContain('<a href="https://example.com">');
    expect(message.html).toContain('&lt;script&gt;');
    expect(message.text).toContain('I hereby withdraw from the contract identified below.');
    expect(JSON.stringify(input.logger.info.mock.calls)).not.toContain(delivery.email);
    expect(input.repository.finish).toHaveBeenCalledWith(delivery, {
      status: 'delivered',
      nextAttemptAt: null,
      safeReason: null,
    });
  });

  it('retries unknown provider outcomes with the same key and preserves the declaration time', async () => {
    const input = fixture();
    vi.mocked(input.provider.sendEmail)
      .mockRejectedValueOnce(new Error('sensitive provider detail'))
      .mockResolvedValue({ ok: true });
    await drainWithdrawalDeliveries(input);
    expect(input.repository.finish).toHaveBeenCalledWith(
      delivery,
      expect.objectContaining({ status: 'pending', nextAttemptAt: '2026-10-09T10:15:00.000Z' }),
    );
    vi.mocked(input.repository.claim)
      .mockResolvedValueOnce({ ...delivery, attemptCount: 2 })
      .mockResolvedValue(null);
    await drainWithdrawalDeliveries({ ...input, now: new Date('2026-10-09T10:15:00.000Z') });
    const calls = vi.mocked(input.provider.sendEmail).mock.calls;
    expect(calls[0]![0].idempotencyKey).toBe(calls[1]![0].idempotencyKey);
    expect(calls[0]![0].text).toBe(calls[1]![0].text);
    expect(JSON.stringify(input.logger.warn.mock.calls)).not.toContain('sensitive');
  });

  it('keeps terminal failures for operator review and never retries outside provider deduplication window', async () => {
    const input = fixture({ ...delivery, attemptCount: 5 });
    vi.mocked(input.provider.sendEmail).mockResolvedValue({ ok: false, retryable: true, reason: 'rate_limited' });
    await drainWithdrawalDeliveries(input);
    expect(input.repository.finish).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'needs_review', nextAttemptAt: null }),
    );
    const expired = fixture();
    await drainWithdrawalDeliveries({ ...expired, now: new Date('2026-10-10T10:00:00.000Z') });
    expect(expired.provider.sendEmail).not.toHaveBeenCalled();
    expect(expired.repository.finish).toHaveBeenCalledWith(
      delivery,
      expect.objectContaining({ status: 'needs_review' }),
    );
  });

  it('normalizes declarant fields and fingerprints content independently of request time', async () => {
    const input = fixture();
    vi.mocked(input.repository.record).mockImplementation(async (notice) => ({ kind: 'recorded', withdrawal: notice }));
    const declaration = { name: ' Buyer ', contract: ' record ', email: 'Buyer@Example.com ' };
    const first = await recordOrderWithdrawal({
      declaration,
      id: '1',
      requester: '192.0.2.1',
      repository: input.repository,
      now,
    });
    await recordOrderWithdrawal({
      declaration,
      id: '1',
      requester: '192.0.2.2',
      repository: input.repository,
      now: new Date(now.getTime() + 1000),
    });
    const calls = vi.mocked(input.repository.record).mock.calls;
    expect(calls[0]![0].fingerprint).toBe(calls[1]![0].fingerprint);
    expect(calls[0]![0].requesterHash).not.toBe(calls[1]![0].requesterHash);
    expect(first).toMatchObject({
      kind: 'recorded',
      receipt: { submittedAt: now.toISOString(), receiptText: expect.stringContaining('Name: Buyer') },
    });
  });
});
