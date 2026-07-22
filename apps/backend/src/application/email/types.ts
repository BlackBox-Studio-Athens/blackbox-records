import type { EmailRuntimeBindingValues, EmailRuntimeConfig } from './config';
import type { EmailProviderSafeReason } from './errors';

export type { EmailRuntimeBindingValues, EmailRuntimeConfig };

export type EmailTag = {
  name: string;
  value: string;
};

export type EmailMessageContent = {
  html: string;
  preheader?: string;
  subject: string;
  text: string;
};

export type TransactionalEmailCommand = {
  content: EmailMessageContent;
  idempotencyEntityId: string;
  purpose: string;
  replyTo?: string;
  tags?: EmailTag[];
  to: string;
};

export type RoutedEmailRecipient = {
  intendedRecipient: string;
  isSinkRouted: boolean;
  to: string;
};

export type EmailOperationResult = {
  idempotencyKey: string;
  providerSafeReason?: EmailProviderSafeReason;
  retryable: boolean;
  routedRecipient?: RoutedEmailRecipient;
  status: 'failed' | 'sent';
};

export type NewsletterConsentSource = 'checkout-opt-in' | 'site-form';

export type RegisterNewsletterContactCommand = {
  consentCopyVersion: string;
  consentSource: NewsletterConsentSource;
  consentedAt: Date;
  email: string;
  properties?: Record<string, string | number | null>;
};

export type NewsletterContactRouting = {
  intendedSubscriberEmail: string;
  isSinkRouted: boolean;
  contactEmail: string;
};

export type NewsletterRegistrationResult = {
  contactRouting: NewsletterContactRouting;
  providerSafeReason?: EmailProviderSafeReason;
  retryable: boolean;
  status: 'failed' | 'registered';
};

export type PaidOrderEmailLineItem = {
  productImage?: {
    altText: string;
    url: string;
  } | null;
  quantity: number;
  storeItemSlug: string;
  variantId: string;
};

export type PaidOrderEmailAddress = {
  city: string;
  country: 'GR';
  line1: string;
  line2: string | null;
  postalCode: string;
  state: string | null;
};

export type PaidOrderEmailShopperContact = {
  email: string;
  phone: string;
};

export type PaidOrderEmailInput = {
  amountTotalMinor: number | null;
  checkoutSessionId: string;
  currencyCode: string | null;
  customerName: string | null;
  lineItems: PaidOrderEmailLineItem[];
  orderReference: string;
  paidAt: Date | null;
  shippingAddress: PaidOrderEmailAddress;
  shopperContact: PaidOrderEmailShopperContact;
};

export type PaidOrderEmailNotificationResult = {
  ops: EmailOperationResult;
  shopper: EmailOperationResult;
};
