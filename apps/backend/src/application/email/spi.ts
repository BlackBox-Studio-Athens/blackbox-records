import type { EmailProviderSafeReason } from './errors';
import type { EmailTag } from './types';

export type EmailProviderOperationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: EmailProviderSafeReason;
      retryable: boolean;
    };

export type ProviderEmailMessage = {
  from: string;
  html: string;
  idempotencyKey: string;
  replyTo: string;
  subject: string;
  tags: EmailTag[];
  text: string;
  to: string;
};

export type ProviderNewsletterContact = {
  email: string;
  properties: Record<string, string | number | null>;
  segmentId: string | null;
  topicId: string;
};

export interface EmailProviderGateway {
  registerNewsletterContact(contact: ProviderNewsletterContact): Promise<EmailProviderOperationResult>;
  sendEmail(message: ProviderEmailMessage): Promise<EmailProviderOperationResult>;
}
