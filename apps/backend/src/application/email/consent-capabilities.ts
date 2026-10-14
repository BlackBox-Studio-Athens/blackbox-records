import type { EmailProviderGateway, EmailProviderOperationResult, ProviderNewsletterContact } from './spi';
import type { EmailRuntimeConfig } from './config';
import {
  renderShopperButtonLink,
  renderShopperEmailFrame,
  renderShopperParagraph,
  shopperBrandFontStylesheetUrl,
  type PaidOrderEmailBrand,
} from './paid-order-templates';
import { createBlackBoxEmailTemplate } from './templates';
import { sendTransactionalEmail } from './transactional-email';
import type { EmailMessageContent } from './types';

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

const consentEmailCopy = {
  newsletter: {
    subject: 'Confirm your BlackBox Records newsletter signup',
    preheader: 'One click to start receiving release, distro and event updates.',
    sectionLabel: 'Newsletter',
    title: 'Confirm your email',
    intro:
      'Confirm that you want BlackBox Records release, distro and event updates at this address. The link works for 24 hours.',
    action: 'Confirm newsletter request',
    footer: [
      "Didn't sign up? Ignore this email and you won't be added.",
      'If you unsubscribed from our emails before, confirming does not undo that.',
    ],
  },
  'availability-withdrawal': {
    subject: 'Manage your BlackBox Records availability alerts',
    preheader: 'Cancel the item alerts still waiting for this address.',
    sectionLabel: 'Notify me',
    title: 'Your availability alerts',
    intro:
      'Use the button below to cancel every availability alert still waiting for this email address. Keep this email: the link works for 12 months.',
    action: 'Withdraw pending alerts',
    footer: [
      'This link does not sign you up for the newsletter.',
      "Didn't ask for this email? Ignore it and nothing changes.",
    ],
  },
} satisfies Record<EmailConsentPurpose, unknown>;

export function buildEmailConsentEmail(input: {
  purpose: EmailConsentPurpose;
  url: string;
  brand: PaidOrderEmailBrand;
}): EmailMessageContent {
  const copy = consentEmailCopy[input.purpose];
  return createBlackBoxEmailTemplate({
    brandFontStylesheetUrl: shopperBrandFontStylesheetUrl(input.brand),
    subject: copy.subject,
    preheader: copy.preheader,
    bodyHtml: renderShopperEmailFrame({
      brand: input.brand,
      sectionLabel: copy.sectionLabel,
      title: copy.title,
      contentHtml: [
        renderShopperParagraph(copy.intro),
        `<p style="margin:0 0 16px;">${renderShopperButtonLink(input.url, copy.action)}</p>`,
        ...copy.footer.map(renderShopperParagraph),
      ].join(''),
    }),
    bodyText: ['BlackBox Records', copy.title, copy.intro, `${copy.action}: ${input.url}`, ...copy.footer].join('\n'),
  });
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
    try {
      const result = await sendTransactionalEmail(provider, config, {
        to: record.email,
        purpose: `consent-${purpose}`,
        idempotencyEntityId: record.id,
        content: buildEmailConsentEmail({
          purpose,
          url: url.href,
          brand: { homeUrl: config.emailBrandHomeUrl, logoUrl: config.emailBrandLogoUrl },
        }),
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
