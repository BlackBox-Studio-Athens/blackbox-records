export { EmailConfigurationError } from './errors';
export { readEmailRuntimeConfig, UAT_RESEND_RECEIVING_SINK_EMAIL } from './config';
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
export {
  buildServicesInquiryEmail,
  createServicesInquiryEmailTags,
  SERVICES_INQUIRY_EMAIL_PURPOSE,
  SERVICES_INQUIRY_FIELD_LIMITS,
  SERVICES_INQUIRY_RECIPIENT_ALIAS_BY_SERVICE,
  SERVICES_INQUIRY_SERVICES,
  validateServicesInquiryInput,
} from './services-inquiry';
export type { ServicesInquiryInput, ServicesInquiryService } from './services-inquiry';
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
