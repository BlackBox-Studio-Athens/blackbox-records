export { EmailConfigurationError } from './errors';
export { readEmailRuntimeConfig } from './config';
export type { EmailRuntimeBindingValues, EmailRuntimeConfig } from './config';
export { buildPaidOrderEmailPreviews } from './paid-order-email-previews';
export type { PaidOrderEmailPreview, PaidOrderEmailPreviewName } from './paid-order-email-previews';
export { sendPaidOrderEmailNotifications } from './paid-order-email';
export {
  logNewsletterRegistrationOutcome,
  NEWSLETTER_CONSENT_COPY_VERSION,
  registerNewsletterContact,
} from './newsletter-registration';
export { routeTransactionalEmailRecipient } from './routing';
export { sendTransactionalEmail } from './transactional-email';
export type {
  EmailProviderOperationResult,
  EmailProviderGateway,
  ProviderEmailMessage,
  ProviderNewsletterContact,
} from './spi';
export type {
  EmailMessageContent,
  EmailOperationResult,
  EmailTag,
  NewsletterContactRouting,
  NewsletterRegistrationResult,
  PaidOrderEmailAddress,
  PaidOrderEmailInput,
  PaidOrderEmailLineItem,
  PaidOrderEmailNotificationResult,
  PaidOrderEmailShopperContact,
  RegisterNewsletterContactCommand,
  RoutedEmailRecipient,
  TransactionalEmailCommand,
} from './types';
export type { EmailProviderSafeReason } from './errors';
