import { env } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import {
  createEmailConsentServices,
  hashEmailConsentToken,
  readEmailRuntimeConfig,
  type EmailConsentRecord,
  type EmailProviderGateway,
} from '../../application/email';
import { D1EmailConsentRepository } from './d1-email-consent-repository';
import { D1AvailabilityAlertRepository } from './d1-availability-alert-repository';
import { parseVariantId } from '../../domain/commerce';

const repository = new D1EmailConsentRepository(env.COMMERCE_DB);
const now = new Date('2031-10-14T10:00:00.000Z');
const config = readEmailRuntimeConfig({
  EMAIL_BRAND_HOME_URL: 'https://blackbox-records-web-uat.pages.dev/',
  EMAIL_BRAND_LOGO_URL: 'https://blackbox-records-web-uat.pages.dev/assets/images/brand/logo-horizontal.png',
  PRODUCT_ENVIRONMENT: 'LOCAL',
  RESEND_API_KEY: 're_mock_blackbox_local',
  RESEND_FROM_EMAIL: 'orders@blackboxrecordsathens.com',
  RESEND_NEWSLETTER_TOPIC_ID: 'topic_mock_blackbox_newsletter',
  RESEND_OPS_TO_EMAIL: 'blackboxrecordsathens@gmail.com',
  RESEND_REPLY_TO_EMAIL: 'support@blackboxrecordsathens.com',
});
const contact = () => ({
  email: `${crypto.randomUUID()}@example.com`,
  properties: { consentSource: 'site-form', consentCopyVersion: 'v1' },
  segmentId: null,
  topicId: 'topic_mock',
});

function setup() {
  const provider = {
    sendEmail: vi.fn<EmailProviderGateway['sendEmail']>().mockResolvedValue({ ok: true }),
    registerNewsletterContact: vi
      .fn<EmailProviderGateway['registerNewsletterContact']>()
      .mockResolvedValue({ ok: true }),
  };
  let current = now;
  const services = createEmailConsentServices({ config, provider, repository, now: () => current });
  const token = (index = 0) =>
    new URLSearchParams(
      new URL(/https:\/\/\S+/.exec(provider.sendEmail.mock.calls[index]![0].text)![0]).hash.slice(1),
    ).get('token')!;
  return {
    provider,
    services,
    token,
    time: (date: Date) => {
      current = date;
    },
  };
}

describe('D1 email consent capabilities', () => {
  it('sends ownership verification before Contact writes; hashes tokens; consumes once under concurrency', async () => {
    const { provider, services, token } = setup();
    const subscriber = contact();
    subscriber.email = `Fan-${crypto.randomUUID()}@example.com`;
    await expect(services.requestNewsletter(subscriber)).resolves.toEqual({ ok: true });
    // Delivery uses the exact requested mailbox; local-part case belongs to the recipient host.
    expect(provider.sendEmail.mock.calls[0]![0].to).toBe(subscriber.email);
    // A case variant shares the recipient cooldown instead of spending another daily send.
    await expect(services.requestNewsletter({ ...subscriber, email: subscriber.email.toUpperCase() })).resolves.toEqual(
      {
        ok: true,
      },
    );
    expect(provider.sendEmail).toHaveBeenCalledTimes(1);
    expect(provider.registerNewsletterContact).not.toHaveBeenCalled();
    const rawToken = token();
    expect(rawToken).toMatch(/^[a-f0-9]{64}$/);
    const record = await env.COMMERCE_DB.prepare('SELECT * FROM "EmailConsent" WHERE "email" = ?')
      .bind(subscriber.email)
      .first();
    expect(JSON.stringify(record)).not.toContain(rawToken);
    expect(record).toMatchObject({ tokenHash: await hashEmailConsentToken(rawToken), sentAt: now.toISOString() });
    await Promise.all([services.confirmNewsletter(rawToken), services.confirmNewsletter(rawToken)]);
    expect(provider.registerNewsletterContact).toHaveBeenCalledTimes(1);
    expect(provider.registerNewsletterContact).toHaveBeenCalledWith(
      expect.objectContaining({ ownershipVerified: true, email: subscriber.email }),
    );
    await expect(services.confirmNewsletter(rawToken)).resolves.toBeNull();
  });

  it('reuses the exact confirmation body and idempotency key after an unknown provider outcome', async () => {
    const { provider, services } = setup();
    const subscriber = contact();
    provider.sendEmail.mockRejectedValueOnce(new Error('Sensitive provider diagnostic'));
    await expect(services.requestNewsletter(subscriber)).resolves.toEqual({
      ok: false,
      reason: 'provider_unavailable',
      retryable: true,
    });
    await expect(services.requestNewsletter(subscriber)).resolves.toEqual({ ok: true });
    expect(provider.sendEmail.mock.calls[1]![0]).toEqual(provider.sendEmail.mock.calls[0]![0]);
    await services.requestNewsletter(subscriber);
    expect(provider.sendEmail).toHaveBeenCalledTimes(2);
    expect(provider.registerNewsletterContact).not.toHaveBeenCalled();
  });

  it('retries an unsent attempt with its own address when a later request uses another case', async () => {
    const { provider, services, token } = setup();
    const subscriber = { ...contact(), email: `CaseSensitive-${crypto.randomUUID()}@Example.com` };
    provider.sendEmail.mockRejectedValueOnce(new Error('unknown outcome'));
    await services.requestNewsletter(subscriber);
    await expect(services.requestNewsletter({ ...subscriber, email: subscriber.email.toLowerCase() })).resolves.toEqual(
      { ok: true },
    );
    expect(provider.sendEmail).toHaveBeenCalledTimes(2);
    expect(provider.sendEmail.mock.calls[1]![0]).toEqual(provider.sendEmail.mock.calls[0]![0]);
    expect(provider.sendEmail.mock.calls[1]![0].to).toBe(subscriber.email);
    await services.confirmNewsletter(token(1));
    expect(provider.registerNewsletterContact).toHaveBeenCalledWith(
      expect.objectContaining({ email: subscriber.email }),
    );
  });

  it('leaves a failed activation consumed; an old link cannot re-subscribe on retry', async () => {
    const { provider, services, token } = setup();
    await services.requestNewsletter(contact());
    provider.registerNewsletterContact.mockResolvedValueOnce({ ok: false, reason: 'rate_limited', retryable: true });
    await expect(services.confirmNewsletter(token())).resolves.toMatchObject({ ok: false, reason: 'rate_limited' });
    await expect(services.confirmNewsletter(token())).resolves.toBeNull();
    expect(provider.registerNewsletterContact).toHaveBeenCalledTimes(1);
  });

  it('rejects expired and wrong-purpose confirmation tokens without provider writes', async () => {
    const { provider, services, token, time } = setup();
    await services.requestNewsletter(contact());
    time(new Date('2031-10-15T10:00:00.000Z'));
    await expect(services.confirmNewsletter(token())).resolves.toBeNull();
    const withdrawal = setup();
    await withdrawal.services.requestAlertWithdrawal(contact().email);
    await expect(withdrawal.services.confirmNewsletter(withdrawal.token())).resolves.toBeNull();
    expect(provider.registerNewsletterContact).not.toHaveBeenCalled();
    expect(withdrawal.provider.registerNewsletterContact).not.toHaveBeenCalled();
  });

  it('withdraws pending and leased alerts atomically; guesses and used links cannot cancel later requests', async () => {
    const { services, token } = setup();
    const email = contact().email;
    const alerts = new D1AvailabilityAlertRepository(env.COMMERCE_DB);
    const variantId = parseVariantId(`variant_consent_${crypto.randomUUID()}`);
    const input = { variantId, email, consentCopyVersion: 'v1', consentedAt: now };
    await alerts.request(input, 2000);
    await env.COMMERCE_DB.prepare(
      `UPDATE "AvailabilityAlert" SET "status" = 'sending', "attemptCount" = 1, "leaseUntil" = ? WHERE "email" = ?`,
    )
      .bind('2031-10-14T10:10:00.000Z', email)
      .run();
    const claimed = await env.COMMERCE_DB.prepare('SELECT "id" FROM "AvailabilityAlert" WHERE "email" = ?')
      .bind(email)
      .first<{ id: string }>();
    await services.requestAlertWithdrawal(email);
    await services.withdrawAlerts('0'.repeat(64));
    expect(await alerts.countWaiting(variantId)).toBe(1);
    await services.withdrawAlerts(token());
    expect(await alerts.countWaiting(variantId)).toBe(0);
    // A request preparing its receipt when withdrawal won cannot create a new unmanageable alert.
    expect(await alerts.request({ ...input, withdrawalRequired: true }, 2000)).toBe('cap_reached');
    const stale = {
      id: claimed!.id,
      variantId,
      email,
      attemptCount: 1,
      leaseUntil: new Date('2031-10-14T10:10:00.000Z'),
      createdAt: now,
    };
    expect(await alerts.isCurrent(stale)).toBe(false);
    expect(await alerts.reschedule({ alert: stale, nextAttemptAt: now, updatedAt: now, refundAttempt: false })).toBe(
      false,
    );
    await alerts.request(input, 2000);
    await services.withdrawAlerts(token());
    expect(await alerts.countWaiting(variantId)).toBe(1);
  });

  it('invalidates old and new withdrawal links before an in-flight registration resumes', async () => {
    const { services, token, time } = setup();
    const email = contact().email;
    const alerts = new D1AvailabilityAlertRepository(env.COMMERCE_DB);
    const variantId = parseVariantId(`variant_consent_${crypto.randomUUID()}`);
    const input = { variantId, email, consentCopyVersion: 'v1', consentedAt: now };
    // Keep existing work so pruning retains the older, still-valid capability A.
    await alerts.request(input, 2000);
    await services.requestAlertWithdrawal(email);
    const tokenA = token();
    const later = new Date(now.getTime() + 61 * 60 * 1000);
    time(later);
    // Registration B has delivered its link and is paused immediately before its guarded insert.
    await services.requestAlertWithdrawal(email);
    const tokenB = token(1);
    expect(tokenB).not.toBe(tokenA);
    const before = await env.COMMERCE_DB.prepare(
      `SELECT COUNT(*) AS count FROM "EmailConsent"
      WHERE "email" = ? AND "purpose" = 'availability-withdrawal' AND "consumedAt" IS NULL`,
    )
      .bind(email)
      .first<{ count: number }>();
    expect(before?.count).toBe(2);
    await services.withdrawAlerts(tokenB);
    expect(await alerts.countWaiting(variantId)).toBe(0);
    expect(await alerts.request({ ...input, consentedAt: later, withdrawalRequired: true }, 2000)).toBe('cap_reached');
    expect(await alerts.countWaiting(variantId)).toBe(0);
    const after = await env.COMMERCE_DB.prepare(
      `SELECT COUNT(*) AS count FROM "EmailConsent"
      WHERE "email" = ? AND "purpose" = 'availability-withdrawal' AND "consumedAt" IS NULL`,
    )
      .bind(email)
      .first<{ count: number }>();
    expect(after?.count).toBe(0);
    // Only a fresh later request can create new work; neither old link can cancel it.
    await services.requestAlertWithdrawal(email);
    expect(await alerts.request({ ...input, consentedAt: later, withdrawalRequired: true }, 2000)).toBe('accepted');
    await services.withdrawAlerts(tokenA);
    await services.withdrawAlerts(tokenB);
    expect(await alerts.countWaiting(variantId)).toBe(1);
  });

  it('bounds daily attempts and prunes expired capabilities and old address-free counters', async () => {
    const day = '2032-01-01';
    const record = (): EmailConsentRecord => ({
      id: crypto.randomUUID(),
      tokenHash: crypto.randomUUID(),
      purpose: 'newsletter',
      email: contact().email,
      payload: '{}',
      createdAt: `${day}T10:00:00.000Z`,
      expiresAt: '2032-01-02T10:00:00.000Z',
      sentAt: null,
      consumedAt: null,
    });
    const reservations = await Promise.all(Array.from({ length: 22 }, () => repository.reserve(record(), day)));
    expect(reservations.filter(Boolean)).toHaveLength(20);
    const limited = setup();
    limited.time(new Date(`${day}T10:00:00.000Z`));
    await expect(limited.services.requestNewsletter(contact())).resolves.toMatchObject({
      ok: false,
      reason: 'quota_exceeded',
    });
    await expect(limited.services.requestAlertWithdrawal(contact().email)).resolves.toMatchObject({
      ok: false,
      reason: 'quota_exceeded',
    });
    expect(limited.provider.sendEmail).not.toHaveBeenCalled();
    await repository.prune(new Date('2032-03-01T00:00:00.000Z'));
    expect(
      await env.COMMERCE_DB.prepare('SELECT 1 FROM "EmailConsentSendDay" WHERE "day" = ?').bind(day).first(),
    ).toBeNull();
    expect(
      await env.COMMERCE_DB.prepare('SELECT 1 FROM "EmailConsent" WHERE "expiresAt" <= ?')
        .bind('2032-03-01T00:00:00.000Z')
        .first(),
    ).toBeNull();
  });
});
