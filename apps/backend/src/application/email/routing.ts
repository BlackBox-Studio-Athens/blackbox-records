import type { EmailRuntimeConfig, NewsletterContactRouting, RoutedEmailRecipient } from './types';

export function routeTransactionalEmailRecipient(
  config: Pick<EmailRuntimeConfig, 'productEnvironmentProfile' | 'uatRecipientOverrideEmail'>,
  intendedRecipient: string,
): RoutedEmailRecipient {
  if (config.productEnvironmentProfile.emailRoutingMode === 'uat-sink' && config.uatRecipientOverrideEmail) {
    return {
      intendedRecipient,
      isSinkRouted: true,
      to: config.uatRecipientOverrideEmail,
    };
  }

  return {
    intendedRecipient,
    isSinkRouted: false,
    to: intendedRecipient,
  };
}

export function routeNewsletterContact(
  config: Pick<EmailRuntimeConfig, 'productEnvironmentProfile' | 'uatRecipientOverrideEmail'>,
  intendedSubscriberEmail: string,
): NewsletterContactRouting {
  if (config.productEnvironmentProfile.emailRoutingMode === 'uat-sink' && config.uatRecipientOverrideEmail) {
    return {
      contactEmail: config.uatRecipientOverrideEmail,
      intendedSubscriberEmail,
      isSinkRouted: true,
    };
  }

  return {
    contactEmail: intendedSubscriberEmail,
    intendedSubscriberEmail,
    isSinkRouted: false,
  };
}
