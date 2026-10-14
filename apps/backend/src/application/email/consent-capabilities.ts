import type { EmailProviderGateway, EmailProviderOperationResult, ProviderNewsletterContact } from './spi';
import type { EmailRuntimeConfig } from './config';
import { sendTransactionalEmail } from './transactional-email';

export type EmailConsentPurpose = 'newsletter' | 'availability-withdrawal';
export type EmailConsentRecord = {
  id: string;
  tokenHash: string;
  purpose: EmailConsentPurpose;
  email: string;
  payload: string;
  createdAt: string;
  expiresAt: string;
  sentAt: string | null;
  consumedAt: string | null;
};

export interface EmailConsentRepository {
  /** Reuses an unsent attempt for one hour; a sent attempt suppresses repeats during that hour. */
  reserve(record: EmailConsentRecord, day: string): Promise<EmailConsentRecord | null>;
  markSent(tokenHash: string, now: Date): Promise<void>;
  /** Atomic single-use claim. Failed activation requires a fresh request after the cooldown. */
  consumeNewsletter(tokenHash: string, now: Date): Promise<ProviderNewsletterContact | null>;
  /** Atomically deletes queued/leased alerts and consumes the capability; unknown tokens are harmless. */
  withdrawAlerts(tokenHash: string, now: Date): Promise<void>;
  prune(now: Date): Promise<void>;
}

export async function hashEmailConsentToken(token: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)));
}

// Deriving from a random challenge ID allows identical provider retries without persisting a raw bearer token.
async function consentToken(id: string, config: EmailRuntimeConfig): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(config.apiKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`blackbox-email-consent-v1:${id}`)));
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createEmailConsentServices(input: {
  config: EmailRuntimeConfig;
  provider: EmailProviderGateway;
  repository: EmailConsentRepository;
  now?: () => Date;
}) {
  const { config, provider, repository } = input;
  const now = input.now ?? (() => new Date());

  async function requestLink(
    purpose: EmailConsentPurpose,
    email: string,
    contact?: ProviderNewsletterContact,
  ): Promise<EmailProviderOperationResult> {
    const requestedAt = now();
    const id = crypto.randomUUID();
    const token = await consentToken(id, config);
    const expiresAt = new Date(requestedAt);
    if (purpose === 'newsletter') expiresAt.setUTCHours(expiresAt.getUTCHours() + 24);
    else expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 12);
    await repository.prune(requestedAt);
    const record = await repository.reserve(
      {
        id,
        tokenHash: await hashEmailConsentToken(token),
        purpose,
        // Newsletter keeps the exact mailbox for delivery and activation; alerts are stored lowercased.
        email: purpose === 'newsletter' ? email.trim() : email.trim().toLowerCase(),
        payload: JSON.stringify(contact ? { ...contact, email: email.trim() } : {}),
        createdAt: requestedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        sentAt: null,
        consumedAt: null,
      },
      requestedAt.toISOString().slice(0, 10),
    );
    // Limits apply independently of membership; never acknowledge a new request without a usable link.
    if (!record) {
      return { ok: false, reason: 'quota_exceeded', retryable: true };
    }
    if (record.sentAt || record.consumedAt) return { ok: true };
    const retryToken = await consentToken(record.id, config);
    if ((await hashEmailConsentToken(retryToken)) !== record.tokenHash) {
      // A rotated provider key cannot reconstruct an unsent attempt; existing delivered links still validate.
      return { ok: false, reason: 'configuration', retryable: false };
    }
    const url = new URL('email-preferences/', config.emailBrandHomeUrl);
    url.hash = new URLSearchParams({ action: purpose, token: retryToken }).toString();
    const newsletter = purpose === 'newsletter';
    const subject = newsletter
      ? 'Confirm your BlackBox Records newsletter request'
      : 'Manage your BlackBox Records availability alerts';
    const text = newsletter
      ? `Confirm this newsletter request within 24 hours: ${url.href}\nIf you did not request it, ignore this email. Existing unsubscribe preferences remain in place.`
      : `Withdraw all pending availability alerts for this email address: ${url.href}\nIf you did not request this email, ignore it. This link does not sign you up for the newsletter.`;
    try {
      const result = await sendTransactionalEmail(provider, config, {
        to: record.email,
        purpose: `consent-${purpose}`,
        idempotencyEntityId: record.id,
        content: {
          subject,
          text,
          html: `<p>${text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\n', '<br>')}</p><p><a href="${url.href.replaceAll('&', '&amp;')}">${newsletter ? 'Confirm newsletter request' : 'Withdraw pending alerts'}</a></p>`,
        },
      });
      if (result.status === 'failed')
        return { ok: false, reason: result.providerSafeReason ?? 'unknown', retryable: result.retryable };
      await repository.markSent(record.tokenHash, requestedAt);
      return { ok: true };
    } catch {
      return { ok: false, reason: 'provider_unavailable', retryable: true };
    }
  }

  return {
    requestNewsletter: (contact: ProviderNewsletterContact) => requestLink('newsletter', contact.email, contact),
    requestAlertWithdrawal: (email: string) => requestLink('availability-withdrawal', email),
    confirmNewsletter: async (token: string): Promise<EmailProviderOperationResult | null> => {
      const contact = await repository.consumeNewsletter(await hashEmailConsentToken(token), now());
      if (!contact) return null;
      // Never restore a consumed capability after a partial/unknown provider outcome: replay must not re-opt in.
      try {
        return await provider.registerNewsletterContact({
          ...contact,
          properties: { ...contact.properties, consentedAt: now().toISOString() },
          ownershipVerified: true,
        });
      } catch {
        return { ok: false, reason: 'provider_unavailable', retryable: false };
      }
    },
    withdrawAlerts: async (token: string) => repository.withdrawAlerts(await hashEmailConsentToken(token), now()),
  };
}
