import type { EmailRuntimeConfig, NewsletterContactRouting, RoutedEmailRecipient } from './types';

export function routeTransactionalEmailRecipient(
  config: Pick<EmailRuntimeConfig, 'productEnvironmentProfile' | 'uatRecipientOverrideEmail'>,
  intendedRecipient: string,
): RoutedEmailRecipient {
  if (config.productEnvironmentProfile.emailDeliveryPolicy === 'uat-sink' && config.uatRecipientOverrideEmail) {
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
  const recipient = routeTransactionalEmailRecipient(config, intendedSubscriberEmail);
  return {
    contactEmail: recipient.to,
    intendedSubscriberEmail,
    isSinkRouted: recipient.isSinkRouted,
  };
}
