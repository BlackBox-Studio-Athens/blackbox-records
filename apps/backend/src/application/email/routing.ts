import type { EmailRuntimeConfig, NewsletterContactRouting, RoutedEmailRecipient } from './types';

export function routeTransactionalEmailRecipient(
  config: Pick<EmailRuntimeConfig, 'appEnvironment' | 'uatRecipientOverrideEmail'>,
  intendedRecipient: string,
): RoutedEmailRecipient {
  if (config.appEnvironment === 'sandbox' && config.uatRecipientOverrideEmail) {
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
  config: Pick<EmailRuntimeConfig, 'appEnvironment' | 'uatRecipientOverrideEmail'>,
  intendedSubscriberEmail: string,
): NewsletterContactRouting {
  if (config.appEnvironment === 'sandbox' && config.uatRecipientOverrideEmail) {
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
