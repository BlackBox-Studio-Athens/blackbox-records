import { z } from 'zod';

import { routeNewsletterContact } from './routing';
import type { EmailProviderGateway } from './spi';
import type {
  EmailRuntimeConfig,
  NewsletterConsentSource,
  NewsletterRegistrationResult,
  RegisterNewsletterContactCommand,
} from './types';

const emailAddress = z.string().trim().email();

export type NewsletterOutcomeLogger = Pick<Console, 'info' | 'warn'>;

export const NEWSLETTER_CONSENT_COPY_VERSION = 'blackbox-newsletter-v1';

export async function registerNewsletterContact(
  provider: EmailProviderGateway,
  config: EmailRuntimeConfig,
  command: RegisterNewsletterContactCommand,
): Promise<NewsletterRegistrationResult> {
  const intendedSubscriberEmail = emailAddress.parse(command.email);
  const contactRouting = routeNewsletterContact(config, intendedSubscriberEmail);
  const sinkRoutingProperties: Record<string, string> = contactRouting.isSinkRouted ? { intendedSubscriberEmail } : {};
  const providerResult = await provider.registerNewsletterContact({
    email: contactRouting.contactEmail,
    properties: {
      consentCopyVersion: command.consentCopyVersion,
      consentSource: command.consentSource,
      consentedAt: command.consentedAt.toISOString(),
      ...sinkRoutingProperties,
      newsletterTopicId: config.newsletterTopicId,
      ...(command.properties ?? {}),
    },
    segmentId: config.newsletterSegmentId,
    topicId: config.newsletterTopicId,
  });

  if (!providerResult.ok) {
    return {
      contactRouting,
      providerSafeReason: providerResult.reason,
      retryable: providerResult.retryable,
      status: 'failed',
    };
  }

  return {
    contactRouting,
    retryable: false,
    status: 'registered',
  };
}

export function logNewsletterRegistrationOutcome(
  logger: NewsletterOutcomeLogger,
  result: NewsletterRegistrationResult,
  context: {
    source: NewsletterConsentSource;
  },
): void {
  const outcome = {
    event: 'newsletter_registration_outcome',
    retryable: result.retryable,
    safeReason: result.status === 'failed' ? (result.providerSafeReason ?? 'unknown') : undefined,
    sinkRouted: result.contactRouting.isSinkRouted,
    source: context.source,
    status: result.status,
  };

  if (result.status === 'registered') {
    logger.info(outcome);
  } else {
    logger.warn(outcome);
  }
}
